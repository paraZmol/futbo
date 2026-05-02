---
name: testing-pyramid
description: Diseña, escribe y revisa tests siguiendo la pirámide de testing del proyecto (unit > integration > e2e). Se activa cuando el agente debe crear o modificar archivos en tests/, cuando se discute qué tipo de test escribir para una funcionalidad, cuando hay que decidir cobertura de un caso de uso, o cuando se sospecha que faltan tests críticos antes de mergear. Cubre tests del dominio (unit), tests de casos de uso con dobles (integration), tests HTTP completos (feature), y tests e2e con Playwright.
---

# Testing Pyramid — Skill

## La pirámide

```
       ▲    /\
       │   /  \   E2E (5%)        Playwright, flujos críticos.
       │  /----\
       │ /      \  Feature (20%)  HTTP completo, BD real, sin mocks externos.
       │/        \
       │----------\ Integration (25%) Use cases con dobles para puertos externos.
       /            \
      /--------------\ Unit (50%)     Domain puro. Sin BD. Sin red. Sin tiempo real.
```

**Regla 80/20:** la mayoría del valor está en unit + integration. E2E es lento y frágil — úsalo para los 5-10 flujos más críticos.

## Estructura de carpetas

```
tests/
├── Unit/                       # Sólo dominio. Microsegundos por test.
│   └── Domain/
│       ├── Booking/
│       │   ├── BookingTest.php
│       │   ├── BookingStatusTest.php
│       │   └── ValueObjects/
│       │       └── MoneyTest.php
│       └── Pricing/
│           └── PricingServiceTest.php
│
├── Integration/                # Use cases + dobles. Milisegundos por test.
│   └── Application/
│       └── Booking/
│           ├── HoldBookingUseCaseTest.php
│           └── ConfirmBookingUseCaseTest.php
│
├── Feature/                    # HTTP + BD real. Decenas de ms por test.
│   └── Http/
│       └── V1/
│           ├── HoldBookingControllerTest.php
│           └── Webhooks/
│               └── CulqiWebhookControllerTest.php
│
└── E2E/                        # Playwright. Segundos por test.
    └── booking-happy-path.spec.ts
```

## Capa 1 — Unit (Domain)

**Qué probar:** invariantes, value objects, transiciones de estado, cálculos.
**Qué NO usar:** Laravel, Eloquent, BD, Redis, red, fechas reales.

```php
<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Booking;

use App\Domain\Booking\Booking;
use App\Domain\Booking\BookingId;
use App\Domain\Booking\Exceptions\BookingAlreadyCancelled;
use App\Domain\Shared\Money;
use App\Domain\User\UserId;
use App\Domain\Venue\VenueId;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

final class BookingTest extends TestCase
{
    public function test_holds_booking_in_pending_payment_state(): void
    {
        $booking = Booking::hold(
            BookingId::generate(),
            UserId::fromString('user-1'),
            VenueId::fromString('venue-1'),
            Money::pen(80_00),
            new DateTimeImmutable('2026-05-02 10:00:00'),
        );

        $this->assertTrue($booking->status()->isPendingPayment());
    }

    public function test_cannot_cancel_twice(): void
    {
        $booking = $this->aHeldBooking();
        $booking->cancel(new DateTimeImmutable('2026-05-02 10:30:00'));

        $this->expectException(BookingAlreadyCancelled::class);
        $booking->cancel(new DateTimeImmutable('2026-05-02 10:31:00'));
    }

    private function aHeldBooking(): Booking
    {
        return Booking::hold(
            BookingId::generate(),
            UserId::fromString('user-1'),
            VenueId::fromString('venue-1'),
            Money::pen(80_00),
            new DateTimeImmutable('2026-05-02 10:00:00'),
        );
    }
}
```

**Reglas Unit:**
- Hereda de `PHPUnit\Framework\TestCase`, NO `Tests\TestCase` (que carga Laravel).
- Sin `RefreshDatabase`. Sin `factories`. Sin `Mockery` complejo.
- Tests rápidos: la suite Unit completa debe correr en <2 segundos.
- Un test prueba **una cosa**. Nombre descriptivo: `test_<estado>_<acción>_<resultado_esperado>`.

## Capa 2 — Integration (Application)

**Qué probar:** orquestación del use case, llamadas correctas a puertos, manejo de errores.
**Qué usar:** dobles (`InMemoryBookingRepository`, `FakeClock`, `FakeSlotLocker`).

```php
<?php

declare(strict_types=1);

namespace Tests\Integration\Application\Booking;

use App\Application\Booking\HoldBooking\HoldBookingCommand;
use App\Application\Booking\HoldBooking\HoldBookingUseCase;
use Tests\Doubles\Booking\InMemoryBookingRepository;
use Tests\Doubles\Locking\FakeSlotLocker;
use Tests\Doubles\Clock\FakeClock;
use Tests\Doubles\Pricing\StubPricingService;
use PHPUnit\Framework\TestCase;

final class HoldBookingUseCaseTest extends TestCase
{
    public function test_holds_booking_and_releases_lock_on_success(): void
    {
        $repo = new InMemoryBookingRepository();
        $locker = new FakeSlotLocker();
        $pricing = new StubPricingService(amountPen: 80_00);
        $clock = FakeClock::at('2026-05-02 10:00:00');

        $useCase = new HoldBookingUseCase($repo, $locker, $pricing, $clock);

        $result = $useCase->execute(new HoldBookingCommand(
            userId: 'user-1',
            venueId: 'venue-1',
            slotIds: ['slot-1'],
        ));

        $this->assertNotNull($repo->find($result->bookingId));
        $this->assertTrue($locker->isReleased(['slot-1']));
    }

    public function test_releases_lock_when_pricing_fails(): void
    {
        $locker = new FakeSlotLocker();
        $pricing = new StubPricingService(throws: new PricingException());

        $useCase = new HoldBookingUseCase(
            new InMemoryBookingRepository(),
            $locker,
            $pricing,
            FakeClock::at('2026-05-02 10:00:00'),
        );

        try {
            $useCase->execute(new HoldBookingCommand(/* ... */));
            $this->fail('Expected PricingException');
        } catch (PricingException) {
            // expected
        }

        $this->assertTrue($locker->isReleased(['slot-1']));
    }
}
```

**Reglas Integration:**
- Los dobles viven en `tests/Doubles/`, una clase por puerto.
- Un caso "happy path" + N casos "edge" por use case.
- No usar `Mockery::mock()` con `shouldReceive` complicados. Crear un In-Memory real es más mantenible.
- **Siempre probar paths de error**, no solo el camino feliz.

## Capa 3 — Feature (HTTP)

**Qué probar:** el endpoint completo, contrato HTTP, validación, autorización, BD real.
**Qué usar:** `Tests\TestCase` (Laravel), `RefreshDatabase`, factories.
**Qué dobles externos:** pasarela de pago, FCM, WhatsApp (NUNCA llamar APIs reales en tests).

```php
<?php

declare(strict_types=1);

namespace Tests\Feature\Http\V1;

use App\Infrastructure\Persistence\Eloquent\Models\UserModel;
use App\Infrastructure\Persistence\Eloquent\Models\SlotModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class HoldBookingControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_holds_booking_for_authenticated_user(): void
    {
        $user = UserModel::factory()->create();
        $slot = SlotModel::factory()->available()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/bookings/hold', [
                'slot_ids' => [$slot->id],
            ], [
                'Idempotency-Key' => '550e8400-e29b-41d4-a716-446655440000',
            ]);

        $response
            ->assertCreated()
            ->assertJsonStructure([
                'data' => ['id', 'status', 'price_total', 'expires_at'],
            ]);

        $this->assertDatabaseHas('bookings', [
            'user_id' => $user->id,
            'status' => 'pending_payment',
        ]);
    }

    public function test_rejects_without_idempotency_key(): void
    {
        $user = UserModel::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/bookings/hold', ['slot_ids' => ['slot-1']]);

        $response->assertStatus(400)
            ->assertJsonPath('error.code', 'IDEMPOTENCY_KEY_REQUIRED');
    }

    public function test_returns_409_when_slot_already_taken(): void
    {
        // ... setup con slot ya en booking_slots
        $response = /* ... */;
        $response->assertStatus(409)
            ->assertJsonPath('error.code', 'BOOKING_SLOT_TAKEN');
    }
}
```

**Reglas Feature:**
- Una clase por endpoint.
- Cubre: happy path, validación, autorización (sin auth → 401, sin permiso → 403), errores de dominio (409, 422), idempotencia.
- Mockear adaptadores externos en `setUp` (`$this->app->bind(PaymentGateway::class, FakePaymentGateway::class)`).

## Capa 4 — E2E (Playwright)

**Qué probar:** los 5-10 flujos más críticos del producto.
**Qué NO probar aquí:** edge cases (eso va en feature/integration).

Flujos sugeridos para canchas:
1. Usuario reserva un slot, paga, recibe confirmación.
2. Slot se libera tras 10 minutos sin pago.
3. Staff hace check-in con QR.
4. Partner ve sus reservas del día.
5. Webhook de pago recibido confirma reserva.

```ts
// tests/E2E/booking-happy-path.spec.ts
import { test, expect } from '@playwright/test';

test('user can reserve and pay for a slot', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /iniciar sesión/i }).click();
  // ... login
  await page.getByPlaceholder(/buscar cancha/i).fill('Los Olivos');
  await page.getByRole('button', { name: /reservar/i }).first().click();
  await expect(page).toHaveURL(/\/checkout/);
  // ... continúa flujo
});
```

**Reglas E2E:**
- Solo flujos que un humano haría de extremo a extremo.
- Pasarela en modo sandbox. Datos de prueba conocidos.
- Tolera lentitud: timeouts generosos, esperas explícitas con `expect`.
- Si E2E es flaky, el problema no se silencia con retries: se investiga.

## Cobertura de tests por feature antes de mergear

Antes de aprobar un PR que toca un caso de uso del dominio:

- [ ] **Unit tests** del dominio relacionado (entidades, value objects, transiciones).
- [ ] **Integration tests** del use case (happy + al menos 2 edge cases).
- [ ] **Feature tests** del endpoint HTTP (happy + auth + validación + 1 error de dominio).
- [ ] **E2E** solo si el flujo está en la lista crítica.

## Lo que NO se debe testear

- **Frameworks.** No tests para "Eloquent guarda en BD" — eso es probar Laravel.
- **Getters/setters triviales.**
- **Configuración estática.**
- **Código generado** (resources de Laravel, etc.).

## Comandos del proyecto

```bash
# Backend
php artisan test                       # Suite completa
php artisan test --testsuite=Unit      # Solo Unit
php artisan test --filter HoldBooking  # Filtrar por nombre
php artisan test --coverage            # Con cobertura (requiere Xdebug)

# Frontend
npm run test                           # Vitest watch
npm run test:run                       # Una sola pasada
npm run test:e2e                       # Playwright
```

## Anti-patrones que rechazar

| ❌ Anti-patrón | Solución |
|---|---|
| Tests que dependen del orden de ejecución | Cada test es independiente; usa `setUp` |
| Tests que tocan la API real (Culqi, FCM) | Dobles / mocks, siempre |
| `sleep(2)` para esperar | Esperas explícitas (Playwright) o tiempos fakeados (FakeClock) |
| Tests con `now()` real (rompen a medianoche) | Inyectar `Clock` y usar `FakeClock` |
| Test gigante que prueba 5 cosas | Un test, una verificación |
| Comentarios `// TODO: write test` | Si no se va a escribir, borrar la frase |
| Cobertura como métrica única | Cobertura + revisión humana del valor del test |
| Mocks profundos (`shouldReceive('foo')->with(...)->andReturn(...)`) en cascada | Crear un fake real (clase implementando el puerto) |
