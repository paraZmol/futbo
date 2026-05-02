---
name: booking-concurrency
description: Use this skill when modifying any code path that creates, confirms, cancels, or queries reservations or slot availability. Also use when implementing the slot lifecycle (available → pending_payment → reserved → event_occupied), webhook handlers that change booking state, scheduled jobs that release expired locks, or any logic where two users could race to book the same slot. Critical: triple-locking (Redis distributed lock + UNIQUE constraint on booking_slots.slot_id + optimistic locking via version column) is mandatory and non-negotiable.
---

# Skill: Concurrencia en Reservas

## Propósito

La reserva de slots es **el único punto del sistema donde un fallo de concurrencia es catastrófico**: dos usuarios pagando el mismo horario es un escándalo. Esta skill define las tres líneas de defensa obligatorias y cómo implementarlas correctamente.

---

## 1. Las tres líneas de defensa (todas obligatorias)

```
Cliente HTTP
    │
    ▼
1️⃣  LOCK DISTRIBUIDO REDIS
    SET NX PX  →  TTL 10 minutos sobre clave "slot:{slotId}"
    Solo el ganador continúa. El resto recibe 409 Conflict.
    │
    ▼
2️⃣  TRANSACCIÓN MySQL + OPTIMISTIC LOCKING
    UPDATE slots SET status='pending', version=version+1
    WHERE id=? AND version=?
    Si rowCount==0 → otra transacción ya cambió el slot. Abortar.
    │
    ▼
3️⃣  CONSTRAINT UNIQUE EN booking_slots
    INSERT INTO booking_slots (booking_id, slot_id) VALUES (?, ?)
    Si UNIQUE(slot_id) violado → otro booking llegó. Excepción.
    Esta es la red de seguridad final.
```

**Las tres son obligatorias. Saltarse una porque "es improbable que falle" está prohibido.**

---

## 2. Por qué tres y no una

| Si solo... | Falla cuando... |
|---|---|
| Solo Redis lock | El nodo Redis se reinicia o pierde conexión justo en el momento crítico. El TTL ayuda pero no garantiza atomicidad con MySQL. |
| Solo optimistic locking | Dos requests simultáneos pueden ambos leer `version=5`, ambos calcular el booking, y solo uno gana el UPDATE. El perdedor desperdició trabajo (incluyendo posibles llamadas a la pasarela de pago). El lock Redis evita ese desperdicio temprano. |
| Solo UNIQUE constraint | Es la red final, pero confiar solo en ella significa que el trabajo previo (validaciones, cargos parciales) ya ocurrió. Demasiado tarde. |

Las tres juntas dan: **fast-fail temprano** (Redis), **atomicidad transaccional** (version), **garantía de unicidad a nivel BD** (UNIQUE).

---

## 3. Implementación de la primera línea: LockManager

### 3.1. Puerto (en `Application/Shared/`)

```php
<?php
declare(strict_types=1);

namespace App\Application\Shared;

interface LockManager
{
    /**
     * Adquiere un lock distribuido con TTL.
     * Si no puede adquirirlo en el tiempo de espera, lanza LockNotAcquiredException.
     * Libera automáticamente al terminar el callable o al expirar el TTL.
     *
     * @template T
     * @param callable(): T $callable
     * @return T
     */
    public function withLock(string $key, int $ttlMs, callable $callable): mixed;
}
```

### 3.2. Adaptador Redis (en `Infrastructure/Locking/`)

```php
<?php
declare(strict_types=1);

namespace App\Infrastructure\Locking;

use App\Application\Shared\LockManager;
use App\Application\Shared\LockNotAcquiredException;
use Illuminate\Support\Str;
use Redis;

final readonly class RedisLockManager implements LockManager
{
    public function __construct(private Redis $redis) {}

    public function withLock(string $key, int $ttlMs, callable $callable): mixed
    {
        $token = Str::uuid()->toString();
        $acquired = $this->redis->set($key, $token, ['NX', 'PX' => $ttlMs]);

        if ($acquired === false) {
            throw new LockNotAcquiredException($key);
        }

        try {
            return $callable();
        } finally {
            // Liberación segura: solo borra si el token coincide (no liberar locks ajenos)
            $script = <<<LUA
                if redis.call("get", KEYS[1]) == ARGV[1] then
                    return redis.call("del", KEYS[1])
                else
                    return 0
                end
            LUA;
            $this->redis->eval($script, [$key, $token], 1);
        }
    }
}
```

### 3.3. Reglas

- **TTL:** 10 minutos (`600_000` ms) para flujo completo de pago. El callable debe ser más rápido que eso.
- **Clave:** `slot:{slotId}` siempre. Nunca `booking:{bookingId}` (el booking aún no existe en la primera línea).
- **Token:** UUID único por intento. La liberación lo verifica para no soltar el lock de otro proceso.
- **Eval Lua:** la liberación debe ser atómica. NUNCA hacer `GET` y luego `DEL` en dos comandos separados.

---

## 4. Implementación de la segunda línea: optimistic locking

### 4.1. Esquema de la tabla `slots`

```sql
CREATE TABLE slots (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    field_id BIGINT UNSIGNED NOT NULL,
    starts_at DATETIME NOT NULL,
    ends_at DATETIME NOT NULL,
    status ENUM('available', 'pending_payment', 'reserved', 'event_occupied') NOT NULL,
    version INT UNSIGNED NOT NULL DEFAULT 0,
    -- ...
    INDEX idx_field_starts (field_id, starts_at),
    FOREIGN KEY (field_id) REFERENCES fields(id)
);
```

### 4.2. Patrón de actualización en el repositorio

```php
public function save(Slot $slot): void
{
    $affected = DB::table('slots')
        ->where('id', $slot->id->value())
        ->where('version', $slot->version())  // ← clave del optimistic locking
        ->update([
            'status' => $slot->status()->value,
            'version' => $slot->version() + 1, // incrementar
            'updated_at' => now(),
        ]);

    if ($affected === 0) {
        throw new SlotConcurrentlyModifiedException($slot->id);
    }
}
```

### 4.3. Reglas

- TODO `UPDATE` sobre `slots` debe incluir `WHERE version = ?` y `SET version = version + 1`.
- TODO `UPDATE` sobre `bookings` (cambios de estado) idem.
- Si `affected === 0`, lanzar excepción específica. NO reintentar dentro del mismo caso de uso.
- El reintento, si aplica, ocurre **fuera** del lock Redis (lo decide el cliente o un job).

---

## 5. Implementación de la tercera línea: UNIQUE constraint

### 5.1. Esquema de `booking_slots`

```sql
CREATE TABLE booking_slots (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT UNSIGNED NOT NULL,
    slot_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_booking_slots_slot_id (slot_id),  -- ← red de seguridad final
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (slot_id) REFERENCES slots(id)
);
```

**Nota:** `UNIQUE(slot_id)` significa que un slot solo puede estar en UN booking. Si una reserva se cancela, su fila en `booking_slots` se mantiene pero el `bookings.status='cancelled'` libera el slot conceptualmente (la lógica de negocio ignora bookings cancelados). NO se borra la fila.

Si más adelante se requiere permitir reserva múltiple histórica, se cambia a `UNIQUE(slot_id, booking_id)` y se filtra por estado en queries de disponibilidad.

### 5.2. Captura de violación

```php
try {
    DB::table('booking_slots')->insert([
        'booking_id' => $bookingId->value(),
        'slot_id' => $slotId->value(),
        'created_at' => now(),
    ]);
} catch (QueryException $e) {
    if ($e->errorInfo[1] === 1062) { // MySQL duplicate key error
        throw new SlotAlreadyBookedException($slotId);
    }
    throw $e;
}
```

---

## 6. Flujo completo: caso de uso de creación

```php
<?php
declare(strict_types=1);

namespace App\Application\Reservations;

use App\Application\Shared\Clock;
use App\Application\Shared\LockManager;
use App\Application\Shared\TransactionManager;
use App\Domain\Reservations\Booking;
use App\Domain\Reservations\BookingRepository;
use App\Domain\Reservations\Slot;
use App\Domain\Reservations\SlotAlreadyBookedException;
use App\Domain\Reservations\SlotRepository;

final readonly class CreateBookingUseCase
{
    public function __construct(
        private LockManager $locks,
        private TransactionManager $tx,
        private SlotRepository $slots,
        private BookingRepository $bookings,
        private Clock $clock,
    ) {}

    public function execute(CreateBookingInput $input): BookingOutput
    {
        $lockKey = "slot:{$input->slotId->value()}";

        // 1️⃣ Lock distribuido
        return $this->locks->withLock($lockKey, ttlMs: 600_000, fn() =>
            // 2️⃣ Transacción + optimistic locking
            $this->tx->run(function () use ($input) {
                $slot = $this->slots->findOrFail($input->slotId);

                if (!$slot->isAvailable($this->clock->now())) {
                    throw new SlotAlreadyBookedException($input->slotId);
                }

                $booking = Booking::create(
                    userId: $input->userId,
                    slot: $slot,
                    priceAtBooking: $slot->currentPrice(),
                    now: $this->clock->now(),
                );

                $this->bookings->save($booking);
                $slot->reserve($booking->id, $this->clock->now()); // marca pending_payment
                $this->slots->save($slot); // ← optimistic lock dentro

                // 3️⃣ INSERT en booking_slots (dispara UNIQUE si carrera)
                $this->bookings->linkSlot($booking->id, $slot->id);

                return BookingOutput::fromDomain($booking);
            })
        );
    }
}
```

---

## 7. Reversión por TTL

Cuando un lock expira sin confirmación de pago, el slot debe volver a `available`. Esto NO se hace por reloj del lock Redis sino por un job programado.

### 7.1. Job de reversión

```php
// Infrastructure/Jobs/ReleaseExpiredPendingSlotsJob.php
public function handle(SlotRepository $slots, Clock $clock): void
{
    $expired = $slots->findPendingBefore($clock->now()->modify('-10 minutes'));

    foreach ($expired as $slot) {
        try {
            $slot->releaseExpired($clock->now());
            $slots->save($slot); // optimistic lock protege contra race
        } catch (SlotConcurrentlyModifiedException) {
            // alguien confirmó el pago en este micro-instante; no hacer nada
            continue;
        }
    }
}
```

Programado en `app/Console/Kernel.php` cada 60 segundos.

---

## 8. Confirmación por webhook de pago

El handler del webhook NO crea el booking; **lo confirma**.

```php
// Application/Reservations/ConfirmBookingPaymentUseCase.php
public function execute(ConfirmBookingPaymentInput $input): void
{
    $this->tx->run(function () use ($input) {
        $booking = $this->bookings->findOrFail($input->bookingId);

        if ($booking->status() === BookingStatus::Reserved) {
            return; // idempotencia: ya estaba confirmado
        }

        if ($booking->status() !== BookingStatus::PendingPayment) {
            throw new InvalidBookingStateException($input->bookingId, $booking->status());
        }

        $booking->confirmPayment($input->transactionId, $this->clock->now());
        $this->bookings->save($booking);

        $slot = $this->slots->findOrFail($booking->slotId);
        $slot->confirmReservation();
        $this->slots->save($slot);
    });
}
```

**Idempotencia obligatoria.** El webhook puede llegar dos veces. La primera confirma; la segunda no hace nada y devuelve 200.

---

## 9. Tests obligatorios

Cada cambio en este flujo requiere:

1. **Test unitario** del dominio para transiciones de estado.
2. **Test de integración** que simule dos requests concurrentes contra el mismo slot. Solo uno debe ganar; el otro debe recibir excepción.
3. **Test del job de reversión** que verifique liberación tras TTL.
4. **Test del webhook** que verifique idempotencia (mismo webhook dos veces → un solo cambio).

Detalles en skill `testing-pyramid`.

---

## 10. Checklist antes de proponer commit

- [ ] Toda creación de booking pasa por las 3 líneas de defensa.
- [ ] El lock Redis usa `withLock()` (no `acquire`/`release` manual).
- [ ] Todo `UPDATE slots` incluye `WHERE version = ?`.
- [ ] La tabla `booking_slots` tiene `UNIQUE(slot_id)`.
- [ ] El handler de webhook es idempotente.
- [ ] Existe job programado de liberación por TTL.
- [ ] Tests cubren caso de carrera (al menos uno).

---

## 11. Recursos

- Diagrama de la máquina de estados del slot: ver Documento Maestro §4.
- Pseudocódigo y razonamiento detallado: `references/why-three-locks.md`
