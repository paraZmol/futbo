---
name: database-schema-canchas
description: >
  Usa este skill cuando trabajes con el esquema de base de datos del proyecto Canchas: diseñar tablas,
  escribir migraciones, agregar índices, relaciones, consultas geoespaciales o cualquier decisión
  relacionada con MySQL 8 en este sistema. También úsalo cuando se discuta el modelo de datos de
  venues, canchas (fields), slots, bookings, shifts, pagos o usuarios. NO usar para lógica de
  aplicación, endpoints de API ni componentes frontend.
---

# Skill: Esquema de Base de Datos — Proyecto Canchas

## Contexto del sistema

Marketplace dos caras que conecta complejos deportivos (Partners) con jugadores (Usuarios).
Motor central: reserva en tiempo real de **Slots** (bloques de 60 min) con garantía anti-colisión.

---

## 1. Principios irrompibles

1. **Montos SIEMPRE `DECIMAL(10,2)`.** Nunca `FLOAT`, `DOUBLE` ni `numeric` sin precisión.
2. **Timestamps SIEMPRE en UTC.** Usar `dateTime` (no `timestamp` — overflow 2038).
3. **Búsquedas geoespaciales SIEMPRE con índice `SPATIAL`.** Cero cálculos de distancia en PHP.
4. **Charset `utf8mb4` + collation `utf8mb4_unicode_ci`** en todas las tablas.
5. **FK con `ON DELETE` explícito.** Default del proyecto: `restrictOnDelete()`.
6. **Ningún registro financiero se borra.** Solo soft-delete o estados terminales.
7. **Una migración aplicada a producción no se modifica.** Siempre migración nueva para correcciones.

---

## 2. Tablas principales y su esquema

### 2.1 `users`
```php
Schema::create('users', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->string('public_id', 32)->unique();         // ULID prefijado: usr_01...
    $table->string('name', 120);
    $table->string('email', 191)->unique();
    $table->string('password')->nullable();             // NULL si es OAuth
    $table->string('phone', 20)->nullable();
    $table->string('phone_verified_at')->nullable();
    $table->enum('role', ['user', 'partner', 'staff', 'admin'])->default('user');
    $table->enum('status', ['active', 'suspended', 'deleted'])->default('active');
    $table->timestamp('email_verified_at')->nullable();
    $table->timestamps();
    $table->softDeletes();

    $table->index(['email', 'status'], 'idx_users_email_status');
    $table->index(['role', 'status'], 'idx_users_role_status');
});
```

### 2.2 `venues` (Complejos deportivos)
```php
Schema::create('venues', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->string('public_id', 32)->unique();           // vnu_01...
    $table->foreignId('partner_id')->constrained('users')->restrictOnDelete();
    $table->string('name', 120);
    $table->string('slug', 140)->unique();
    $table->text('address');
    $table->string('city', 80);
    $table->string('country_code', 2)->default('PE');
    $table->decimal('lat', 10, 7);
    $table->decimal('lng', 10, 7);
    $table->geometry('location', 'point', 4326)->nullable(); // índice SPATIAL aparte
    $table->string('phone', 20)->nullable();
    $table->string('whatsapp', 20)->nullable();
    $table->json('amenities')->nullable();               // ['estacionamiento','vestuarios',...]
    $table->json('photos')->nullable();                  // URLs en Object Storage
    $table->enum('status', ['pending', 'active', 'suspended'])->default('pending');
    $table->timestamps();
    $table->softDeletes();

    $table->index(['status', 'city'], 'idx_venues_status_city');
    $table->index('partner_id', 'idx_venues_partner');
});

// SPATIAL separado (no soportado en Blueprint inline con MySQL 8 + Laravel)
DB::statement('ALTER TABLE venues ADD SPATIAL INDEX idx_venues_location (location)');
```

> **Nota:** `location` se llena por trigger de aplicación con `ST_GeomFromText('POINT(lng lat)', 4326)`
> cada vez que se actualice `lat` o `lng`. No duplicar manualmente.

### 2.3 `fields` (Canchas dentro de un venue)
```php
Schema::create('fields', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->string('public_id', 32)->unique();           // fld_01...
    $table->foreignId('venue_id')->constrained()->restrictOnDelete();
    $table->string('name', 80);                          // "Cancha 1", "Fútbol 5 B"
    $table->enum('sport', ['futbol5', 'futbol7', 'futbol11', 'padel', 'basket', 'tenis', 'otro']);
    $table->enum('surface', ['grass_natural', 'grass_sintetico', 'cemento', 'parquet', 'otro']);
    $table->unsignedTinyInteger('capacity_players')->default(10);
    $table->boolean('is_indoor')->default(false);
    $table->boolean('is_active')->default(true);
    $table->json('photos')->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();
    $table->softDeletes();

    $table->index(['venue_id', 'sport', 'is_active'], 'idx_fields_venue_sport');
});
```

### 2.4 `schedule_templates` (Matriz de horarios por campo)
```php
Schema::create('schedule_templates', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->foreignId('field_id')->constrained()->restrictOnDelete();
    $table->unsignedTinyInteger('day_of_week');          // 0=Domingo … 6=Sábado
    $table->time('starts_at');                           // 08:00:00
    $table->time('ends_at');                             // 23:00:00
    $table->unsignedTinyInteger('slot_duration_min')->default(60);
    $table->decimal('price', 10, 2);
    $table->char('currency', 3)->default('PEN');
    $table->decimal('deposit_ratio', 4, 2)->default(0.30); // 30% anticipo
    $table->boolean('is_active')->default(true);
    $table->timestamps();

    $table->unique(['field_id', 'day_of_week', 'starts_at'], 'uniq_schedule_field_day_start');
    $table->index(['field_id', 'is_active'], 'idx_schedule_field_active');
});
```

### 2.5 `slots` (Inventario de disponibilidad)

**Tabla más crítica del sistema. Nunca agregar FLOAT aquí.**

```php
Schema::create('slots', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->foreignId('field_id')->constrained()->restrictOnDelete();
    $table->dateTime('starts_at');                       // UTC siempre
    $table->dateTime('ends_at');
    $table->decimal('unit_price', 10, 2);               // snapshot en el momento de generación
    $table->decimal('deposit_amount', 10, 2);
    $table->char('currency', 3)->default('PEN');
    $table->enum('state', [
        'available',
        'pending_payment',
        'reserved',
        'event_occupied',
        'completed',
        'expired',
    ])->default('available');
    $table->dateTime('lock_expires_at')->nullable();     // TTL del lock distribuido
    $table->unsignedInteger('version')->default(0);      // optimistic locking
    $table->timestamps();

    // Índices críticos para queries de disponibilidad
    $table->index(['field_id', 'starts_at', 'state'], 'idx_slots_field_starts_state');
    $table->index(['state', 'lock_expires_at'], 'idx_slots_state_lock');     // job de reconciliación
    $table->index(['field_id', 'state'], 'idx_slots_field_state');

    // Garantía única: mismo campo no puede tener dos slots solapados en mismo estado activo
    $table->unique(['field_id', 'starts_at'], 'uniq_slots_field_start');
});
```

### 2.6 `bookings`
```php
Schema::create('bookings', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->string('public_id', 32)->unique();           // bkg_01...
    $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignId('venue_id')->constrained()->restrictOnDelete();
    $table->foreignId('field_id')->constrained()->restrictOnDelete();
    $table->string('idempotency_key', 64)->unique();     // UUID por intento del cliente
    $table->dateTime('slot_starts_at');                  // inicio del primer slot
    $table->dateTime('slot_ends_at');                    // fin del último slot
    $table->decimal('price_total', 10, 2);              // suma de unit_price de slots
    $table->decimal('deposit_amount', 10, 2);           // anticipo cobrado
    $table->decimal('balance_due', 10, 2);              // saldo a pagar en cancha
    $table->decimal('platform_fee', 10, 2)->default(0); // comisión plataforma (fase 3)
    $table->char('currency', 3)->default('PEN');
    $table->enum('status', [
        'pending_payment',
        'reserved',
        'checked_in',
        'completed',
        'no_show',
        'cancelled',
        'refunded',
    ])->default('pending_payment');
    $table->enum('source', ['app', 'web', 'walk_in'])->default('app');
    $table->string('qr_token', 64)->unique()->nullable();
    $table->foreignId('staff_id')->nullable()->constrained('users')->nullOnDelete();
    $table->text('cancellation_reason')->nullable();
    $table->dateTime('checked_in_at')->nullable();
    $table->dateTime('no_show_at')->nullable();
    $table->dateTime('cancelled_at')->nullable();
    $table->unsignedInteger('version')->default(0);
    $table->timestamps();
    $table->softDeletes();                               // NUNCA borrar físicamente

    $table->index(['user_id', 'status'], 'idx_bookings_user_status');
    $table->index(['venue_id', 'status', 'slot_starts_at'], 'idx_bookings_venue_status_start');
    $table->index(['status', 'slot_starts_at'], 'idx_bookings_status_start');
    $table->index('qr_token', 'idx_bookings_qr');
});
```

### 2.7 `booking_slots` (Pivot: qué slots componen cada booking)
```php
Schema::create('booking_slots', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->foreignId('booking_id')->constrained()->restrictOnDelete();
    $table->foreignId('slot_id')->constrained()->restrictOnDelete();
    $table->decimal('unit_price_snapshot', 10, 2);      // precio inmutable al momento de reserva
    $table->timestamps();

    $table->unique(['booking_id', 'slot_id'], 'uniq_booking_slot');
    $table->index('slot_id', 'idx_booking_slots_slot');
});
```

### 2.8 `payments`
```php
Schema::create('payments', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->string('public_id', 32)->unique();
    $table->foreignId('booking_id')->constrained()->restrictOnDelete();
    $table->string('gateway', 32);                       // 'mercadopago', 'stripe', etc.
    $table->string('gateway_payment_id', 120)->nullable(); // ID externo de la pasarela
    $table->string('idempotency_key', 64)->unique();
    $table->decimal('amount', 10, 2);
    $table->char('currency', 3)->default('PEN');
    $table->enum('type', ['deposit', 'balance', 'refund', 'platform_fee']);
    $table->enum('status', ['pending', 'approved', 'rejected', 'refunded', 'cancelled']);
    $table->json('gateway_response')->nullable();        // raw del webhook, inmutable
    $table->timestamps();

    $table->index(['booking_id', 'type'], 'idx_payments_booking_type');
    $table->index(['gateway', 'gateway_payment_id'], 'idx_payments_gateway_ext');
    $table->index(['status', 'created_at'], 'idx_payments_status_created');
});
```

### 2.9 `webhook_events` (Auditoría de webhooks entrantes)
```php
Schema::create('webhook_events', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->string('gateway', 32);
    $table->string('event_id', 120);                    // ID único del evento externo
    $table->string('event_type', 80);
    $table->json('payload');                             // raw body firmado
    $table->boolean('signature_valid')->default(false);
    $table->boolean('processed')->default(false);
    $table->text('processing_error')->nullable();
    $table->timestamps();

    $table->unique(['gateway', 'event_id'], 'uniq_webhook_gateway_event'); // idempotencia
    $table->index(['processed', 'created_at'], 'idx_webhooks_processed');
});
```

### 2.10 `shifts` (Turnos de Staff)
```php
Schema::create('shifts', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->foreignId('venue_id')->constrained()->restrictOnDelete();
    $table->foreignId('staff_id')->constrained('users')->restrictOnDelete();
    $table->dateTime('opened_at');
    $table->dateTime('closed_at')->nullable();
    $table->decimal('cash_expected', 10, 2)->default(0);  // calculado al cierre
    $table->decimal('cash_delivered', 10, 2)->nullable();
    $table->decimal('cash_variance', 10, 2)->nullable();  // diferencia (puede ser negativa)
    $table->text('closing_notes')->nullable();
    $table->enum('status', ['open', 'closed'])->default('open');
    $table->timestamps();

    $table->index(['venue_id', 'status', 'opened_at'], 'idx_shifts_venue_status');
    $table->index(['staff_id', 'status'], 'idx_shifts_staff_status');
});
```

### 2.11 `events` (Bloqueos de Partner: torneos, mantenimiento)
```php
Schema::create('events', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->foreignId('field_id')->constrained()->restrictOnDelete();
    $table->string('title', 120);
    $table->dateTime('starts_at');
    $table->dateTime('ends_at');
    $table->enum('type', ['maintenance', 'tournament', 'private', 'other'])->default('other');
    $table->text('notes')->nullable();
    $table->timestamps();
    $table->softDeletes();

    $table->index(['field_id', 'starts_at', 'ends_at'], 'idx_events_field_range');
});
```

### 2.12 `audit_logs` (Bitácora inmutable de Admin)
```php
Schema::create('audit_logs', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
    $table->string('action', 80);                        // 'booking.refunded', 'partner.approved'
    $table->string('subject_type', 80);                  // 'Booking', 'User', etc.
    $table->unsignedBigInteger('subject_id');
    $table->json('before')->nullable();
    $table->json('after')->nullable();
    $table->string('ip_address', 45)->nullable();
    $table->string('user_agent', 255)->nullable();
    $table->timestamp('created_at');                     // NO usar timestamps() — no se actualiza

    $table->index(['subject_type', 'subject_id'], 'idx_audit_subject');
    $table->index(['user_id', 'created_at'], 'idx_audit_user_created');
    $table->index(['action', 'created_at'], 'idx_audit_action_created');
});
// ⚠️ NO agregar softDeletes ni updated_at. La tabla es append-only.
```

### 2.13 `ratings` (Calificaciones de usuarios)
```php
Schema::create('ratings', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->foreignId('booking_id')->constrained()->restrictOnDelete();
    $table->foreignId('user_id')->constrained()->restrictOnDelete();
    $table->foreignId('venue_id')->constrained()->restrictOnDelete();
    $table->unsignedTinyInteger('score');                // 1-5
    $table->text('comment')->nullable();
    $table->boolean('is_public')->default(true);
    $table->timestamps();

    $table->unique('booking_id', 'uniq_ratings_booking');  // 1 rating por booking
    $table->index(['venue_id', 'is_public', 'created_at'], 'idx_ratings_venue_public');
});
```

---

## 3. Consultas frecuentes y sus patrones

### Búsqueda geoespacial de venues con slots disponibles
```sql
-- Siempre ejecutar en read replica
SELECT
    v.public_id, v.name, v.address, v.lat, v.lng,
    ST_Distance_Sphere(v.location, ST_GeomFromText('POINT(:lng :lat)', 4326)) AS distance_m,
    MIN(s.starts_at) AS next_available_slot,
    MIN(s.unit_price) AS min_price
FROM venues v
JOIN fields f ON f.venue_id = v.id AND f.is_active = 1 AND f.sport = :sport
JOIN slots s ON s.field_id = f.id
    AND s.state = 'available'
    AND s.starts_at BETWEEN :date_from AND :date_to
WHERE v.status = 'active'
    AND ST_Distance_Sphere(v.location, ST_GeomFromText('POINT(:lng :lat)', 4326)) < :radius_m
GROUP BY v.id
ORDER BY distance_m ASC
LIMIT 20 OFFSET :offset;
```

### Lock optimista al reservar un slot
```sql
-- SIEMPRE dentro de transacción. ANTES del lock Redis.
UPDATE slots
SET state = 'pending_payment',
    lock_expires_at = UTC_TIMESTAMP() + INTERVAL 600 SECOND,
    version = version + 1
WHERE id = :slot_id
  AND state = 'available'
  AND version = :expected_version;
-- rowsAffected = 0 → otro proceso ganó → 409 Conflict
```

### Slots disponibles de un field en una fecha
```sql
SELECT id, starts_at, ends_at, unit_price, deposit_amount, state
FROM slots
WHERE field_id = :field_id
  AND starts_at BETWEEN :day_start AND :day_end
  AND state IN ('available', 'reserved', 'pending_payment', 'event_occupied')
ORDER BY starts_at ASC;
```

---

## 4. Reglas de negocio críticas en BD

| Regla | Implementación |
|---|---|
| Slot no puede solaparse en mismo field | `UNIQUE(field_id, starts_at)` en `slots` |
| Booking sin slots contiguos es inválido | Validado en capa de dominio antes de persistir |
| `price_total` = suma de snapshots de slots | Calcular en UseCase, no en BD |
| Un slot solo puede tener UN booking activo | Por la máquina de estados: `reserved` es exclusivo |
| No-Show solo posible ≥ 15 min después del inicio | Regla en `MarkNoShowUseCase`, no en BD |
| Máximo 4 slots por booking | Regla en `CreateBookingUseCase` |
| `audit_logs` es append-only | Sin FK de delete-cascade sobre ella |

---

## 5. Checklist antes de proponer una migración

- [ ] Montos: `DECIMAL(10,2)` sin excepción.
- [ ] Timestamps con `dateTime` (no `timestamp`). Los valores son UTC.
- [ ] FK con `ON DELETE` explícito.
- [ ] Índices nombrados con convención `idx_`, `uniq_`, `fk_`.
- [ ] Charset `utf8mb4` + collation `utf8mb4_unicode_ci`.
- [ ] Columnas nuevas en tablas existentes: nullable o con DEFAULT.
- [ ] `down()` funcional y testeado.
- [ ] No modifica ninguna migración ya aplicada a producción.
- [ ] `audit_logs` permanece sin soft-delete ni updated_at.
- [ ] Los índices SPATIAL se crean con `DB::statement('ALTER TABLE ... ADD SPATIAL INDEX ...')`.

---

## 6. Anti-patrones prohibidos

| ❌ Prohibido | ✅ Correcto |
|---|---|
| `$table->float('price')` | `$table->decimal('price', 10, 2)` |
| Calcular distancias en PHP | `ST_Distance_Sphere` en SQL |
| `$table->timestamp('created_at')` | `$table->dateTime('created_at')` |
| Guardar token de tarjeta | Solo token de pasarela PCI-DSS |
| `ON DELETE CASCADE` en bookings | `restrictOnDelete()` |
| Modificar migración existente en producción | Crear nueva migración correctiva |
| Borrar físicamente un booking o payment | Soft-delete o estado terminal |
| JSON para montos (`{"amount": 80.50}`) | Columna `DECIMAL(10,2)` separada |
