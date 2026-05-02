---
name: git-workflow-canchas
description: Sugiere al humano cuándo hacer commit y enseña el flujo de branches del proyecto. NUNCA ejecuta git commit, git push, git merge ni git rebase por sí mismo. Se activa cuando el agente termina un cambio coherente, cuando detecta que el humano está mezclando temas no relacionados en el mismo cambio, cuando el humano pregunta sobre branches, o cuando se necesita decidir en qué rama trabajar.
---

# Git Workflow — Canchas

## Filosofía vinculante

> **Los commits los hace el humano. El agente solo sugiere.**

El humano del proyecto se reserva el control total sobre Git. El agente actúa como un compañero que dice *"oye, aquí hay un buen punto para hacer commit"*, no como un robot que commitea automáticamente.

## Cuándo el agente DEBE sugerir un commit

El agente debe pausar y proponer un commit cuando se cumple **al menos una** de estas condiciones:

1. **Cambio atómico completo:** Se terminó una unidad de trabajo coherente (ej. "agregué la migración + el modelo + el factory para `bookings`").
2. **Tests verdes:** Se acaba de hacer pasar un test que estaba fallando, o de agregar tests nuevos que pasan.
3. **Antes de un cambio riesgoso:** Si el siguiente paso podría romper algo (renombrar masivo, cambio de esquema), commitear antes para tener punto de regreso.
4. **Cambio de tema:** El humano dice "ahora vamos a hacer otra cosa". Antes de cambiar, cerrar el tema anterior con commit.
5. **Más de ~150 líneas modificadas** sin commitear, aunque el cambio no esté terminado, si es lógicamente divisible.

## Cómo sugerir un commit (formato exacto)

Cuando el agente decida que toca commitear, debe responder con este formato literal:

```
🔖 Buen punto para hacer commit. Sugiero:

  git add <archivos específicos, no `.` masivo>
  git commit -m "<tipo>(<scope>): <descripción corta en imperativo>"

Razón: <por qué este es un buen momento>
Próximo paso después del commit: <qué viene>
```

**Importante:** El agente NO ejecuta el comando. Lo muestra para que el humano lo copie y ejecute.

## Conventional Commits (formato obligatorio)

```
<tipo>(<scope opcional>): <descripción>

[cuerpo opcional]

[footer opcional]
```

### Tipos permitidos

| Tipo | Cuándo usarlo |
|---|---|
| `feat` | Nueva funcionalidad para el usuario final |
| `fix` | Corrección de un bug |
| `refactor` | Cambio de código sin cambiar comportamiento externo |
| `perf` | Mejora de rendimiento |
| `test` | Agregar o corregir tests |
| `docs` | Cambios solo en documentación |
| `chore` | Tareas de mantenimiento (deps, configs) |
| `build` | Cambios en sistema de build, CI |
| `style` | Formato, espacios, sin cambio lógico |

### Scopes recomendados para este proyecto

`bookings`, `slots`, `payments`, `webhooks`, `auth`, `venues`, `staff`, `audit`, `migrations`, `frontend`, `infra`, `deps`.

### Ejemplos buenos

```
feat(bookings): add hold-and-confirm flow with redis lock
fix(webhooks): validate hmac signature before processing
refactor(domain): extract pricing logic to value object
test(slots): cover concurrent reservation edge case
chore(deps): upgrade laravel from 11.0 to 11.7
```

### Ejemplos prohibidos (el agente debe rechazarlos)

```
❌ wip                          ← no dice nada
❌ updates                      ← demasiado vago
❌ fix bug                      ← qué bug
❌ Added new endpoint           ← sin tipo, sin scope
❌ feat: changes                ← descripción vacía
❌ feat(bookings): added new endpoint AND fixed validation bug AND updated docs
   ← múltiples temas en un commit, debe dividirse
```

## Reglas adicionales para mensajes

- **Imperativo, presente, sin punto final.** "add validation" ✓ / "added validation." ✗
- **Descripción ≤ 72 caracteres** en la línea principal.
- **Cuerpo separado por línea en blanco** si se necesita explicar el *por qué*.
- **Inglés.** Toda la base de código está en inglés.

## Estrategia de Branches (GitHub Flow modificado)

### Ramas permanentes

| Rama | Propósito | Quién mergea |
|---|---|---|
| `main` | Producción. Siempre desplegable. | Solo via PR aprobado |
| `develop` | Integración antes de producción | Solo via PR aprobado |

### Ramas temporales

Se crean desde `develop`, se mergean a `develop` vía PR, se borran al mergear.

| Prefijo | Cuándo usar | Ejemplo |
|---|---|---|
| `feature/` | Nueva funcionalidad | `feature/bookings-hold-flow` |
| `fix/` | Corrección de bug en `develop` | `fix/webhook-signature-validation` |
| `hotfix/` | Bug crítico en producción (sale de `main`) | `hotfix/payment-double-charge` |
| `refactor/` | Reestructuración interna | `refactor/extract-pricing-vo` |
| `chore/` | Mantenimiento, dependencias | `chore/upgrade-laravel-11.7` |
| `docs/` | Solo documentación | `docs/add-onboarding-guide` |

### Reglas de naming

- **kebab-case obligatorio**, máximo 5 palabras.
- **Sin nombres genéricos:** `feature/improvements`, `fix/bug` están prohibidos.
- **Si hay un ticket:** `feature/CAN-123-bookings-hold-flow` (CAN = código del proyecto).

## Cuándo el agente debe sugerir crear una nueva rama

El agente sugiere crear rama nueva cuando:

1. El humano está en `main` o `develop` y propone un cambio. **Nunca trabajar directamente en estas dos ramas.**
2. La rama actual ya tiene commits de un tema distinto al que el humano quiere abordar.
3. La rama actual tiene 10+ commits o más de 500 líneas cambiadas (es momento de cerrarla con un PR).

### Formato de sugerencia

```
🌿 Mejor crear rama nueva. Sugiero:

  git checkout develop
  git pull origin develop
  git checkout -b <prefijo>/<descripcion-kebab>

Razón: <por qué la rama actual no es adecuada>
```

## Antes de pushear: checklist mental del agente

Antes de sugerir `git push`, el agente verifica que el humano (o él mismo) haya:

- [ ] Ejecutado los tests locales: `php artisan test` y `npm run test`.
- [ ] Pasado el linter: `composer lint`.
- [ ] Pasado análisis estático: `composer stan`.
- [ ] Verificado capas hexagonales: `composer deptrac`.
- [ ] Revisado el `git diff` antes del commit.

Si alguno falla, **no sugerir push**. Sugerir corregir primero.

## Cuándo el agente debe sugerir un PR

Al terminar la rama y todos los checks pasan:

```
🚀 Lista para PR. Sugiero:

  git push origin <nombre-rama>

Luego en GitHub:
- Title: <Tipo conventional + descripción>
- Base: develop
- Marcar reviewers: <quien corresponda>
- Vincular ticket si aplica
```

## Lo que el agente NUNCA hace en Git

| Acción | Permitido para el agente |
|---|---|
| `git status`, `git log`, `git diff` | ✅ Sí, para inspeccionar |
| `git add`, `git commit` | ❌ Solo sugerir, nunca ejecutar |
| `git push`, `git pull` | ❌ Solo sugerir, nunca ejecutar |
| `git merge`, `git rebase` | ❌ NUNCA, ni siquiera sugerir auto-ejecución |
| `git checkout` (cambiar rama) | ⚠️ Solo si humano lo pide explícitamente |
| `git reset --hard`, `git push --force` | ❌ NUNCA. Si parece necesario, pedir al humano que lo evalúe |
| Crear ramas (`git checkout -b`) | ⚠️ Solo si humano confirma el nombre |

## Recursos

- Ver `references/conventional-commits-cheatsheet.md` para ejemplos exhaustivos.
- Ver `references/branch-naming-examples.md` para más ejemplos de nombres de ramas.
