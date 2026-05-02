# Regla: Estilo de Código

> Convenciones que aplican a TODO el código del proyecto.

## Principios universales

1. **Claridad > brevedad.** Un nombre largo y claro le gana a uno corto y críptico.
2. **Consistencia > preferencia personal.** Si el codebase ya tiene un estilo, síguelo aunque tu preferencia sea otra.
3. **Borra antes de comentar.** Código comentado no se commitea. Para eso está Git.
4. **Funciones cortas.** Apunta a ≤ 30 líneas. Si una función llega a 50, busca cómo dividirla.
5. **Niveles de anidamiento ≤ 3.** Más allá, extrae métodos o usa early returns.

## Naming

| Categoría | Convención | Ejemplo |
|---|---|---|
| Clases PHP | `PascalCase` | `HoldBookingUseCase` |
| Métodos PHP | `camelCase` | `confirmPayment()` |
| Variables PHP | `camelCase` | `$bookingId` |
| Constantes | `SCREAMING_SNAKE` | `MAX_HOLD_MINUTES` |
| Tablas SQL | `snake_case` plural | `booking_slots` |
| Columnas SQL | `snake_case` singular | `created_at` |
| Componentes React | `PascalCase` | `BookingCard` |
| Hooks React | `camelCase` con `use` | `useBookings` |
| Archivos React | nombre del export principal | `BookingCard.tsx` |
| Branches Git | `kebab-case` con prefijo | `feature/bookings-hold-flow` |

## Anti-patrones de naming

| ❌ | ✅ |
|---|---|
| `data` | `bookings`, `users`, `pendingPayments` |
| `handleClick` | `handleCancelBooking` |
| `temp`, `aux`, `x`, `obj` | `bookingDraft`, `priceTotal`, `currentSlot` |
| `BookingMgr`, `UserHelper` | `BookingService`, `UserPasswordHasher` |
| `boolean isNotInactive` | `boolean isActive` |
| `getUserData()` | `findUserById()` o `findActiveUsers()` |

## Estructura de archivo PHP

```php
<?php

declare(strict_types=1);

namespace App\Application\Booking\HoldBooking;

use App\Domain\Booking\Booking;
// Imports agrupados: vendor → app → tests
// Orden alfabético dentro del grupo

final class HoldBookingUseCase
{
    public function __construct(
        private readonly BookingRepository $repo,
        // Constructor primero
    ) {}

    public function execute(/* ... */): /* ... */
    {
        // Métodos públicos
    }

    private function validatePolicy(/* ... */): void
    {
        // Métodos privados al final
    }
}
```

## Estructura de archivo TS/React

```tsx
// Imports agrupados: librerías → alias internos → relativos
import { useQuery } from '@tanstack/react-query';
import { Money } from '@/shared/lib/money';
import { type Booking } from '../types';

// Tipos arriba
type BookingCardProps = {
  booking: Booking;
};

// Helpers locales (si pequeños)
function formatDuration(minutes: number): string {
  return `${minutes} min`;
}

// Componente principal al final
export function BookingCard({ booking }: BookingCardProps) {
  // ...
}
```

## Comentarios: cuándo SÍ y cuándo NO

### ✅ Comentar

- **Por qué algo es así** cuando no es obvio.
- **Compromisos** ("usamos esta lib porque X, evaluamos Y pero Z").
- **Workarounds** ("el SDK de Culqi tiene este bug, ver issue #123").
- **TODOs accionables** con dueño y ticket: `// TODO(juan): cambiar a v2 API cuando salga, ticket CAN-200`.

### ❌ NO comentar

```php
// Increment counter
$count++;                                  // ❌ obvio

// Validate the input
if (! $valid) throw new Exception();       // ❌ obvio

// This function gets the user
public function getUser() { ... }          // ❌ el nombre ya lo dice

// commented-out code
// $this->oldThing();                      // ❌ borrar siempre
```

## Imports

- **Sin wildcards.** `use Illuminate\Support\Facades\*` ❌. Importa lo que usas.
- **Sin alias innecesarios.** `use Foo as Bar` solo si hay colisión real.
- **Orden:** vendor → app interno → relativos.
- **Borra los que no usas.** El IDE lo hace automático; respétalo.

## Errores y excepciones

### PHP

- Excepciones del dominio extienden `DomainException` propia, no `\Exception`.
- Una excepción específica por error: `BookingAlreadyCancelled`, `SlotNotAvailable`. NO una sola `BookingException` para todo.
- Mensajes en inglés (igual que el resto del código).
- Captura solo lo que sabes manejar. NO `try { } catch (\Throwable) { }` salvo en boundaries.

### TypeScript

- Los errores de la API se mapean a `ApiError` con `code` (string) y `message`.
- Resultado de mutaciones: el componente hace `try/catch` y muestra al usuario.
- NO swallow errors silenciosamente: si capturas, loggea o muestra UI.

## Booleans y nombres

- `isActive`, `hasPaid`, `canCancel`, `shouldRetry` (positivos).
- Evitar dobles negaciones: `!isNotEmpty` → `isEmpty`.

## Magic numbers y strings

```php
// ❌
if ($age >= 18) { ... }
$response->status('pending_payment');

// ✅
private const MIN_LEGAL_AGE = 18;
if ($age >= self::MIN_LEGAL_AGE) { ... }
$response->status(BookingStatus::PENDING_PAYMENT);
```

## Imports de Laravel en código del dominio

**Prohibido absoluto.** El agente debe rechazar cualquier sugerencia que importe `Illuminate\*` o `Carbon` dentro de `src/Domain/`.

Ver skill `laravel-hexagonal` para detalles.
