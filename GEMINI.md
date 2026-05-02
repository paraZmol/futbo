# GEMINI.md — Configuración Antigravity

> **Las reglas vinculantes del proyecto viven en `AGENTS.md`.**
> Este archivo solo agrega comportamientos específicos de Antigravity.

## Lectura obligatoria

Antes de cualquier acción, el agente debe haber leído:

1. `AGENTS.md` (constitución del proyecto)
2. `.agents/skills/` (capacidades bajo demanda — el agente carga la skill correspondiente cuando aplica)

## Comportamiento Antigravity-específico

- Cuando se invoque al **subagente del navegador**, no debe iniciar sesión en panels de producción ni staging. Solo en `localhost`.
- Cuando se generen artefactos (especificaciones, planes), guardarlos en `docs/drafts/` y nunca sobrescribir archivos en `docs/adr/` sin confirmación humana.
- Si Gemini detecta que está editando un archivo dentro de `src/Domain/`, debe activar mentalmente la skill `laravel-hexagonal` antes de hacer cambios.

## Modelo recomendado por tarea

| Tarea | Modelo sugerido |
|---|---|
| Refactor extenso, decisiones arquitectónicas | Gemini 3 Pro o Claude Sonnet/Opus |
| Generar boilerplate, completar funciones cortas | Gemini Flash |
| Revisión de PR, análisis de seguridad | Claude Opus |

El humano decide; este es solo un default.
