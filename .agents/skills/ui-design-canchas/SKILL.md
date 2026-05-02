---
name: ui-design-canchas
description: >
  Usa este skill cuando diseñes o implementes cualquier pantalla, componente o página del
  proyecto Canchas. Cubre sistema de diseño, colores, tipografía, patrones responsive y
  guías de cada pantalla clave. Basado en análisis de las plataformas líderes del mercado
  LATAM: ATC Sports (Nº 1 en región, 8 países), easycancha (líder Chile), Canchea (Uruguay),
  DondeJuego, y QuieroCancha. NO usar para lógica backend ni base de datos.
---

# Skill: UI & Diseño Responsive — Proyecto Canchas
## (Basado en investigación de mercado real LATAM 2024-2025)

---

## 0. Lo que el usuario real necesita (y lo que las apps actuales fallan)

Antes de diseñar una sola pantalla, hay que entender qué pide el usuario final en sus reseñas
reales de las apps líderes del mercado LATAM.

### Lo que funciona y hay que replicar:
- **ATC Sports (líder LATAM, 8 países):** "3 simples pasos, todo en la palma de tu mano en
  menos de 15 segundos" → **la velocidad es el valor central, no la estética**
- **easycancha (líder Chile):** "Fácil de usar, no llamo nunca más a un club"
  → **eliminar la llamada telefónica es el trabajo principal del producto**
- **ATC Sports:** el buscador es el hero del home (ubicación + deporte + fecha + hora).
  No un banner de marketing. → **el filtro es la pantalla principal, no una decoración**

### Lo que falla y hay que evitar (quejas reales de usuarios):
- **easycancha:** *"Me da muchos problemas al momento de realizar el pago, con tarjeta de
  débito siempre me muestra error"*
  → El flujo de pago es donde más se abandona. Feedback de error específico, no genérico.
- **easycancha:** *"Sería bueno que la app te muestre los horarios disponibles dentro de un
  día en lugar de estar probando con distintos horarios hasta encontrar uno disponible"*
  → Mostrar TODOS los slots del día juntos. No obligar a adivinar cuándo hay libre.
- **easycancha:** *"A veces se queda pegado eternamente cargando alguna pantalla,
  haciendo perder reservas"*
  → Timeout de 8s siempre. Nunca spinner infinito.
- **easycancha:** el banner de publicidad tapaba el botón de reservar
  → Cero publicidad en el flujo de reserva.
- **ATC Sports:** *"No me abre la aplicación hace días"*
  → Caché offline: mostrar reservas guardadas aunque no haya red.
- **Canchea (Uruguay):** sin pago online, redirige al WhatsApp del club
  → Pago integrado en el mismo flujo, no salir de la app.

### El usuario promedio del mercado:
- Está parado afuera, con el teléfono en una mano, con prisa.
- Tiene 20–40 años, ya usa Yape/Plin/MercadoPago sin problemas.
- Android de gama media (Motorola G, Samsung A) con señal 3G–4G.
- No lee instrucciones. Si no entiende en 3 segundos, cierra la app.
- Ya decidió con quién jugar antes de abrir la app. Solo necesita confirmar la cancha.
- Su referencia de "app fácil" es WhatsApp y Yape.

> **Diseña para resolver el problema del usuario, no para impresionar a otros diseñadores.**

---

## 1. Paleta de colores

Cada color tiene un propósito funcional, no decorativo.

```css
:root {
  /* ─── VERDE: ACCIÓN PRINCIPAL ─── */
  /* El verde = pasto = "ir a jugar". Se usa SOLO en el CTA principal.
     No lo uses para iconos, badges, ni decoración. */
  --green-action:      #16A34A;   /* botón "Reservar", "Confirmar", "Pagar" */
  --green-dark:        #15803D;   /* hover / pressed del botón verde */
  --green-soft:        #DCFCE7;   /* fondo badge "Disponible", mensaje de éxito */
  --green-text:        #14532D;   /* texto sobre --green-soft */

  /* ─── AZUL NOCHE: ESTRUCTURA ─── */
  /* Las canchas más demandadas son las nocturnas. Azul noche = autoridad.
     Usar en headers, textos importantes, selección activa. */
  --navy-deep:         #0F2D4A;   /* header de la app, textos principales */
  --navy-mid:          #1E4976;   /* íconos, bordes de selección activa */
  --navy-soft:         #E8F0FD;   /* fondo de tarjetas informativas */

  /* ─── NARANJA: URGENCIA Y PRECIO ─── */
  /* Naranja = llamada de atención sin gritar.
     Precio, contador de tiempo, "último slot disponible". */
  --orange-price:      #EA580C;   /* precio, contador de TTL */
  --orange-soft:       #FFF3EA;   /* fondo de badge de precio */

  /* ─── NEUTROS ─── */
  --white:             #FFFFFF;
  --gray-page:         #F5F7FA;   /* fondo de página (no blanco puro: reduce fatiga bajo sol) */
  --gray-card:         #FFFFFF;   /* fondo de tarjetas */
  --gray-border:       #E4E7EC;   /* bordes, separadores */
  --gray-placeholder:  #98A2B3;   /* placeholder, labels inactivos */
  --gray-secondary:    #667085;   /* texto secundario */
  --gray-primary:      #101828;   /* texto principal */

  /* ─── ESTADOS DE SLOT ─── */
  /* Deben ser entendibles sin leer texto. Testear con simulador de daltonismo. */
  --slot-free:         #DCFCE7;   /* verde claro */
  --slot-free-text:    #14532D;
  --slot-free-border:  #86EFAC;
  --slot-taken:        #FEE2E2;   /* rojo claro */
  --slot-taken-text:   #991B1B;
  --slot-taken-border: #FCA5A5;
  --slot-selected:     #0F2D4A;   /* azul noche: seleccionado por el usuario */
  --slot-selected-text:#FFFFFF;
  --slot-pending:      #FEF9C3;   /* amarillo: en proceso de pago por otro usuario */
  --slot-pending-text: #713F12;
}
```

**Reglas de uso:**
- `--green-action` aparece **máximo 1 vez** por pantalla, en el CTA más importante.
- El precio siempre en `--orange-price`. Nunca en verde (confunde con "disponible").
- `--navy-deep` para el header de la app y títulos de sección.
- Fondo de página siempre `--gray-page`, no blanco puro.

---

## 2. Tipografía

Una sola familia tipográfica. Menos decisiones = más consistencia entre pantallas.

```css
/* <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"> */

:root {
  --font: 'Plus Jakarta Sans', 'Segoe UI', sans-serif;
  /* Legible en pantalla pequeña bajo luz solar directa. */

  /* Escala MOBILE FIRST */
  --text-xs:    0.75rem;    /* 12px — timestamps, metadatos */
  --text-sm:    0.875rem;   /* 14px — texto secundario */
  --text-base:  1rem;       /* 16px — cuerpo principal */
  --text-lg:    1.125rem;   /* 18px — nombres de venue, precios */
  --text-xl:    1.25rem;    /* 20px — títulos de sección */
  --text-2xl:   1.5rem;     /* 24px — precio total, título de pantalla */
  --text-3xl:   1.875rem;   /* 30px — saldo a pagar en QR */
}
```

**Regla crítica:** ningún texto interactivo puede ser menor a 14px.
En móvil bajo sol, 16px es el mínimo cómodo para texto de cuerpo.

---

## 3. Breakpoints y tamaños de toque

```
móvil chico:    < 360px   — Motorola G Play, Samsung A03 (mercado objetivo real)
móvil estándar: 360–767px — mayoría de usuarios
tablet:         768–1023px
laptop:         1024–1279px
desktop:        ≥ 1280px
```

El **95% de las sesiones serán desde móvil**. Desktop es para Partners y Admin.
Diseñar primero el móvil en 375px. Luego adaptar arriba.

**Tamaños mínimos de toque (área táctil):**
- Botones de acción principales: `min-height: 52px`
- Slots de horario: `min-height: 44px`, `min-width: 72px`
- Ítems de lista (venue card, booking): `min-height: 56px`
- Nunca dos elementos tocables a menos de 8px de distancia vertical

---

## 4. Pantallas críticas — guía basada en lo que funciona en el mercado real

### 4.1 HOME — La lección de ATC Sports

ATC (líder LATAM) no tiene hero banner ni ilustraciones. Su home **es el buscador**.
Eso es lo que el usuario quiere cuando abre la app. El resto es ruido.

```
┌─────────────────────────────────┐
│ 🏟 CanchasApp        [👤 Perfil]│  ← header mínimo
├─────────────────────────────────┤
│  📍 Carhuaz, Ancash             │  ← ubicación auto, tocable para cambiar
│                                  │
│  [⚽ Fútbol 5           ▼]      │  ← selector de deporte
│  [📅 Hoy, sábado 10 ene ▼]      │  ← fecha
│  [⏰ 18:00              ▼]      │  ← hora
│                                  │
│  [     Buscar canchas →     ]   │  ← CTA verde, w-full, 52px alto
│                                  │
├─────────────────────────────────┤
│  Mis últimas canchas            │  ← acceso rápido, no más de 2
│  [Los Pinos · mié 8 ene]        │
│  [El Estadio · lun 6 ene]       │
└─────────────────────────────────┘
```

**Lo que NO poner en home:**
- Banners de marketing / sliders (en easycancha el banner tapaba el botón — queja real)
- Tour de funciones al primer ingreso
- "Canchas destacadas" (implica pago por posición)
- Cualquier elemento que retrase llegar al buscador

---

### 4.2 RESULTADOS — El diferenciador que la competencia ignora

El problema que ninguna app actual resuelve bien: el usuario llega a la lista y no sabe
cómo elegir. Precio + distancia + nombre. Nada más. Hay que agregar: **próximo slot disponible**.

```
┌────────────────────────────────────┐
│ ← Fútbol 5 · Hoy · 18:00          │
│ 8 canchas disponibles              │
├────────────────────────────────────┤
│ [Precio ▼]  [Distancia ▼]  [Más ▼]│  ← filtros compactos, no en modal
├────────────────────────────────────┤
│ ┌──────────────────────────────┐   │
│ │ [foto 16:9 lazy]             │   │
│ │ ⭐4.8  📍 1.2km desde ti     │   │
│ │ Complejo Los Pinos           │   │
│ │ Grass sintético · Techado    │   │
│ │ Próximo libre: 18:00         │   │  ← diferenciador clave
│ │ desde S/ 60 / hora           │   │  ← precio en --orange-price
│ │ [Ver horarios disponibles →] │   │
│ └──────────────────────────────┘   │
└────────────────────────────────────┘
```

**Reglas de VenueCard:**
- Foto con `aspect-ratio: 16/9`, `object-fit: cover`, `loading="lazy"` siempre
- Skeleton mientras carga (no spinner)
- Precio con "desde S/" en `--orange-price`
- Distancia siempre visible. Si > 10km, mostrar en gris secundario con advertencia
- Rating solo si tiene 5+ reseñas (no mostrar 0 reseñas ni 5★ vacíos)

---

### 4.3 SELECTOR DE HORARIOS — El más importante del producto

**La queja más frecuente en todas las apps:** el usuario tiene que probar horario por horario
hasta encontrar uno libre. Eso es diseño fallido.

**Solución:** mostrar el día completo de un vistazo. El usuario ve en 1 segundo qué hay y qué no.
Este patrón es el diferenciador más concreto frente a ATC y easycancha.

```
┌──────────────────────────────────┐
│ ← Complejo Los Pinos · Cancha 1  │
├──────────────────────────────────┤
│ [Vie 9][Sáb 10 ✓][Dom 11][Lun 12]│  ← chips de fecha, scroll horizontal
├──────────────────────────────────┤
│ Sábado 10 de enero               │
│                                  │
│ Mañana                           │
│ [08][09][10][11][12][13]         │
│ [🟢][🟢][🔴][🔴][🟢][🟢]        │
│                                  │
│ Tarde                            │
│ [14][15][16][17][18][19]         │
│ [🟢][🟢][🟢][🔵][🔵][🔴]        │  ← 17 y 18 = seleccionados (azul)
│                                  │
│ Noche                            │
│ [20][21][22][23]                 │
│ [🟢][🟢][🟢][─ ]                 │  ← 23:00 cerrado
│                                  │
│ ── 🟢 Libre  🔴 Ocupado  🔵 Tú ──│  ← leyenda siempre visible
├──────────────────────────────────┤
│ Seleccionaste: 17:00 – 19:00     │
│ 2 horas · Grass sintético        │
│                                  │
│ Anticipo ahora:    S/ 36.00      │
│ Saldo en cancha:   S/ 84.00      │
├──────────────────────────────────┤
│ [   Continuar al pago →   ]      │  ← sticky bottom, verde
└──────────────────────────────────┘
```

**Reglas del SlotGrid:**
- Cada slot: mínimo `72px ancho × 44px alto` en móvil
- Hora en formato 24h (nunca AM/PM — en LATAM el 12/24h genera confusión)
- Slots no contiguos: vibración + mensaje "Los slots deben ser seguidos"
- El sticky footer con precio aparece al seleccionar el primer slot
- El precio del footer se actualiza en tiempo real al agregar/quitar slots
- Mostrar TODOS los slots del día — deshabilitar ocupados pero no ocultarlos
  (el usuario necesita ver el contexto completo del día)
- Máximo 4 slots seleccionables por booking (regla de negocio del sistema)

---

### 4.4 CHECKOUT — Donde más se abandona en toda la competencia

La principal causa de abandono en easycancha y ATC es el proceso de pago.
Causas reales confirmadas en reseñas:
1. Error silencioso en tarjeta sin mensaje específico
2. El usuario no entiende la diferencia entre "anticipo" y "saldo"
3. Redirect a pasarela externa que rompe el flujo
4. La app queda "cargando" sin timeout, bloqueando el slot del usuario

**Principio:** el checkout debe sentirse como confirmar, no como pagar.

```
┌──────────────────────────────────┐
│ ← Confirmar reserva              │
├──────────────────────────────────┤
│ Cancha 1 · Complejo Los Pinos    │
│ Sáb 10 ene · 17:00 – 19:00      │
│ Grass sintético · Techado        │
├──────────────────────────────────┤
│ Método de pago                   │
│ ○ Yape / Plin (QR)               │
│ ● Tarjeta (débito o crédito)     │
│ ○ Pago completo en cancha        │
│                                  │
│ [  4242  4242  4242  4242  ]     │  ← formato automático 4-4-4-4
│ [MM/AA       ]  [CVV  ]          │  ← teclado numérico en móvil
├──────────────────────────────────┤
│ Anticipo ahora:       S/ 36.00   │  ← siempre visible
│ Saldo en cancha:      S/ 84.00   │  ← siempre visible
│ ─────────────────────────────── │
│ Total reserva:       S/ 120.00   │
├──────────────────────────────────┤
│ ⏱ Tu horario se libera en 8:47  │  ← naranja, aparece al llegar a <5min
│                                  │
│ [  Confirmar y pagar S/ 36  →  ] │  ← el monto va en el botón
└──────────────────────────────────┘
```

**Reglas críticas de checkout:**
- El botón muestra el monto: "Confirmar y pagar S/ 36" — nunca solo "Confirmar"
- Desglose anticipo + saldo SIEMPRE visible. Si el usuario no ve el saldo, se sorprende en cancha.
- Contador del TTL (600s del backend) → mostrar en pantalla como "Tu horario se reserva por X min"
- Si el pago falla → banner rojo con causa específica:
  - "Saldo insuficiente — intenta con otra tarjeta"
  - "Datos de tarjeta incorrectos — verifica el número"
  - "Tarjeta vencida — usa una vigente"
  - NUNCA solo "Error al procesar el pago"
- Input de tarjeta: formato automático, teclado numérico, máscara 4-4-4-4
- Mientras procesa: botón deshabilitado + texto "Procesando..." — no spinner flotante que desaparece
- Timeout de 15s → si no responde, mostrar "Tomando más tiempo de lo usual. No cierres esta pantalla."
- NO redirigir fuera de la app para pagar. Si la pasarela requiere webview, retorno automático.

---

### 4.5 CONFIRMACIÓN

```
┌──────────────────────────────────┐
│         ✅                       │
│   ¡Reserva confirmada!           │
│                                  │
│ Cancha 1 · Complejo Los Pinos    │
│ Sáb 10 ene · 17:00 – 19:00      │
│ Grass sintético · Techado        │
│                                  │
│ Anticipo pagado:      S/ 36.00   │
│ Saldo en cancha:      S/ 84.00   │  ← recordarle siempre
│                                  │
│ ┌──────────────────────────────┐ │
│ │    [QR CODE · 240x240px]     │ │  ← fondo BLANCO PURO
│ └──────────────────────────────┘ │
│                                  │
│ Muestra este QR al llegar        │
│                                  │
│ [Compartir por WhatsApp]         │  ← flujo natural para avisar a los demás
│ [Ver en mis reservas]            │
└──────────────────────────────────┘
```

**Reglas:**
- QR mínimo 240×240px. Fondo BLANCO PURO (no gris, no transparente — el escáner necesita contraste).
- Enviar push notification y/o WhatsApp con los datos en este momento.
- "Saldo en cancha" siempre presente — el usuario necesita recordarlo cuando llegue.
- "Compartir por WhatsApp" → el flujo más usado en LATAM para avisar al grupo de fútbol.

---

### 4.6 QR EN PANTALLA (lo que el Staff escanea)

```
┌──────────────────────────────────┐
│ ← Mis Reservas                   │
│ Complejo Los Pinos · Cancha 1    │
│ Sáb 10 ene · 17:00              │
│                                  │
│ ┌────────────────────────────┐   │
│ │                            │   │
│ │  [QR CODE · min 280px]     │   │  ← sin bordes decorativos
│ │                            │   │
│ └────────────────────────────┘   │
│                                  │
│       Saldo a pagar:             │
│       S/ 84.00                   │  ← text-3xl bold, --orange-price
│                                  │
│  [Pantalla completa]             │  ← pantalla completa + brillo 100%
└──────────────────────────────────┘
```

**Reglas:**
- "Pantalla completa" → fullscreen API, fondo blanco, QR centrado, brillo al 100%.
- El saldo en tipografía grande y naranja es lo primero que lee el Staff al escanear.
- `wakeLock` API: prevenir que la pantalla se bloquee mientras esta vista esté activa.
- Sin barra de navegación, sin tabs, sin distractores en modo fullscreen.

---

### 4.7 PWA STAFF — Herramienta de trabajo, no una app bonita

El Staff procesa personas bajo presión. No tiene tiempo de explorar interfaces.

```
PANTALLA PRINCIPAL DE TURNO:
┌──────────────────────────────────┐
│ ● Turno abierto                  │
│ Juan López · Los Pinos           │
│ 14:00 – 22:00                    │
├──────────────────────────────────┤
│                                  │
│  [  📷  ESCANEAR QR  ]          │  ← botón principal 80px alto, verde
│                                  │
│  [+ Nueva reserva presencial]    │  ← walk-in
│  [📋 Reservas de hoy]            │
│  [💰 Cerrar turno]               │
└──────────────────────────────────┘

RESULTADO ESCANEO — ÉXITO:
┌──────────────────────────────────┐
│ ✅  VÁLIDO                       │  ← fondo verde, vibración corta
│                                  │
│ Carlos Mamani                    │
│ 17:00 – 19:00 · Cancha 1        │
│                                  │
│      Cobrar en caja:             │
│      S/ 84.00                    │  ← text-5xl bold, imposible ignorar
│                                  │
│ [Confirmar cobro] [Cancelar]     │
└──────────────────────────────────┘

RESULTADO ESCANEO — ERROR:
┌──────────────────────────────────┐
│ ❌  NO VÁLIDO                    │  ← fondo rojo, vibración larga
│                                  │
│ Reserva cancelada                │
│ — o —                            │
│ Horario incorrecto (19:00, no    │
│ 17:00)                           │
│ — o —                            │
│ Ya registrado (16:58)            │
│                                  │
│ [Volver a escanear]              │
└──────────────────────────────────┘
```

**Reglas PWA Staff:**
- Solo 4 acciones en pantalla principal. Nada más.
- Éxito/error debe ser legible desde 1 metro (el Staff no pone el teléfono en la cara del cliente).
- Feedback háptico: vibración corta = ok, vibración larga = error.
- Funciona offline con reservas del día en caché local.
- Acceso en < 10 segundos desde que abre el navegador — medir esto.

---

### 4.8 DASHBOARD PARTNER — Desktop primero

Partners usan esto desde computadora o tablet, no desde móvil.

```
sidebar fijo:
├── 📊 Hoy
├── 🏟 Mis complejos
├── 📅 Reservas
├── 👥 Staff
└── 💰 Ingresos

contenido principal — vista del día (GRILLA, no tabla de texto):
          08  09  10  11  12  13  14  15  16  17  18  19  20  21
Cancha 1  [──────Carlos────][──libre──][══Ana══][════Miguel═══════]
Cancha 2  [libre][──────────────Torneo interno──────────────────]
Cancha 3  [══Pepe══][libre][══José══][libre   ][══════Alan═══════]
```

**Reglas dashboard Partner:**
- La grilla de canchas es la vista principal. No una tabla con filas.
- Verde claro = reserva pagada online. Azul = walk-in presencial. Gris = bloqueado/evento.
- Click en un bloque → detalle en panel lateral, sin navegar a otra página.
- KPIs del día (reservas / ocupación / ingresado / saldo pendiente) siempre visibles arriba.

---

## 5. Navegación

### App usuario (mobile):

```
Bottom tab bar — SIEMPRE visible, nunca ocultar al hacer scroll:
[🔍 Buscar]  [📋 Mis reservas]  [👤 Perfil]
```

3 tabs máximo. El usuario de canchas no necesita más.

**Flujo principal en ≤ 4 pasos:**

```
Buscar → Resultados → Horarios → Checkout → ✅ Confirmación
   1          2           3           4           fin
```

**Regla crítica:** el login se pide SOLO al intentar reservar (justo antes del checkout).
Nunca interrumpir el flujo de búsqueda para pedir login.

---

## 6. Estados de carga — Aprendizaje de los errores de la competencia

El spinner infinito de easycancha hizo perder reservas a usuarios reales.
Regla: **el usuario nunca debe preguntarse si la app está funcionando**.

```tsx
// Skeleton para lista de venues (no spinner)
function VenueCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="bg-gray-200 h-36 w-full" />
      <div className="p-3 space-y-2">
        <div className="bg-gray-200 h-4 w-3/4 rounded" />
        <div className="bg-gray-200 h-3 w-1/2 rounded" />
        <div className="bg-gray-200 h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}
```

**Timeouts obligatorios:**
- Búsqueda de venues: máx **8 segundos** → "No se pudo cargar. ¿Reintentar?" con botón.
- Proceso de pago: máx **15 segundos** → "Tomando más tiempo. No cierres esta pantalla."
  (no marcar como fallido — puede estar procesando en la pasarela)
- Carga del QR propio: desde caché primero, actualizar en segundo plano
- Spinner solo para acciones puntuales (pagar, confirmar un walk-in), nunca para carga de listas

---

## 7. Mensajes de error — La lección de easycancha

```ts
// Errores de pago específicos (no genéricos)
const paymentErrors: Record<string, string> = {
  'insufficient_funds':  'Saldo insuficiente. Intenta con otra tarjeta.',
  'card_declined':       'Tarjeta rechazada. Verifica el número.',
  'expired_card':        'Tarjeta vencida. Usa una vigente.',
  'invalid_cvv':         'CVV incorrecto. Revisa los 3 dígitos del dorso.',
  'processing_error':    'Error temporal. Espera 30s e intenta de nuevo.',
  'slot_taken':          'Ese horario fue tomado mientras pagabas. Elige otro.',
  'network_error':       'Sin conexión. Revisa tu señal e intenta de nuevo.',
  'default':             'No se pudo procesar. Intenta de nuevo.',
};

// Dónde mostrar los errores:
// - Errores de PAGO → banner rojo fijo encima del botón de pagar (no desaparece)
// - Errores de BÚSQUEDA → inline en el área de resultados
// - Errores de RED → toast persistente en top de pantalla
// - Éxitos → toast verde que desaparece a los 3s
// NUNCA: alert nativo del browser, modal bloqueante para errores menores
```

---

## 8. Responsive: patrones específicos del producto

### Slot grid:

```tsx
// MÓVIL: scroll horizontal para ver todo el día
<div className="overflow-x-auto -mx-4 px-4">
  <div className="flex gap-2 pb-2" style={{minWidth: 'max-content'}}>
    {slots.map(slot => <SlotChip key={slot.id} slot={slot} />)}
  </div>
</div>

// DESKTOP (dashboard partner): grilla 2D con canchas en filas, horas en columnas
```

### Bottom sheet en vez de modal (mobile):

En móvil, los modales centrados son difíciles de alcanzar con el pulgar.
Selectores de fecha, hora, deporte, método de pago → siempre como bottom sheet.

```
Bottom sheet: desliza desde abajo · cubre 65% de pantalla
Drag handle arriba · toque al backdrop para cerrar
```

### Checkout layout:

- **Móvil:** stack vertical con sticky footer (precio + botón de pagar fijo abajo)
- **Desktop/tablet:** dos columnas (resumen a la izquierda, formulario de pago a la derecha)

---

## 9. Accesibilidad mínima obligatoria

- Cada slot tiene `aria-label="17:00, disponible"` / `"ocupado"` / `"seleccionado por ti"`
- Color no es el único indicador de estado: icono + texto siempre junto al color
- Todo `<button>` sin texto visible tiene `aria-label`
- Foco visible en todos los elementos: `focus-visible:ring-2 focus-visible:ring-offset-2`
- Contraste AA en todos los textos (usar https://webaim.org/resources/contrastchecker/)
- Imágenes: `alt="Foto de Complejo Los Pinos"`, nunca `alt=""` en imágenes informativas

---

## 10. Anti-patrones confirmados por investigación real de mercado

| ❌ Problema real (fuente: reseñas reales de usuarios) | ✅ Solución |
|---|---|
| Banner sobre el botón de reservar (easycancha — queja frecuente) | Cero publicidad dentro del flujo de reserva |
| Spinner infinito sin timeout → usuario pierde el slot (easycancha) | Timeout 8s búsqueda, 15s pago + mensaje accionable |
| "Probar hora por hora" para encontrar disponible (easycancha) | Vista completa del día con todos los slots |
| Error de pago genérico "Error al procesar" (easycancha) | Mensaje específico por tipo de error de pasarela |
| Login con magic link → salir de la app a abrir el correo (ATC) | Email + contraseña + OAuth Google, sin salir de la app |
| App que no abre → usuario no puede ver su reserva (ATC) | Caché local de reservas, funciona offline |
| Redirigir al WhatsApp del club para confirmar (Canchea) | Pago y confirmación 100% dentro de la app |
| QR sin fondo blanco puro → escáner no lo lee | `background: #FFFFFF` obligatorio, sin transparencias |
| Pantalla se bloquea mientras el usuario muestra el QR | `wakeLock` API activa en pantalla de QR |
| Saldo a pagar en cancha oculto o pequeño | S/ saldo siempre visible: en checkout, confirmación y QR |
| 5 o más tabs en la navegación del usuario | Máximo 3 tabs: Buscar / Mis reservas / Perfil |
| Login interrumpe la búsqueda antes de elegir cancha | Login solo al hacer clic en "Reservar", no antes |
