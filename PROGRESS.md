# PROGRESS — Ecosistema Digital de Canchas Deportivas

> **Instrucciones para el agente que retome este trabajo:**
> Lee este archivo primero. Busca la última fase marcada como ✅ COMPLETA y la primera marcada como 🔄 EN PROGRESO o ⬜ PENDIENTE. Empieza exactamente desde ahí. No rehagas nada que ya esté marcado ✅. Antes de tocar código, lee AGENTS.md y los SKILL.md relevantes.

---

## Estado General

| Fase | Nombre | Estado | Fecha |
|------|--------|--------|-------|
| 0 | Fundamentos del Proyecto | ✅ COMPLETA | 2026-05-02 |
| 1 | Migraciones de Base de Datos | ✅ COMPLETA | 2026-05-02 |
| 2 | Capa de Dominio | ✅ COMPLETA | 2026-05-02 |
| 3 | Puertos de Aplicación y Casos de Uso Core | ✅ COMPLETA | 2026-05-02 |
| 4 | Infraestructura Backend | ✅ COMPLETA | 2026-05-02 |
| 5 | Frontend: App Usuario | ✅ COMPLETA | 2026-05-02 |
| 6 | Frontend: PWA Staff | ✅ COMPLETA | 2026-05-02 |
| 7 | Frontend: Dashboard Partner | ✅ COMPLETA | 2026-05-02 |
| 8 | Frontend: Backoffice Admin | ✅ COMPLETA | 2026-05-02 |
| 9 | Contratos OpenAPI y Tests E2E | ✅ COMPLETA | 2026-05-02 |

---

## Leyenda de estados
- ⬜ PENDIENTE — no iniciada
- 🔄 EN PROGRESO — trabajo iniciado, no terminado
- ✅ COMPLETA — terminada, testeada, commiteada

---

## Fase 0 — Fundamentos del Proyecto
**Objetivo:** Laravel instalado, React configurado, estructura hexagonal, herramientas de calidad.

**Entorno objetivo:**
- PHP 8.2, Composer 2.9, Node.js 24, MySQL 8 — YA INSTALADOS
- Redis — pendiente de instalar (se necesita en Fase 4)
- Sin Docker

### Tareas

- [ ] 0.1 Instalar Laravel 11 en la raíz del proyecto
- [ ] 0.2 Crear estructura de carpetas hexagonal: `app/Domain/`, `app/Application/`, `app/Infrastructure/`
- [ ] 0.3 Configurar `.env.example` con todas las variables del proyecto
- [ ] 0.4 Verificar que `.env` está en `.gitignore`
- [ ] 0.5 Instalar y configurar `deptrac` (verificación de capas)
- [ ] 0.6 Instalar y configurar PHPStan nivel 8 + Pint (PSR-12)
- [ ] 0.7 Agregar scripts en `composer.json`: `lint`, `stan`, `deptrac`, `test`
- [ ] 0.8 Crear `DomainServiceProvider` vacío y registrarlo en `bootstrap/providers.php`
- [ ] 0.9 Instalar Vite + React + TypeScript + Tailwind 4 en `resources/js/`
- [ ] 0.10 Crear estructura de carpetas frontend: `pages/`, `features/`, `shared/`, `styles/`
- [ ] 0.11 Instalar dependencias frontend: TanStack Query, Zustand, React Hook Form, Zod
- [ ] 0.12 Instalar Vitest + Testing Library
- [ ] 0.13 Configurar tokens CSS del sistema de diseño (colores, tipografía del skill ui-design-canchas)
- [ ] 0.14 Agregar scripts en `package.json`: `test`, `test:run`, `build`
- [ ] 0.15 Configurar `deptrac.yaml` con las tres capas

### Archivos clave al terminar esta fase
```
composer.json          ← con scripts lint, stan, deptrac
phpstan.neon           ← nivel 8
deptrac.yaml           ← 3 capas definidas
package.json           ← con scripts test, build
vite.config.ts
tsconfig.json          ← strict: true
app/Infrastructure/Providers/DomainServiceProvider.php
bootstrap/providers.php
resources/js/app/
resources/js/shared/
resources/js/features/
resources/js/styles/
.env.example
.gitignore             ← .env excluido
```

---

## Fase 1 — Migraciones de Base de Datos
**Objetivo:** Todas las tablas del sistema definidas, con índices correctos y `down()` funcional.
**Prerrequisito:** Fase 0 ✅

### Tareas

- [ ] 1.1 `create_users_table` — roles, status, soft deletes
- [ ] 1.2 `create_venues_table` — POINT SRID 4326, índice SPATIAL separado
- [ ] 1.3 `create_fields_table` — canchas dentro de un venue
- [ ] 1.4 `create_schedule_templates_table` — matriz horaria semanal por cancha
- [ ] 1.5 `create_slots_table` — columna `version` para optimistic locking
- [ ] 1.6 `create_bookings_table` — `idempotency_key`, snapshots de precio, `version`
- [ ] 1.7 `create_booking_slots_table` — UNIQUE(slot_id) = tercera línea de defensa
- [ ] 1.8 `create_payments_table` — transacciones 1:N por booking
- [ ] 1.9 `create_webhook_events_table` — UNIQUE(gateway, event_id) para deduplicación
- [ ] 1.10 `create_shifts_table` — turnos de staff con balance de caja
- [ ] 1.11 `create_events_table` — bloqueos del partner (torneos, mantenimiento)
- [ ] 1.12 `create_audit_logs_table` — append-only, sin updated_at ni soft delete
- [ ] 1.13 `create_ratings_table`
- [ ] 1.14 `create_idempotency_keys_table` — middleware de idempotencia
- [ ] 1.15 Verificar `php artisan migrate` y `php artisan migrate:rollback` sin errores

### Archivos clave al terminar esta fase
```
database/migrations/
  xxxx_create_users_table.php
  xxxx_create_venues_table.php
  xxxx_create_fields_table.php
  xxxx_create_schedule_templates_table.php
  xxxx_create_slots_table.php
  xxxx_create_bookings_table.php
  xxxx_create_booking_slots_table.php
  xxxx_create_payments_table.php
  xxxx_create_webhook_events_table.php
  xxxx_create_shifts_table.php
  xxxx_create_events_table.php
  xxxx_create_audit_logs_table.php
  xxxx_create_ratings_table.php
  xxxx_create_idempotency_keys_table.php
```

---

## Fase 2 — Capa de Dominio
**Objetivo:** Entidades, value objects, enumeraciones e interfaces de repositorios. Cero Laravel en esta capa.
**Prerrequisito:** Fase 1 ✅

### Tareas

- [ ] 2.1 Shared: `Money`, `DomainException`, value objects de ID (`UserId`, `VenueId`, `FieldId`, `SlotId`, `BookingId`)
- [ ] 2.2 Domain/Users: entidad `User`, enum `UserRole`, `UserStatus`, interfaz `UserRepository`
- [ ] 2.3 Domain/Venues: entidad `Venue`, `Field`, `ScheduleTemplate`, interfaces de repositorios
- [ ] 2.4 Domain/Slots: entidad `Slot`, enum `SlotStatus`, excepciones, interfaz `SlotRepository`
- [ ] 2.5 Domain/Reservations: entidad `Booking`, enum `BookingStatus`, excepciones, interfaz `BookingRepository`
- [ ] 2.6 Domain/Payments: entidad `Payment`, `WebhookEvent`, enums, interfaz `PaymentRepository`
- [ ] 2.7 Domain/Shifts: entidad `Shift`, interfaz `ShiftRepository`
- [ ] 2.8 Tests unitarios: transiciones de estado de `Booking` (cancelar, confirmar, no-show)
- [ ] 2.9 Tests unitarios: transiciones de estado de `Slot` (reservar, liberar, expirar)
- [ ] 2.10 Verificar `composer deptrac` sin violaciones

### Archivos clave al terminar esta fase
```
app/Domain/
  Shared/Money.php
  Shared/DomainException.php
  Shared/ValueObjects/(UserId, VenueId, FieldId, SlotId, BookingId).php
  Users/(User, UserRole, UserStatus, UserRepository).php
  Venues/(Venue, Field, ScheduleTemplate, VenueRepository, FieldRepository).php
  Slots/(Slot, SlotStatus, SlotRepository, excepciones).php
  Reservations/(Booking, BookingStatus, BookingRepository, excepciones).php
  Payments/(Payment, WebhookEvent, PaymentStatus, PaymentRepository).php
  Shifts/(Shift, ShiftRepository).php
tests/Unit/Domain/
  BookingTest.php
  SlotTest.php
```

---

## Fase 3 — Puertos de Aplicación y Casos de Uso Core
**Objetivo:** Lógica orquestada de los flujos principales con las 3 líneas de defensa de concurrencia.
**Prerrequisito:** Fase 2 ✅

### Tareas

- [ ] 3.1 Puertos: `LockManager`, `Clock`, `TransactionManager`, `QueueManager`, `NotificationPort`
- [ ] 3.2 `RegisterUserUseCase`, `LoginUseCase`
- [ ] 3.3 `GenerateSlotsForVenueUseCase` (job nocturno 30 días)
- [ ] 3.4 `CreateBookingUseCase` — ⚠️ CRÍTICO: 3 líneas de defensa obligatorias
- [ ] 3.5 `CancelBookingUseCase`
- [ ] 3.6 `ConfirmBookingPaymentUseCase` (llamado por job del webhook)
- [ ] 3.7 `ProcessWebhookUseCase` — firma HMAC, deduplicación, encolar job
- [ ] 3.8 `ValidateQRCheckInUseCase`
- [ ] 3.9 `MarkNoShowUseCase`
- [ ] 3.10 `OpenShiftUseCase`, `CloseShiftUseCase`
- [ ] 3.11 `CreateWalkInBookingUseCase`
- [ ] 3.12 Tests de integración con fakes: `InMemoryBookingRepository`, `FakeLockManager`, `FakeClock`
- [ ] 3.13 Test de carrera: dos requests simultáneos al mismo slot, solo uno gana

### Archivos clave al terminar esta fase
```
app/Application/
  Shared/(LockManager, Clock, TransactionManager, QueueManager, NotificationPort).php
  Auth/(RegisterUserUseCase, LoginUseCase, DTOs).php
  Slots/(GenerateSlotsUseCase, DTOs).php
  Reservations/(CreateBookingUseCase, CancelBookingUseCase, ConfirmBookingPaymentUseCase, DTOs).php
  Payments/(ProcessWebhookUseCase, DTOs).php
  CheckIn/(ValidateQRUseCase, MarkNoShowUseCase, DTOs).php
  Shifts/(OpenShiftUseCase, CloseShiftUseCase, DTOs).php
  WalkIn/(CreateWalkInUseCase, DTOs).php
tests/Integration/Application/
  CreateBookingUseCaseTest.php
  ConfirmBookingPaymentUseCaseTest.php
  ProcessWebhookUseCaseTest.php
tests/Doubles/
  InMemoryBookingRepository.php
  FakeLockManager.php
  FakeClock.php
```

---

## Fase 4 — Infraestructura Backend
**Objetivo:** Eloquent, Redis, controladores HTTP, jobs, middleware de idempotencia.
**Prerrequisito:** Fase 3 ✅
**⚠️ REQUIERE REDIS INSTALADO** — instalar antes de empezar (MSI para Windows).

### Tareas

- [ ] 4.1 Modelos Eloquent para cada tabla
- [ ] 4.2 Mappers Domain ↔ Eloquent para cada entidad
- [ ] 4.3 Repositorios concretos implementando interfaces del Dominio
- [ ] 4.4 `RedisLockManager` con liberación atómica Lua
- [ ] 4.5 `SystemClock`, `LaravelTransactionManager`
- [ ] 4.6 Rutas `routes/api.php` bajo `/api/v1/`
- [ ] 4.7 Controllers para todos los endpoints del Documento Maestro
- [ ] 4.8 Form Requests (validación de formato)
- [ ] 4.9 API Resources (envelope `{data: ...}`)
- [ ] 4.10 `IdempotencyKeyMiddleware`
- [ ] 4.11 Rate limiting por endpoint
- [ ] 4.12 Job `ReleaseExpiredPendingSlotsJob` — cada 60s
- [ ] 4.13 Job `ReconcilePendingPaymentsJob` — cada 60s
- [ ] 4.14 Job `RollSlotWindowJob` — nightly 03:00 UTC
- [ ] 4.15 Bindings completos en `DomainServiceProvider`
- [ ] 4.16 Tests Feature de endpoints críticos (hold booking, webhook, check-in)

### Archivos clave al terminar esta fase
```
app/Infrastructure/
  Persistence/Eloquent/Models/*.php
  Persistence/Eloquent/Repositories/*.php
  Persistence/Eloquent/Mappers/*.php
  Locking/RedisLockManager.php
  Time/SystemClock.php
  Http/Controllers/*.php
  Http/Requests/*.php
  Http/Resources/*.php
  Http/Middleware/IdempotencyKeyMiddleware.php
  Jobs/(ReleaseExpiredPendingSlotsJob, ReconcilePendingPaymentsJob, RollSlotWindowJob).php
  Providers/DomainServiceProvider.php
routes/api.php
tests/Feature/Http/V1/*.php
```

---

## Fase 5 — Frontend: App Usuario
**Objetivo:** Flujo completo usuario: buscar → ver slots → checkout → confirmación.
**Prerrequisito:** Fase 4 ✅ (al menos los endpoints de venues, slots y bookings operativos)

### Tareas

- [ ] 5.1 Tokens CSS y componentes base (Button, Input, Badge, Skeleton)
- [ ] 5.2 Auth: Login/Register, hook `useAuth`, cliente API con Idempotency-Key automático
- [ ] 5.3 Feature venues: `VenueCard`, `VenuesList`, `VenueDetail`, búsqueda geoespacial
- [ ] 5.4 Feature slots: `SlotGrid` (vista completa del día), chips de fecha, selección contigua
- [ ] 5.5 Feature bookings: `CheckoutPage`, sticky footer de precio, manejo de errores específicos
- [ ] 5.6 Confirmación: QR code, compartir WhatsApp, `wakeLock` API
- [ ] 5.7 Mis reservas: lista, detalle, cancelación
- [ ] 5.8 Caché offline: Service Worker para reservas propias
- [ ] 5.9 Tests de componentes: SlotGrid, BookingCard, CheckoutForm
- [ ] 5.10 Bottom navigation: 3 tabs (Buscar / Mis reservas / Perfil)

---

## Fase 6 — Frontend: PWA Staff
**Objetivo:** Herramienta operativa para turno, QR, walk-in, cierre de caja.
**Prerrequisito:** Fase 4 ✅

### Tareas

- [ ] 6.1 Apertura/cierre de turno con balance de caja
- [ ] 6.2 Escáner QR con feedback visual + háptico (verde/rojo)
- [ ] 6.3 Formulario de walk-in rápido
- [ ] 6.4 Lista de reservas del día con filtros
- [ ] 6.5 Service Worker: funciona offline con datos del turno en caché
- [ ] 6.6 Manifest PWA instalable en móvil

---

## Fase 7 — Frontend: Dashboard Partner
**Objetivo:** Vista de negocio del dueño: grilla de canchas, analítica, gestión de staff.
**Prerrequisito:** Fase 4 ✅

### Tareas

- [ ] 7.1 Grilla diaria de canchas (bloques de color, click para detalle)
- [ ] 7.2 KPIs del día (ocupación, ingresos, reservas pendientes)
- [ ] 7.3 Gestión de canchas: crear/editar fields y horarios
- [ ] 7.4 Gestión de staff: alta, baja, asignación de venue
- [ ] 7.5 Analítica: ingresos históricos, horarios más demandados
- [ ] 7.6 Gestión de eventos: crear bloqueos (torneo, mantenimiento)

---

## Fase 8 — Frontend: Backoffice Admin
**Objetivo:** Panel para aprobar partners, auditar, configurar plataforma.
**Prerrequisito:** Fase 4 ✅

### Tareas

- [ ] 8.1 Lista de partners pendientes de aprobación
- [ ] 8.2 Detalle de partner: KYC, venues, historial
- [ ] 8.3 Audit logs: búsqueda y visualización
- [ ] 8.4 Configuración de platform_fee y reglas globales
- [ ] 8.5 Monitor de salud del sistema

---

## Fase 9 — Contratos OpenAPI y Tests E2E
**Objetivo:** Documentación viva de la API y tests de los 5 flujos críticos.
**Prerrequisito:** Fases 4–8 ✅

### Tareas

- [ ] 9.1 Escribir `docs/openapi.yaml` completo
- [ ] 9.2 Configurar Playwright
- [ ] 9.3 E2E: reserva → pago → confirmación
- [ ] 9.4 E2E: slot liberado tras TTL
- [ ] 9.5 E2E: check-in con QR
- [ ] 9.6 E2E: partner ve grilla actualizada
- [ ] 9.7 E2E: webhook confirma reserva (idempotente)

---

## Notas del entorno

```
OS:           Windows 11 (sin Docker)
PHP:          8.2 ✅ instalado
Composer:     2.9 ✅ instalado
Node.js:      24 ✅ instalado
MySQL:        8 ✅ instalado
Redis:        ⚠️  NO instalado — requerido en Fase 4
              Instalar con: https://github.com/tporadowski/redis/releases
              (Redis for Windows, archivo .msi)
```

## Reglas críticas recordatorio

1. El Dominio NUNCA importa Laravel (`use Illuminate\...` en Domain = error grave)
2. Reservas nunca se borran físicamente, solo `cancelled_at`
3. Precio snapshot es inmutable una vez creado el booking
4. Concurrencia: Redis lock + optimistic locking + UNIQUE constraint (las 3 son obligatorias)
5. Pagos confirmados SOLO por webhook firmado HMAC, nunca por redirect del browser
6. `audit_logs` es append-only (solo INSERT, nunca UPDATE ni DELETE)
7. Todo monto es `DECIMAL(10,2)`, nunca float
8. Timestamps siempre UTC, formato ISO 8601 con Z en la API
9. El agente NUNCA hace git commit, push ni merge — solo los sugiere al humano
