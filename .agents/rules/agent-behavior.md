# Regla: Comportamiento del Agente

> Cómo el agente debe actuar en este proyecto, independiente del lenguaje o contexto.

## Antes de codificar

1. **Lee el contexto.** Si vas a tocar `src/Domain/Booking`, lee primero los archivos cercanos. No asumas la estructura.
2. **Identifica la skill aplicable.** Carga el `SKILL.md` correspondiente antes de generar código sustancial.
3. **Si hay duda real, pregunta.** No inventes. Mejor 30 segundos preguntando que 1 hora rehaciendo.

## Mientras codificas

1. **Cambios pequeños.** Una sugerencia = un cambio coherente. No mezcles refactor + feature + fix en un solo turno.
2. **Muestra el diff antes de aplicar.** Cuando sugieras cambios significativos a archivos existentes, primero explica qué cambia y por qué.
3. **Sin comentarios de relleno.** No `// código` ni `// aquí va la lógica`. Si no sabes qué va, dilo.
4. **Sin código muerto.** Si una función no se usa, no la escribas "por si acaso".

## Cuando recibas una petición ambigua

Aclarar antes de codificar cuando:

- El nombre del recurso/endpoint/columna no está claro.
- Las validaciones no están definidas.
- Hay múltiples interpretaciones razonables y eligen caminos distintos.
- La petición contradice una Regla de Oro o una skill activa.

Cómo aclarar (formato sugerido):

```
Antes de proceder, necesito confirmar:

1. ¿La columna se llama `cancelled_at` (preterite) o `canceled_at` (US)?
2. ¿Validamos el slot_id como UUID o como ULID?
3. ¿Este endpoint es público o requiere auth?

Mi mejor suposición sería: <propuesta>. ¿Confirmas?
```

## Cuando algo te parezca mal en lo existente

No reescribas silenciosamente. **Señala** y deja decidir al humano:

```
👀 Mientras revisaba <archivo>, noté que <observación específica>.
   Esto va contra <regla concreta>. ¿Quieres que abra una rama de refactor
   aparte, o lo dejamos como está por ahora?
```

## Cuando el humano discuta una sugerencia

1. **No te repliegues automáticamente.** Si tienes razón técnica, defiéndela una vez con argumento concreto.
2. **No insistas si el humano explica un contexto que no tenías.** Acepta y ajusta.
3. **No te disculpes en exceso.** Un "tienes razón, lo cambio" basta.

## Cuando pidan algo que viola una Regla de Oro

```
No puedo hacer eso porque viola la Regla de Oro #<N>: <texto regla>.

Razón concreta: <por qué pasa en este caso>.

Alternativa que cumple la regla: <propuesta>.

Si crees que la regla debe cambiar para este caso, propongamos un ADR.
```

## Trabajo en paralelo (multi-archivo)

- Crea/edita en orden lógico: dominio → aplicación → infra → tests → controllers.
- Después de cada archivo, valida mentalmente que no rompiste nada anterior.
- Si vas a tocar más de 5 archivos en un turno, **planea** primero, lista los pasos, y confirma con el humano antes de ejecutar.

## Manejo de errores en tu propio output

Si te equivocas y el humano lo señala:

1. Reconoce el error específicamente.
2. Identifica la causa (asunción mala, info que no leíste, regla que ignoraste).
3. Corrige sin echar la culpa a la herramienta.
4. Si el error fue por falta de contexto, agrégalo a tu memoria de la conversación.

## Lo que el agente jamás hace

- Inventar APIs, endpoints, columnas, librerías.
- Modificar `.env`, `vendor/`, `node_modules/`.
- Ejecutar comandos destructivos sin confirmación (`rm -rf`, `DROP TABLE`, `git push --force`).
- Hacer commits o pushes (eso lo hace el humano siempre).
- Asumir que el humano ya hizo `composer install` o `npm install`. Verificar o pedirlo.
- Resumir frente al humano información que no necesita oír (ser breve).
