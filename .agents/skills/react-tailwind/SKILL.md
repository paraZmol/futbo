---
name: react-tailwind
description: Genera o revisa código frontend en React con Tailwind. Se activa cuando el agente debe crear, modificar o revisar archivos en resources/js/, cuando se discute un componente, una página, manejo de estado, llamadas a API, formularios, o cualquier asunto del frontend. Establece convenciones de componentes, formularios, errores, accesibilidad y rendimiento. NO se activa para backend ni para CSS puro fuera de Tailwind.
---

# React + Tailwind — Skill

## Stack frontend del proyecto

- **React 19** con hooks. Sin clases.
- **TypeScript estricto.** `strict: true` en `tsconfig.json`.
- **Tailwind 4** con tokens definidos en `tailwind.config.js`.
- **Vite** como bundler.
- **TanStack Query** para data fetching y cache server state.
- **Zustand** para estado UI compartido (no usar Redux).
- **React Hook Form + Zod** para formularios y validación.
- **Vitest + Testing Library** para tests.

## Estructura obligatoria

```
resources/js/
├── app/                      # Configuración de la app (router, providers)
├── pages/                    # Páginas (1 por ruta)
├── features/                 # Módulos de negocio
│   ├── bookings/
│   │   ├── components/       # Componentes específicos del feature
│   │   ├── hooks/            # Hooks específicos
│   │   ├── api/              # Cliente HTTP del feature
│   │   ├── types.ts          # Tipos del dominio frontend
│   │   └── index.ts          # Public API del feature
│   ├── venues/
│   └── auth/
├── shared/                   # Compartido entre features
│   ├── components/           # Botones, inputs, modales genéricos
│   ├── hooks/
│   ├── lib/                  # Helpers (axios client, formatters)
│   └── types/
└── styles/                   # Globals + tokens
```

**Regla:** un feature NO importa de otro feature. Si necesita algo, va a `shared/` o se expone vía `index.ts`.

## Convenciones de componentes

### Anatomía de un componente

```tsx
// resources/js/features/bookings/components/BookingCard.tsx

import { Money } from '@/shared/lib/money';
import { type Booking } from '../types';

type BookingCardProps = {
  booking: Booking;
  onCancel?: (id: string) => void;
};

export function BookingCard({ booking, onCancel }: BookingCardProps) {
  return (
    <article
      aria-labelledby={`booking-${booking.id}-title`}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h3 id={`booking-${booking.id}-title`} className="text-lg font-semibold text-slate-900">
        {booking.venueName}
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        {Money.format(booking.priceTotal, 'PEN')}
      </p>
      {onCancel && (
        <button
          type="button"
          onClick={() => onCancel(booking.id)}
          className="mt-3 inline-flex items-center rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
        >
          Cancelar reserva
        </button>
      )}
    </article>
  );
}
```

**Reglas:**
- `function ComponentName()` con `export` nombrado. **No `default export`** (excepto en pages).
- Props con `type` (no `interface`) y sufijo `Props`.
- Callbacks opcionales con `?`.
- Sin lógica de negocio en el componente. Solo render y composición.
- `aria-*` cuando hay interactividad.
- `type="button"` explícito en `<button>` (evita submits accidentales).

### Cuándo dividir un componente

Dividir cuando:
- Pasa los 150 líneas.
- Tiene más de 4 estados locales (`useState`).
- Mezcla más de un concepto (formulario + lista, header + contenido).
- Una parte se reusa en otro lugar.

## Data fetching con TanStack Query

```tsx
// resources/js/features/bookings/hooks/useBookings.ts

import { useQuery } from '@tanstack/react-query';
import { fetchBookings } from '../api/bookingsApi';

export function useBookings(userId: string) {
  return useQuery({
    queryKey: ['bookings', userId],
    queryFn: () => fetchBookings(userId),
    staleTime: 30_000,
  });
}
```

```tsx
// uso en componente
const { data: bookings, isLoading, error } = useBookings(userId);

if (isLoading) return <BookingsListSkeleton />;
if (error) return <ErrorState onRetry={() => refetch()} />;
return <BookingsList bookings={bookings ?? []} />;
```

**Reglas:**
- **Nunca `useEffect` para fetch.** Usa TanStack Query.
- `queryKey` siempre array, primer elemento es el recurso, después los filtros.
- `staleTime` explícito (no usar el default de 0).
- Loading y error states siempre manejados, no opcionales.

## Mutaciones (POST/PATCH/DELETE)

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuid } from 'uuid';

export function useHoldBooking() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: HoldBookingInput) =>
      api.post('/v1/bookings/hold', input, {
        headers: { 'Idempotency-Key': uuid() },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
```

**Crítico:** todo `POST` que muta envía `Idempotency-Key`. El backend lo exige (Regla de Oro #6).

## Formularios

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const HoldBookingSchema = z.object({
  slotIds: z.array(z.string().uuid()).min(1).max(4),
  notes: z.string().max(280).optional(),
});

type HoldBookingForm = z.infer<typeof HoldBookingSchema>;

export function HoldBookingForm({ onSubmit }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<HoldBookingForm>({
      resolver: zodResolver(HoldBookingSchema),
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* fields */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {isSubmitting ? 'Reservando...' : 'Reservar'}
      </button>
    </form>
  );
}
```

**Reglas:**
- **Validación con Zod** de lado cliente. La validación seria está en backend (esto es solo UX).
- **Botón deshabilitado mientras `isSubmitting`**.
- Errores mostrados junto al campo, con `aria-describedby` apuntando al mensaje.

## Manejo de errores HTTP del backend

El backend usa el envelope estándar (ver skill `api-contracts`):

```json
{
  "error": {
    "code": "BOOKING_SLOT_TAKEN",
    "message": "Otro usuario reservó este slot.",
    "details": {}
  }
}
```

Mapeo en frontend:

```tsx
// shared/lib/apiClient.ts
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details: unknown,
    public status: number,
  ) {
    super(message);
  }
}

// uso
try {
  await holdBooking.mutateAsync(input);
} catch (e) {
  if (e instanceof ApiError && e.code === 'BOOKING_SLOT_TAKEN') {
    toast.error('Ese horario fue tomado. Intenta otro.');
  } else {
    toast.error('Algo salió mal. Intenta de nuevo.');
  }
}
```

## Tailwind: convenciones

- **Usa los tokens del proyecto.** No `text-[#1F3A5F]`, sino `text-brand-primary` (definido en config).
- **Mobile first.** Prefijos `sm:`, `md:`, `lg:` para escalar arriba.
- **Sin clases CSS custom** salvo casos extremos. Si recurres a `@apply`, justifica.
- **Orden recomendado:** layout → spacing → typography → color → effects → states.
- **Si una lista de clases supera ~12 items**, considera extraer a un componente.

## Accesibilidad mínima obligatoria

- Todo `<input>` tiene `<label>` asociado.
- Todo elemento interactivo tiene foco visible (`focus:ring-2`).
- `<button>` para acciones, `<a>` para navegación. Nunca `<div onClick>`.
- Imágenes: `alt` siempre. Si decorativa, `alt=""` explícito.
- Color no es el único indicador de estado (combina con icono o texto).
- Al menos pasar test de teclado: Tab navega todo, Enter/Space activa.

## Anti-patrones que rechazar

| ❌ Anti-patrón | Solución |
|---|---|
| `useEffect` con fetch | TanStack Query |
| Estado server en `useState` | Query cache |
| `any` en TypeScript | Tipos específicos o `unknown` + narrowing |
| Default exports en componentes | Named exports |
| `<div>` clickeable | `<button>` |
| Inline styles (`style={{}}`) | Clases Tailwind |
| `dangerouslySetInnerHTML` con datos del usuario | Sanitizar o evitar |
| Lógica de negocio en componente | Mover a hook custom o función pura |
| Fetch sin `Idempotency-Key` en POST mutante | Generar UUID por intento |
| `console.log` | Logger estructurado o nada |

## Performance

- **Code splitting por ruta** con `React.lazy` + Suspense.
- **`useMemo` y `useCallback` solo si hay evidencia de problema.** No por default.
- **Imágenes:** `loading="lazy"`, `width`/`height` para evitar CLS.
- **Listas largas (>50 items):** virtualizar con `@tanstack/react-virtual`.

## Tests mínimos por componente

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingCard } from './BookingCard';

describe('BookingCard', () => {
  it('renders venue name and price', () => {
    render(<BookingCard booking={fakeBooking()} />);
    expect(screen.getByText(/Cancha Los Olivos/)).toBeInTheDocument();
    expect(screen.getByText(/S\/ 80\.00/)).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    render(<BookingCard booking={fakeBooking({ id: '1' })} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledWith('1');
  });
});
```
