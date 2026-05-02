# Conventional Commits — Cheatsheet del Proyecto Canchas

## Referencia rápida

```
<tipo>(<scope>): <descripción>
```

## Ejemplos por escenario real del proyecto

### Sistema de reservas

```
feat(bookings): add hold-and-confirm flow with redis lock
feat(bookings): support multi-slot reservation
fix(bookings): prevent double booking when redis lock expires early
fix(bookings): correct timezone conversion for slot start time
refactor(bookings): extract booking validation to dedicated service
test(bookings): add concurrent reservation stress test
perf(bookings): index booking_slots.slot_id for faster lookup
```

### Pagos y webhooks

```
feat(payments): integrate culqi gateway adapter
feat(webhooks): add idempotency-key deduplication
fix(webhooks): validate hmac signature before any side effect
fix(payments): handle gateway timeout with circuit breaker
refactor(payments): move webhook handler to application layer
test(webhooks): cover replay attack scenario
```

### Autenticación y permisos

```
feat(auth): add jwt refresh token rotation
feat(auth): implement rbac with venue-scoped permissions
fix(auth): prevent session fixation on login
refactor(auth): extract token service to infrastructure adapter
```

### Slots y máquina de estados

```
feat(slots): generate next 30 days window via cron
feat(slots): add ttl-based reversion for pending_payment
fix(slots): correct state transition on payment failure
refactor(slots): replace string state with enum value object
```

### Auditoría

```
feat(audit): log every state transition on bookings
chore(audit): restrict mysql user to insert-only on audit_logs
```

### Frontend

```
feat(frontend): add booking confirmation modal
fix(frontend): handle network error on payment redirect
style(frontend): apply tailwind v4 token system
refactor(frontend): split BookingForm into 3 smaller components
test(frontend): cover happy path of reservation flow
perf(frontend): lazy-load map component
```

### Infraestructura y dependencias

```
chore(deps): upgrade laravel from 11.0 to 11.7
chore(deps): bump react from 19.0 to 19.2
build(infra): add github actions workflow for ci
build(infra): configure deptrac for hexagonal layers
docs(adr): add ADR-007 on circuit breaker library choice
```

### Migraciones

```
feat(migrations): add bookings table with version column
feat(migrations): partition slots by month
fix(migrations): correct foreign key cascade on cancel
```

## Cuándo usar el cuerpo del commit

Si el *por qué* no es obvio del título, agregar cuerpo:

```
fix(bookings): prevent double booking when redis lock expires early

The previous implementation only relied on the redis distributed lock
with a 10-minute TTL. Under high load, slow database writes occasionally
took longer than the lock TTL, leading to a window where two requests
could both acquire the lock sequentially and create duplicate bookings.

This commit adds the optimistic locking column `version` as a second
defense layer. The UNIQUE constraint on booking_slots.slot_id was
already in place but was returning generic SQL errors; now we detect
this case explicitly and return a friendlier 409 Conflict.

Refs: ADR-004
```

## Breaking changes

Si el commit rompe contrato (API, BD, formato público), marcarlo:

```
feat(api)!: change bookings endpoint response shape

BREAKING CHANGE: GET /api/v1/bookings now returns paginated structure
{ data: [...], meta: {...} } instead of bare array. Clients must update.

Refs: ADR-009
```

El `!` después del scope o del tipo es la marca corta de breaking change.

## Cierre de tickets

Si el repo usa un sistema de tickets:

```
feat(bookings): add hold-and-confirm flow

Closes CAN-142
Refs CAN-143
```

## Cosas a evitar

| ❌ No hacer | ✅ Hacer en su lugar |
|---|---|
| `commit -m "wip"` | Termina la unidad o hace stash |
| `commit -m "more changes"` | Especifica qué cambió |
| `commit -m "fix: bug"` | `fix(scope): describe the bug` |
| 1 commit con 800 líneas y 5 temas | Divide en 5 commits temáticos |
| Mezclar `chore` + `feat` en 1 commit | Separa siempre |
| Commits con typos | Revisa antes de ejecutar el comando |
