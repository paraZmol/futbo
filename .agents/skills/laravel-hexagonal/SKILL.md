---
name: laravel-hexagonal
description: Use this skill whenever the agent needs to add, modify, or refactor Laravel/PHP backend code. This includes creating new use cases, domain entities, repositories, controllers, services, jobs, or any code under backend/app/. Also use when the agent must validate that a piece of code respects the hexagonal architecture (Domain/Application/Infrastructure separation) or when checking if a class belongs in the right layer. Do NOT use for frontend (React) code, database migrations (separate skill), or pure git operations.
---

# Skill: Arquitectura Hexagonal en Laravel

## Propósito

Garantizar que TODO código PHP del backend respete las tres capas: `Domain`, `Application`, `Infrastructure`. Esta separación es la respuesta directa al problema de "construir y destruir código": el dominio queda blindado contra cambios de framework, librería o vendor.

---

## 1. Las tres capas (regla rígida)

```
backend/app/
├── Domain/              ← Lógica pura del negocio. CERO Laravel.
├── Application/         ← Casos de uso. Orquesta el dominio. Define puertos.
└── Infrastructure/      ← Adaptadores. Eloquent, HTTP, Redis, terceros.
```

**Regla de dependencias (no negociable):**

```
Infrastructure ──depende de──> Application ──depende de──> Domain

Domain NO depende de NADA externo.
Application solo depende de Domain.
Infrastructure depende de Application y Domain.
```

Si una clase del `Domain` tiene `use Illuminate\...`, `use App\Models\...`, `use Carbon\...`, `extends Model`, `Auth::...`, `DB::...`, `Cache::...`, `Log::...` → **el código está mal y debe corregirse antes de mergear.**

Hay un test automatizado (`deptrac`) que valida esto en CI. Si rompe, el PR no entra a `main`.

---

## 2. Qué va en cada capa

### 2.1. Domain (`app/Domain/`)

**Permitido:**
- Entidades (clases con identidad y estado)
- Value Objects (clases inmutables sin identidad: `Money`, `SlotId`, `Email`, `PhoneNumber`)
- Enumeraciones de estados (`SlotStatus`, `BookingStatus`)
- Excepciones de dominio (`SlotAlreadyBookedException`, `InvalidPriceException`)
- Interfaces de repositorios (sin implementación)
- Reglas de negocio puras (cálculo de comisión, validación de transición de estado)

**Prohibido:**
- `use Illuminate\*`
- `use Carbon\Carbon` (usar `\DateTimeImmutable` nativo)
- `use App\Models\*` (los modelos Eloquent son Infrastructure)
- Cualquier `Facade` (`DB`, `Cache`, `Log`, `Auth`, `Storage`)
- Anotaciones de Laravel
- Llamadas HTTP, queries SQL, lecturas de archivo

**Ejemplo correcto:**

```php
<?php
declare(strict_types=1);

namespace App\Domain\Reservations;

use App\Domain\Shared\Money;
use DateTimeImmutable;

final class Booking
{
    public function __construct(
        public readonly BookingId $id,
        public readonly UserId $userId,
        public readonly VenueId $venueId,
        public readonly Money $priceAtBooking,
        public readonly DateTimeImmutable $createdAt,
        private BookingStatus $status,
        private int $version,
    ) {}

    public function cancel(DateTimeImmutable $now, BookingStatus $reason): void
    {
        if ($this->status === BookingStatus::Cancelled) {
            throw new BookingAlreadyCancelledException($this->id);
        }
        if ($this->createdAt->diff($now)->days > 30) {
            throw new BookingTooOldToCancelException($this->id);
        }
        $this->status = BookingStatus::Cancelled;
        $this->version++;
    }

    public function status(): BookingStatus { return $this->status; }
    public function version(): int { return $this->version; }
}
```

### 2.2. Application (`app/Application/`)

**Permitido:**
- Casos de uso (`CreateBookingUseCase`, `CancelBookingUseCase`)
- DTOs de entrada/salida (`CreateBookingInput`, `BookingOutput`)
- Definición de **puertos** (interfaces que el dominio necesita: `BookingRepository`, `LockManager`, `PaymentGateway`, `Clock`)
- Orquestación de varios servicios de dominio
- Manejo de transacciones a nivel de caso de uso (vía interfaz `TransactionManager`)

**Prohibido:**
- Importar Eloquent directamente
- Importar Request/Response de HTTP
- Llamadas a APIs externas directas (debe pasar por un puerto)

**Ejemplo correcto:**

```php
<?php
declare(strict_types=1);

namespace App\Application\Reservations;

use App\Domain\Reservations\Booking;
use App\Domain\Reservations\BookingRepository;
use App\Domain\Reservations\SlotRepository;
use App\Domain\Reservations\SlotAlreadyBookedException;
use App\Application\Shared\LockManager;
use App\Application\Shared\Clock;
use App\Application\Shared\TransactionManager;

final readonly class CreateBookingUseCase
{
    public function __construct(
        private BookingRepository $bookings,
        private SlotRepository $slots,
        private LockManager $locks,
        private Clock $clock,
        private TransactionManager $tx,
    ) {}

    public function execute(CreateBookingInput $input): BookingOutput
    {
        $lockKey = "slot:{$input->slotId->value()}";
        return $this->locks->withLock($lockKey, ttlMs: 600_000, fn() =>
            $this->tx->run(function () use ($input) {
                $slot = $this->slots->findOrFail($input->slotId);
                if (!$slot->isAvailable()) {
                    throw new SlotAlreadyBookedException($input->slotId);
                }
                $booking = Booking::create($input, $this->clock->now());
                $this->bookings->save($booking);
                $slot->reserve($booking->id);
                $this->slots->save($slot);
                return BookingOutput::fromDomain($booking);
            })
        );
    }
}
```

### 2.3. Infrastructure (`app/Infrastructure/`)

**Permitido (es donde vive Laravel):**
- Modelos Eloquent (`app/Infrastructure/Persistence/Eloquent/Models/`)
- Repositorios concretos (`EloquentBookingRepository implements BookingRepository`)
- Controllers HTTP (`app/Infrastructure/Http/Controllers/`)
- Form Requests, Resources de API
- Middleware
- Jobs y Listeners
- Adaptadores a servicios externos (`StripePaymentGateway`, `MetaWhatsappAdapter`)
- Implementación de `LockManager` con Redis
- Implementación de `Clock` con `Carbon` o `DateTimeImmutable`

**Reglas:**
- Una clase Infrastructure puede importar Domain y Application libremente.
- Las traducciones entre Eloquent Model y Domain Entity ocurren en el repositorio (mapper).
- Los Form Requests validan formato; las reglas de negocio validan en el caso de uso.

**Ejemplo correcto:**

```php
<?php
declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Reservations\Booking;
use App\Domain\Reservations\BookingId;
use App\Domain\Reservations\BookingRepository;
use App\Infrastructure\Persistence\Eloquent\Models\BookingModel;
use App\Infrastructure\Persistence\Eloquent\Mappers\BookingMapper;

final readonly class EloquentBookingRepository implements BookingRepository
{
    public function __construct(private BookingMapper $mapper) {}

    public function save(Booking $booking): void
    {
        $model = BookingModel::find($booking->id->value()) ?? new BookingModel();
        $this->mapper->toModel($booking, $model);
        $model->save();
    }

    public function findOrFail(BookingId $id): Booking
    {
        $model = BookingModel::findOrFail($id->value());
        return $this->mapper->toDomain($model);
    }
}
```

---

## 3. Estructura de carpetas obligatoria

```
backend/app/
├── Domain/
│   ├── Reservations/
│   │   ├── Booking.php
│   │   ├── BookingId.php
│   │   ├── BookingStatus.php
│   │   ├── BookingRepository.php          ← interfaz
│   │   ├── SlotAlreadyBookedException.php
│   │   └── ...
│   ├── Venues/
│   ├── Payments/
│   ├── Users/
│   └── Shared/
│       ├── Money.php
│       └── DomainException.php
│
├── Application/
│   ├── Reservations/
│   │   ├── CreateBookingUseCase.php
│   │   ├── CancelBookingUseCase.php
│   │   ├── CreateBookingInput.php          ← DTO
│   │   └── BookingOutput.php               ← DTO
│   ├── Payments/
│   └── Shared/
│       ├── LockManager.php                 ← puerto
│       ├── Clock.php                       ← puerto
│       └── TransactionManager.php          ← puerto
│
└── Infrastructure/
    ├── Http/
    │   └── Controllers/
    │       ├── BookingController.php
    │       └── ...
    ├── Persistence/
    │   └── Eloquent/
    │       ├── Models/
    │       │   ├── BookingModel.php
    │       │   └── ...
    │       ├── Repositories/
    │       │   └── EloquentBookingRepository.php
    │       └── Mappers/
    │           └── BookingMapper.php
    ├── Locking/
    │   └── RedisLockManager.php
    ├── Time/
    │   └── SystemClock.php
    ├── Payments/
    │   └── StripePaymentGateway.php
    └── Providers/
        └── DomainServiceProvider.php       ← bind interfaces a impls
```

---

## 4. Bindings (cómo se conectan las capas)

En `app/Infrastructure/Providers/DomainServiceProvider.php`:

```php
<?php
declare(strict_types=1);

namespace App\Infrastructure\Providers;

use App\Application\Shared\Clock;
use App\Application\Shared\LockManager;
use App\Domain\Reservations\BookingRepository;
use App\Infrastructure\Locking\RedisLockManager;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentBookingRepository;
use App\Infrastructure\Time\SystemClock;
use Illuminate\Support\ServiceProvider;

final class DomainServiceProvider extends ServiceProvider
{
    public array $bindings = [
        Clock::class => SystemClock::class,
        LockManager::class => RedisLockManager::class,
        BookingRepository::class => EloquentBookingRepository::class,
        // ... resto
    ];
}
```

Registrarlo en `bootstrap/providers.php`.

---

## 5. Checklist antes de proponer commit

Cuando el agente termina un cambio que toca PHP, verifica:

- [ ] `Domain/` no importa nada de `Illuminate`, `Carbon`, `App\Models`, ni Facades.
- [ ] `Application/` no importa Eloquent ni clases de `Infrastructure/`.
- [ ] Toda interfaz nueva tiene su binding registrado en `DomainServiceProvider`.
- [ ] Tests unitarios del dominio NO requieren Laravel para correr (son `PHPUnit` puro, sin `RefreshDatabase`).
- [ ] `./vendor/bin/deptrac analyse` pasa.
- [ ] `./vendor/bin/pint --test` pasa (no hace falta correr fix, eso lo hace el dev).
- [ ] Los nuevos archivos tienen `declare(strict_types=1);` al tope.
- [ ] Los DTOs son `final readonly class`.

Si alguno falla, el agente lo reporta y propone la corrección antes de sugerir commit.

---

## 6. Errores comunes y cómo el agente los detecta

Cuando el agente revisa código existente o nuevo, busca:

| Antipatrón | Detección | Corrección |
|---|---|---|
| `class Booking extends Model` en `Domain/` | `extends Model` o `use Illuminate` en archivo bajo `Domain/` | Mover el modelo a `Infrastructure/Persistence/Eloquent/Models/`, crear entidad de dominio aparte |
| Caso de uso usa `DB::transaction(...)` | `DB::` o `\DB::` en `Application/` | Inyectar `TransactionManager` y usar `$this->tx->run(...)` |
| Controller llama directamente a Eloquent | `Model::query()->...` en `Http/Controllers/` | Llamar al caso de uso, que use el repositorio |
| Repositorio devuelve `Eloquent\Collection` | tipo de retorno `Collection<Model>` en interfaz de `Domain/` | Devolver `array` de entidades de dominio o iterables tipados |
| Validación de regla de negocio en `FormRequest` | Reglas como `unique:bookings` que dependen de estado de dominio | Mover validación al caso de uso, lanzar excepción de dominio |
| `Carbon::now()` en dominio | `use Carbon\Carbon` bajo `Domain/` | Inyectar `Clock` y usar `$this->clock->now()` |

---

## 7. Recursos

- Ejemplo completo de un caso de uso: `assets/example-use-case/`
- Patrones de testing por capa: ver skill `testing-pyramid`
- Configuración de `deptrac.yaml`: `assets/deptrac.yaml`
