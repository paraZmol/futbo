# AGENTS.md — Constitución del Proyecto

> **Este archivo es vinculante.** Todo agente (Gemini en Antigravity, Claude vía extensión, o cualquier otro) debe leer y respetar estas reglas en cada interacción. La fuente de verdad técnica es `docs/Documento_Arquitectonico_Maestro_v2.docx`.

---

## 1. Identidad del proyecto

- **Nombre:** Ecosistema Digital de Gestión y Alquiler de Canchas
- **Stack obligatorio:** Laravel 11 + PHP 8.2 / React + Tailwind / MySQL 8 / Redis
- **Idioma del código:** inglés (variables, clases, comentarios, commits).
- **Idioma de la documentación y conversación:** español.
- **Moneda:** PEN (soles peruanos), siempre `DECIMAL(10,2)`.
- **Tiempo:** UTC en backend y BD; ISO 8601 con sufijo `Z` en API.

---

## 2. Reglas de Oro (vinculantes — no negociables)

Estas son las 10 reglas extraídas del Documento Maestro. Violarlas es razón para rechazar un PR.

1. **Arquitectura Hexagonal estricta.** Todo código backend va en una de tres capas: `Domain`, `Application`, `Infrastructure`. El dominio NUNCA importa Laravel. Verificación automática vía `deptrac` en CI.
2. **Snapshot de precio inmutable.** Una vez creada una `booking`, su `price_total` no cambia jamás, aunque el precio del field se actualice después.
3. **Las reservas no se eliminan, se cancelan.** La columna `cancelled_at` es la única forma legal de "borrar" una reserva. `DELETE` físico de bookings está prohibido.
4. **Doble bloqueo en concurrencia.** Toda operación que modifica un slot usa: lock distribuido Redis (`SET NX PX`) + locking optimista (columna `version`) + `UNIQUE` en `booking_slots.slot_id`. Las tres capas son obligatorias.
5. **Webhook HMAC = única fuente de verdad de pagos.** Nunca se confía en redirecciones del navegador para confirmar un pago. Solo el webhook firmado autoriza la transición a `reserved`.
6. **Idempotency-Key en todo POST mutante.** Header obligatorio. Tabla `webhook_events` deduplica.
7. **`audit_logs` es append-only.** El usuario MySQL de la app tiene únicamente `INSERT` sobre esa tabla. Sin excepción.
8. **Migraciones siempre reversibles.** Toda migración tiene `up()` y `down()` funcionales. Sin DDL ad-hoc en producción.
9. **No se rompe el contrato sin ADR.** Todo cambio en API, esquema de BD o stack requiere un Architecture Decision Record en `docs/adr/`.
10. **Si falla un servicio P1/P2, el núcleo P0 sigue operando.** Notificaciones, mapas y WhatsApp son auxiliares: su caída no debe bloquear reservas ni pagos.

---

## 3. Disciplina de capas (resumen accionable)

```
src/
├── Domain/              # Entidades, Value Objects, eventos. SIN Laravel.
├── Application/         # Casos de uso, DTOs, puertos (interfaces).
└── Infrastructure/
    ├── Persistence/     # Eloquent, repositorios concretos.
    ├── Http/            # Controllers, requests, resources.
    └── Adapters/        # Pasarela pago, FCM, WhatsApp, Maps.
```

**Regla de importación:**
- `Domain` no importa nada externo.
- `Application` solo importa de `Domain`.
- `Infrastructure` puede importar de `Application` y `Domain`.
- Las dependencias se inyectan por interfaces (Ports), nunca por clases concretas.

Si una skill o un agente sugiere violar esto, **el agente debe negarse y explicar por qué**.

---

## 4. Convenciones de código

- **PHP:** PSR-12 estricto. PHPStan nivel 8. `declare(strict_types=1);` en todos los archivos.
- **JS/TS:** ESLint con `eslint-config-airbnb`. Prettier obligatorio. TypeScript en modo `strict`.
- **Naming:** clases `PascalCase`, métodos `camelCase`, tablas `snake_case` plural, columnas `snake_case` singular.
- **No comentarios obvios.** Un comentario explica el *por qué*, no el *qué*.
- **No `dd()`, `var_dump()`, `console.log` en código que se commitea.** Usar logger estructurado.

---

## 5. Comandos canónicos del proyecto

Antes de sugerir un comando, el agente verifica que existe en este listado o en `composer.json` / `package.json`:

| Tarea | Comando |
|---|---|
| Levantar stack local | `make up` (docker-compose) |
| Migrar BD | `php artisan migrate` |
| Ejecutar tests backend | `php artisan test` |
| Ejecutar tests frontend | `npm run test` |
| Linter PHP | `composer lint` |
| Análisis estático | `composer stan` |
| Verificar capas hexagonales | `composer deptrac` |
| Build producción frontend | `npm run build` |
| Cola de jobs (Horizon) | `php artisan horizon` |

---

## 6. Cómo debe comportarse el agente

### El agente DEBE:

- Leer `AGENTS.md` y los archivos `SKILL.md` relevantes antes de proponer cambios significativos.
- Sugerir un commit cuando termine un cambio coherente y atómico (ver `.agents/skills/git-workflow-canchas/`).
- Pedir al humano que ejecute `git commit` — **el agente nunca commitea por sí mismo**.
- Indicar la rama correcta antes de empezar trabajo (`feature/`, `fix/`, `refactor/`).
- Negarse a generar código que viole las Reglas de Oro y explicar la razón.
- Citar la sección del Documento Maestro al justificar una decisión arquitectónica.

### El agente NUNCA debe:

- Hacer `git commit`, `git push`, `git merge` o `git rebase` automáticamente. **Esto lo hace el humano.**
- Eliminar archivos, tablas o columnas sin pedir confirmación explícita.
- Modificar archivos en `vendor/`, `node_modules/`, `.env`, ni archivos de migración ya ejecutados en producción.
- Inventar endpoints, columnas, reglas de negocio o servicios que no existan en el Documento Maestro o en código.
- Hardcodear secretos, API keys, contraseñas o URLs de producción.
- Sugerir bibliotecas no aprobadas sin proponer un ADR primero.

---

## 7. Qué hacer cuando el humano pide algo ambiguo

1. **Identificar la skill aplicable** en `.agents/skills/`.
2. Si la petición toca varias áreas (ej. "agrega un endpoint de bookings"), cargar varias skills.
3. Si falta información crítica (ej. nombre exacto del endpoint, validaciones), **preguntar antes de codificar**, no asumir.
4. Si la petición contradice una Regla de Oro, **rechazar con explicación**, no obedecer ciegamente.

---

## 8. Estructura del repositorio

```
proyecto-canchas/
├── AGENTS.md                  # Este archivo (vinculante).
├── GEMINI.md                  # Override Antigravity-específico (si existe).
├── .agents/
│   ├── rules/                 # Reglas adicionales por área.
│   └── skills/                # Capacidades bajo demanda.
├── docs/
│   ├── adr/                   # Architecture Decision Records.
│   ├── openapi.yaml           # Contrato de API (fuente de verdad).
│   └── Documento_Arquitectonico_Maestro_v2.docx
├── src/                       # Código backend (Laravel + Hexagonal).
├── resources/js/              # Código frontend (React).
├── database/migrations/       # Migraciones reversibles.
└── tests/                     # Pirámide: unit > integration > e2e.
```

---

## 9. En caso de conflicto entre reglas

**Orden de precedencia (mayor a menor):**

1. Las 10 Reglas de Oro de este archivo.
2. El Documento Arquitectónico Maestro (`docs/`).
3. Los ADR aprobados en `docs/adr/`.
4. Las skills en `.agents/skills/`.
5. Las rules en `.agents/rules/`.
6. Convenciones generales del lenguaje (PSR-12, Airbnb, etc).

Si una skill contradice una Regla de Oro, gana la Regla de Oro.

---

**Versión:** 1.0
**Fecha:** 2026-05-02
**Mantenedor:** Arquitectura
