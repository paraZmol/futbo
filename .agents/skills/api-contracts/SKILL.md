---
name: api-contracts
description: Use this skill when creating, modifying, or reviewing HTTP endpoints — controllers, route definitions, request validation, response shapes, error handling, idempotency keys, rate limiting, or anything in OpenAPI specification. Also use when the agent needs to ensure that error responses follow the standardized error envelope or when validating that a public API change is backward-compatible. Do NOT use for internal service-to-service communication that does not cross HTTP.
---

# Skill: Contratos de API

## Propósito

La API es el contrato entre el frontend, el dominio y los integradores. Cualquier inconsistencia en códigos, formatos de error o idempotencia genera bugs caros. Esta skill define la estructura única.

---

## 1. Versionado

Todos los endpoints viven bajo `/api/v1/...`. Cuando se necesite breaking change, se introduce `/api/v2/...` y se mantiene `v1` durante 6 meses mínimo.

---

## 2. Códigos HTTP (cuándo cuál)

| Código | Significado | Ejemplo |
|---|---|---|
| `200 OK` | Operación exitosa con cuerpo de respuesta | GET /venues |
| `201 Created` | Recurso creado con éxito; devolver el recurso | POST /bookings |
| `202 Accepted` | Aceptado para procesamiento asíncrono | POST /reports/generate |
| `204 No Content` | Éxito sin cuerpo | DELETE /sessions/me |
| `400 Bad Request` | Input mal formado, JSON inválido, falta `Idempotency-Key` | header faltante |
| `401 Unauthorized` | Sin token o token inválido | sesión expirada |
| `403 Forbidden` | Token válido pero sin permisos sobre el recurso | partner intenta borrar venue ajeno |
| `404 Not Found` | Recurso no existe o el caller no debe saber que existe | GET /bookings/{id} ajeno |
| `409 Conflict` | Estado actual del recurso impide la operación | slot ya reservado, booking ya cancelado |
| `410 Gone` | Recurso existió pero fue eliminado permanentemente | venue desactivado |
| `422 Unprocessable Entity` | Input válido sintácticamente pero falla reglas de negocio | fecha en pasado |
| `429 Too Many Requests` | Rate limit excedido | búsqueda spammeada |
| `500 Internal Server Error` | Bug del servidor | NUNCA exponer stacktrace |
| `502 Bad Gateway` | Servicio externo (pasarela, FCM) responde mal | |
| `503 Service Unavailable` | Mantenimiento o sobrecarga | |
| `504 Gateway Timeout` | Servicio externo no respondió en tiempo | |

**Regla:** nunca devolver `200 OK` con un body que diga `{"success": false}`. Usar el código HTTP correcto.

---

## 3. Envelope de respuesta

### 3.1. Éxito

```json
// GET singular
{
  "data": {
    "id": "bkg_01HZX9...",
    "status": "reserved",
    "...": "..."
  }
}

// GET lista
{
  "data": [ {...}, {...} ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 134,
    "totalPages": 7
  }
}
```

### 3.2. Error (formato único, todos los errores siguen esta forma)

```json
{
  "error": {
    "code": "SLOT_ALREADY_BOOKED",
    "message": "El horario seleccionado ya fue reservado por otro usuario.",
    "details": {
      "slotId": "slt_01HZX9..."
    },
    "traceId": "01HZX9ABCDEF..."
  }
}
```

- `code`: `SCREAMING_SNAKE_CASE`, estable, parte del contrato (clientes ramifican por él).
- `message`: en español, dirigido al usuario final.
- `details`: opcional, datos estructurados útiles para el cliente.
- `traceId`: ID de correlación para soporte.

**Códigos de error estables (extracto):**

| Código | HTTP | |
|---|---|---|
| `VALIDATION_FAILED` | 422 | input falla validación |
| `UNAUTHORIZED` | 401 | sin token |
| `FORBIDDEN` | 403 | sin permiso |
| `NOT_FOUND` | 404 | recurso ausente |
| `IDEMPOTENCY_KEY_MISSING` | 400 | falta header en POST mutante |
| `IDEMPOTENCY_KEY_REUSED` | 409 | misma key, payload distinto |
| `SLOT_ALREADY_BOOKED` | 409 | tercera línea de defensa |
| `SLOT_NOT_AVAILABLE` | 409 | slot fuera de ventana o inactivo |
| `BOOKING_TOO_OLD_TO_CANCEL` | 422 | reserva > 30 días |
| `PAYMENT_GATEWAY_UNAVAILABLE` | 502 | pasarela caída |
| `RATE_LIMIT_EXCEEDED` | 429 | |

Lista completa en `references/error-codes.md`.

---

## 4. Idempotency-Key obligatoria

### 4.1. Cuándo

Header `Idempotency-Key` es **obligatorio** en estos POSTs:
- `POST /bookings` (crear reserva)
- `POST /payments` (iniciar pago)
- `POST /events` (registrar evento walk-in)
- Cualquier POST que cobre, reserve recursos o emita notificaciones costosas.

Sin header → `400 IDEMPOTENCY_KEY_MISSING`.

### 4.2. Formato

UUID v4 generado por el cliente. Almacenado en tabla `idempotency_keys`:

```sql
CREATE TABLE idempotency_keys (
    key_value VARCHAR(64) PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    request_hash CHAR(64) NOT NULL,         -- SHA-256 del body
    response_status SMALLINT NOT NULL,
    response_body JSON NOT NULL,
    created_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,           -- 24h después
    INDEX idx_expires (expires_at)
);
```

### 4.3. Algoritmo del middleware

```
1. Extraer Idempotency-Key del header.
2. Calcular SHA-256 del body crudo.
3. Buscar en idempotency_keys WHERE key_value = ? AND user_id = ?.
4. Si existe:
     a. Si request_hash coincide → devolver response_status + response_body cacheado.
     b. Si NO coincide → 409 IDEMPOTENCY_KEY_REUSED.
5. Si no existe:
     a. Procesar request normal.
     b. Guardar (key, hash, status, body, expires_at = now + 24h).
6. Limpieza: job cron borra expirados cada hora.
```

---

## 5. Naming de rutas

- Plural en sustantivos: `/venues`, `/bookings`, `/users`.
- IDs anidados cuando hay relación de pertenencia: `/venues/{venueId}/fields`.
- Acciones que no encajan en CRUD usan sub-recursos: `POST /bookings/{id}/cancel`, `POST /bookings/{id}/check-in`.
- `kebab-case` siempre: `/booking-slots`, NO `/bookingSlots` ni `/booking_slots`.
- Filtros como query params: `GET /venues?city=lima&sport=futbol&radius=5000`.

---

## 6. Paginación

Estándar único: cursor o offset, NUNCA mezclar.

**Recomendado: offset/page para listas pequeñas, cursor para timelines grandes.**

```
GET /bookings?page=2&perPage=20
```

Response:
```json
{
  "data": [...],
  "meta": { "page": 2, "perPage": 20, "total": 134, "totalPages": 7 }
}
```

Para feeds (notificaciones, eventos):
```
GET /notifications?cursor=eyJpZCI6MTIzfQ&limit=50
```

---

## 7. Rate limiting

Por defecto, todos los endpoints tienen límite por IP + por usuario autenticado.

| Endpoint | Límite |
|---|---|
| `POST /auth/login` | 10/min por IP |
| `GET /venues/search` | 60/min por usuario |
| `POST /bookings` | 30/min por usuario |
| Webhooks entrantes | sin límite (validar por HMAC) |
| El resto | 120/min por usuario |

Header de respuesta:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1714579200
```

Excedido → `429 RATE_LIMIT_EXCEEDED`.

---

## 8. Fechas, dinero, IDs

- **Fechas:** ISO 8601 con sufijo Z. `"2026-05-15T14:30:00Z"`. NUNCA epoch milis ni formatos locales.
- **Dinero:** objeto `{ "amount": "150.00", "currency": "PEN" }`. `amount` como string para evitar problemas de float en JS.
- **IDs:** prefijo + ULID. `bkg_01HZX9...`, `slt_01HZX9...`, `usr_01HZX9...`. Nunca enteros autoincrementales en respuestas públicas.

---

## 9. OpenAPI como fuente de verdad

`docs/openapi.yaml` define todos los endpoints. Cuando el agente añade un endpoint:

1. Definirlo primero en `openapi.yaml`.
2. Generar (o actualizar) tests de contrato a partir del spec.
3. Implementar el controller respetando el spec.
4. Si el controller diverge del spec, **el spec gana**: corregir el controller.

---

## 10. Checklist antes de proponer commit

- [ ] Endpoints nuevos están en `openapi.yaml`.
- [ ] Códigos HTTP siguen la tabla de §2.
- [ ] Errores siguen el envelope de §3.2.
- [ ] POSTs mutantes validan `Idempotency-Key`.
- [ ] Rate limiting está aplicado al endpoint nuevo.
- [ ] Fechas en ISO 8601, dinero en objeto `{amount, currency}`.
- [ ] IDs públicos con prefijo + ULID.
