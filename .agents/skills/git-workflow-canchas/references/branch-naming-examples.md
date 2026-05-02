# Branch Naming — Ejemplos del Proyecto Canchas

## Patrón obligatorio

```
<prefijo>/<descripcion-kebab-case>
<prefijo>/<TICKET>-<descripcion-kebab-case>
```

## Ejemplos por tipo

### feature/ — funcionalidad nueva

```
feature/bookings-hold-flow
feature/walk-in-checkout
feature/qr-checkin-staff
feature/venue-onboarding-wizard
feature/CAN-142-multi-slot-reservation
```

### fix/ — bug en develop

```
fix/webhook-signature-validation
fix/timezone-conversion-slot-start
fix/redis-lock-early-expiration
fix/CAN-189-payment-redirect-loop
```

### hotfix/ — bug crítico en producción (sale de main)

```
hotfix/payment-double-charge
hotfix/booking-list-500-error
hotfix/auth-token-leak
```

### refactor/ — cambio interno sin cambiar comportamiento

```
refactor/extract-pricing-vo
refactor/move-booking-handler-to-application
refactor/split-bookingservice-by-responsibility
refactor/rename-slot-states-to-enum
```

### chore/ — mantenimiento, dependencias, configs

```
chore/upgrade-laravel-11.7
chore/bump-react-19.2
chore/configure-deptrac
chore/restrict-audit-logs-mysql-perms
```

### docs/ — solo documentación

```
docs/add-onboarding-guide
docs/update-api-openapi-spec
docs/adr-007-circuit-breaker
```

### build/ — pipeline, CI, build system

```
build/add-github-actions-pipeline
build/cache-composer-deps-on-ci
build/dockerize-horizon-worker
```

## Ejemplos de nombres MALOS y por qué

| ❌ Nombre | Problema |
|---|---|
| `feature/improvements` | No dice qué |
| `fix/bug` | No dice qué bug |
| `feature/JuanPerez-newFeature` | Camel case y nombre de persona |
| `feat/new-stuff` | Prefijo equivocado (`feat` en commits, `feature` en branches) |
| `fix-typo` | Sin prefijo + sin slash |
| `feature/this-is-a-very-long-branch-name-that-explains-everything-in-detail` | Más de 5 palabras |
| `feature/Bookings_Hold_Flow` | Snake case + mayúsculas |

## Flujo típico para una feature

```bash
# 1. Asegurarse de estar en develop actualizado
git checkout develop
git pull origin develop

# 2. Crear rama
git checkout -b feature/bookings-hold-flow

# 3. Trabajar, commitear varias veces (atómicos)
# ... edits ...
git add src/Domain/Booking/HoldBooking.php
git commit -m "feat(bookings): add hold booking value object"

# ... edits ...
git add src/Application/UseCases/HoldBookingUseCase.php tests/...
git commit -m "feat(bookings): implement hold booking use case"

# 4. Pushear cuando está lista
git push origin feature/bookings-hold-flow

# 5. Abrir PR contra develop en GitHub
# 6. Después de mergear, borrar la rama local y remota
git checkout develop
git pull origin develop
git branch -d feature/bookings-hold-flow
git push origin --delete feature/bookings-hold-flow
```

## Cuándo crear una hotfix (proceso especial)

```bash
# Sale de main, no de develop
git checkout main
git pull origin main
git checkout -b hotfix/payment-double-charge

# Fix mínimo y específico
# ... edits ...
git commit -m "fix(payments): prevent double charge on retry"

# PR a main + a develop (para que no se pierda el fix)
git push origin hotfix/payment-double-charge
# Abrir 2 PRs: uno a main, otro a develop
```

## Anti-patrones de branching que el agente debe rechazar

1. **Trabajar directamente en `main` o `develop`** → Crear rama nueva siempre.
2. **Mezclar feature + refactor en una rama** → Una rama, un propósito.
3. **Ramas que viven más de 2 semanas** → Mergear o cerrar.
4. **Mergear `main` → `develop`** sin razón clara → Generalmente al revés (o vía PR de hotfix dual).
5. **Force push a ramas compartidas** → Solo permitido en ramas personales que nadie más toca.
