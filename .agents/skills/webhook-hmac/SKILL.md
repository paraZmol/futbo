---
name: webhook-hmac
description: Implementa o revisa el manejo de webhooks de la pasarela de pago. Se activa cuando el agente toca código relacionado con recepción de webhooks, validación de firma HMAC, deduplicación por idempotency key, transición de bookings de pending_payment a reserved, o reconciliación activa con la pasarela. El webhook firmado es la ÚNICA fuente de verdad de pagos: nunca se confía en redirecciones del navegador.
---

# Webhook HMAC — Skill

## Principio innegociable

> **Solo el webhook firmado autoriza la transición `pending_payment → reserved`.**
>
> La redirección del navegador (success URL) es solo UX. Mostrar "pago recibido" al usuario sin webhook firmado es engañar al usuario.

## Pipeline obligatorio del webhook

Todo webhook entrante pasa por este pipeline en este orden exacto:

```
1. Verificar firma HMAC          ← si falla: 401 + log + STOP
2. Verificar timestamp (≤5 min)  ← si falla: 401 (replay attack)
3. Lookup en webhook_events      ← si existe: 200 OK silencioso (idempotente)
4. Insertar en webhook_events    ← lock por unique constraint
5. Encolar job de procesamiento  ← respuesta 200 OK al gateway
6. Procesar async (job)          ← actualiza booking, emite eventos
```

**Crítico:** el endpoint del webhook responde 200 OK lo más rápido posible. El procesamiento real va en cola (Horizon).

## Verificación de firma (template)

```php
<?php

declare(strict_types=1);

namespace App\Infrastructure\Http\Controllers\Webhooks;

use App\Application\Payment\ProcessWebhook\ProcessWebhookCommand;
use App\Application\Payment\ProcessWebhook\ProcessWebhookUseCase;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

final class CulqiWebhookController
{
    public function __construct(
        private readonly ProcessWebhookUseCase $useCase,
        private readonly string $webhookSecret,
    ) {}

    public function __invoke(Request $request): Response
    {
        $signature = $request->header('X-Culqi-Signature');
        $timestamp = $request->header('X-Culqi-Timestamp');
        $rawBody = $request->getContent();

        if (! $this->verifySignature($rawBody, $timestamp, $signature)) {
            logger()->warning('webhook.signature_invalid', [
                'ip' => $request->ip(),
                'timestamp' => $timestamp,
            ]);
            return response('', 401);
        }

        if (! $this->verifyTimestamp($timestamp)) {
            return response('', 401);
        }

        $this->useCase->execute(
            new ProcessWebhookCommand(
                eventId: $request->json('id'),
                rawPayload: $rawBody,
                signature: $signature,
            )
        );

        return response('', 200);
    }

    private function verifySignature(string $body, string $timestamp, string $sig): bool
    {
        $expected = hash_hmac('sha256', $timestamp . '.' . $body, $this->webhookSecret);
        return hash_equals($expected, $sig);
    }

    private function verifyTimestamp(string $timestamp): bool
    {
        $age = time() - (int) $timestamp;
        return $age >= 0 && $age <= 300; // 5 minutos máximo
    }
}
```

**Notas críticas:**
- `hash_equals` y NO `===`. Comparación constante en tiempo (anti timing attack).
- El `rawBody` es `$request->getContent()`, NO `$request->all()` (esto último deserializa y pierde bytes).
- El secret está en `.env` como `CULQI_WEBHOOK_SECRET`. Nunca hardcodeado.

## Deduplicación con `webhook_events`

Tabla:

```sql
CREATE TABLE webhook_events (
    id           CHAR(36) PRIMARY KEY,
    provider     VARCHAR(32) NOT NULL,
    external_id  VARCHAR(128) NOT NULL,
    payload      JSON NOT NULL,
    signature    VARCHAR(255) NOT NULL,
    received_at  DATETIME(6) NOT NULL,
    processed_at DATETIME(6) NULL,
    UNIQUE KEY uniq_provider_external (provider, external_id)
);
```

Lógica:

```php
try {
    DB::table('webhook_events')->insert([
        'id' => Uuid::uuid4()->toString(),
        'provider' => 'culqi',
        'external_id' => $eventId,
        'payload' => $rawPayload,
        'signature' => $signature,
        'received_at' => now(),
    ]);
} catch (UniqueConstraintViolationException) {
    // Webhook duplicado. El gateway está reintentando. Respondemos 200 OK silencioso.
    return;
}

// Encolar procesamiento
ProcessWebhookJob::dispatch($eventId);
```

## Transición de estado en el job

```php
final class ProcessPaymentWebhookJob implements ShouldQueue
{
    public function handle(ConfirmBookingUseCase $useCase): void
    {
        $event = $this->loadEvent();

        match ($event->type) {
            'charge.succeeded' => $useCase->confirm(
                bookingId: $event->payload['metadata']['booking_id'],
                paymentRef: $event->payload['id'],
                amountPaid: $event->payload['amount'],
            ),
            'charge.failed' => $useCase->markPaymentFailed(/* ... */),
            'charge.refunded' => $useCase->refund(/* ... */),
            default => logger()->warning('webhook.unknown_event_type', [
                'type' => $event->type
            ]),
        };
    }
}
```

## Reconciliación activa (red de seguridad)

Aunque el webhook es la fuente de verdad, los webhooks pueden perderse. Por eso hay un job programado cada 60 segundos:

```php
// app/Console/Kernel.php
$schedule->job(new ReconcilePendingPaymentsJob)->everyMinute();
```

Lógica del job:

```php
final class ReconcilePendingPaymentsJob implements ShouldQueue
{
    public function handle(PaymentGateway $gateway, ConfirmBookingUseCase $useCase): void
    {
        $pendingBookings = BookingModel::query()
            ->where('status', 'pending_payment')
            ->where('held_at', '<', now()->subMinutes(2))
            ->where('held_at', '>', now()->subMinutes(15))
            ->limit(50)
            ->get();

        foreach ($pendingBookings as $booking) {
            $charge = $gateway->getCharge($booking->payment_reference);

            if ($charge?->status === 'succeeded') {
                $useCase->confirm(/* ... */);
            }
        }
    }
}
```

## Checklist antes de mergear código de webhook

- [ ] Verificación de firma con `hash_equals`.
- [ ] Verificación de timestamp ≤ 5 min.
- [ ] Inserción en `webhook_events` con UNIQUE.
- [ ] Procesamiento async en cola.
- [ ] Job idempotente (puede ejecutarse 2 veces sin causar daño).
- [ ] Test de replay attack (mismo evento 2 veces).
- [ ] Test de firma inválida (debe responder 401).
- [ ] Test de timestamp viejo (debe responder 401).
- [ ] Job de reconciliación activa configurado.
- [ ] Logs estructurados (sin loggear el secret, sin loggear datos PCI).

## Anti-patrones que el agente DEBE rechazar

| ❌ Anti-patrón | Por qué |
|---|---|
| Confiar en la query string del redirect (`?status=success`) | El usuario puede manipularla. No es firmado por la pasarela. |
| Procesar el webhook síncrono en el controller | Si tarda > 30s, el gateway retrysa y duplica. |
| `$body === $expectedSignature` | Vulnerable a timing attacks. Usar `hash_equals`. |
| Comparar firma sobre `$request->json()` | El JSON se reformatea al deserializar; rompe HMAC. Usar raw body. |
| Cambiar booking a `reserved` en el endpoint del webhook | Lo hace el job async, no el controller. |
| Loggear el header `X-Culqi-Signature` o el `webhook_secret` | Filtra credenciales en logs. |
| No tener reconciliación activa | Si el webhook se pierde, el booking queda en `pending_payment` para siempre. |
