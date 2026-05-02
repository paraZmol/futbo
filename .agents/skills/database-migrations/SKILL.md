---
name: database-migrations
description: Use this skill when creating, editing, or reviewing Laravel database migrations under backend/database/migrations/. Also use when adding indexes, foreign keys, modifying columns, planning rollbacks, or considering the impact of a migration on production data. Use when the user asks "should I add an index here", "how do I add a column without locking the table", or anything related to MySQL 8 schema evolution. Do NOT use for query optimization at runtime (that goes in the relevant domain skill) or for seed data.
---

# Skill: Migraciones de Base de Datos

## Propósito

Las migraciones aplicadas a producción son irreversibles en la práctica. Esta skill define cómo escribirlas de forma segura, sin bloquear tablas grandes y respetando el contrato del Documento Maestro.

---

## 1. Reglas de oro

1. **Una migración aplicada a producción nunca se modifica.** Si hay error, se crea una migración nueva que corrige.
2. **Toda migración tiene `down()` real.** No `throw new \Exception('cannot rollback')`.
3. **Toda FK tiene índice** (MySQL crea uno automáticamente solo si no existe ya).
4. **Toda columna nueva en tabla grande es `NULL`-able o tiene `DEFAULT`.** Agregar `NOT NULL` sin default a una tabla con datos = error.
5. **Cambios destructivos en dos pasos:** primero deprecar (escribir en columna nueva, leer de ambas), después migrar datos, después eliminar la vieja.
6. **Foreign keys con `ON DELETE` explícito.** Nunca dejar el default. Decidir entre `RESTRICT`, `SET NULL`, `CASCADE` (raro).
7. **Charset y collation:** `utf8mb4` y `utf8mb4_unicode_ci` SIEMPRE. Verificar en cada `CREATE TABLE`.

---

## 2. Naming

- Archivo: `YYYY_MM_DD_HHMMSS_action_table_description.php`
  - `2026_05_15_143000_create_bookings_table.php`
  - `2026_05_16_091200_add_idempotency_key_to_bookings.php`
  - `2026_05_17_103000_add_index_on_slots_field_starts.php`
- Tablas: `snake_case` plural.
- Columnas: `snake_case` singular.
- Índices: `idx_<tabla>_<columnas>`. Únicos: `uniq_<tabla>_<columnas>`. FK: `fk_<tabla>_<col>_to_<refTable>`.

---

## 3. Plantilla base

```php
<?php
declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('public_id', 32)->unique(); // ULID con prefijo
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('venue_id')->constrained()->restrictOnDelete();
            $table->decimal('price_at_booking', 10, 2);
            $table->char('currency', 3)->default('PEN');
            $table->enum('status', ['pending_payment', 'reserved', 'cancelled', 'no_show'])
                  ->default('pending_payment');
            $table->unsignedInteger('version')->default(0);
            $table->timestamps();
            $table->softDeletes(); // ⚠️ verificar si la tabla lo permite (bookings NO permite delete real)

            $table->index(['user_id', 'created_at'], 'idx_bookings_user_created');
            $table->index(['venue_id', 'status'], 'idx_bookings_venue_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
```

---

## 4. Tipos correctos

| Caso | Usar | Evitar |
|---|---|---|
| Dinero | `decimal('amount', 10, 2)` | `float`, `double`, `numeric sin precisión` |
| ID público | `string('public_id', 32)->unique()` | `uuid` (binario) salvo justificación |
| Fechas | `dateTime('starts_at')` | `timestamp` (overflow 2038) |
| Booleano | `boolean('is_active')->default(false)` | `tinyint` manual |
| JSON | `json('metadata')` con cuidado | `text` para JSON |
| Enum corto y estable | `enum('status', [...])` | enum cambiante (pesado de migrar) |
| Texto largo | `text('description')` | `string('description', 65535)` |
| FK | `foreignId('user_id')->constrained()` | `unsignedBigInteger` + FK manual |

**Para `enum` cambiante usar:** `string('status', 32)` + validación en aplicación.

---

## 5. Índices: cuándo y cómo

### 5.1. Cuándo agregar índice

- Columna usada en `WHERE` frecuente.
- Columna usada en `ORDER BY` de queries frecuentes.
- FK (Laravel `constrained()` ya crea uno).
- Combinaciones recurrentes: índice compuesto en el orden de las queries.

### 5.2. Cuándo NO agregar

- Columnas con baja cardinalidad (booleano sin filtro frecuente).
- Tablas pequeñas (<10k filas estables).
- Columnas modificadas con muy alta frecuencia (índice = costo de escritura).

### 5.3. Índices compuestos: orden importa

```php
// Para query: WHERE field_id = ? AND starts_at BETWEEN ? AND ?
$table->index(['field_id', 'starts_at'], 'idx_slots_field_starts');
//             ^^^^ primero el de igualdad, después el de rango
```

### 5.4. Spatial (búsqueda geo)

```php
Schema::create('venues', function (Blueprint $table) {
    // ...
    $table->geometry('location', 'point', 4326)->nullable();
});

DB::statement('ALTER TABLE venues ADD SPATIAL INDEX idx_venues_location (location)');
```

`location` debe ser `NOT NULL` para que el spatial index funcione, pero a veces necesita ser nullable transitoriamente. Solución: dos pasos (agregar nullable, backfill, alterar a NOT NULL).

---

## 6. Migraciones en tablas grandes (>1M filas)

MySQL 8 con InnoDB hace muchos `ALTER` online, pero NO todos. Verificar antes:

| Operación | Bloquea tabla |
|---|---|
| `ADD COLUMN` con DEFAULT NULL al final | No (instantáneo en MySQL 8) |
| `ADD COLUMN` con DEFAULT no-nulo | Puede bloquear según tipo |
| `ADD INDEX` (no único) | No bloquea (online) |
| `ADD UNIQUE INDEX` | Sí bloquea durante la verificación |
| `MODIFY COLUMN` cambio de tipo | Generalmente bloquea |
| `DROP COLUMN` | Online en MySQL 8 |
| `RENAME COLUMN` | Instantáneo en MySQL 8 |
| `ADD FOREIGN KEY` | Bloquea brevemente |

**Para tablas >1M en producción, partir la migración:**
1. Migración 1: agregar columna nullable.
2. Backfill por job en batches de 1000.
3. Migración 2: alterar a NOT NULL.

---

## 7. Foreign keys: comportamiento al borrar

Decisión explícita siempre:

```php
// Si se borra el venue, fallar (no se permite borrar venue con bookings)
$table->foreignId('venue_id')->constrained()->restrictOnDelete();

// Si se borra el usuario, mantener booking pero anonimizar
$table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

// Si se borra el slot, borrar también booking_slots (raro, pensarlo dos veces)
$table->foreignId('slot_id')->constrained()->cascadeOnDelete();
```

**Default del proyecto:** `restrictOnDelete()` salvo justificación.

---

## 8. Rollback: cuándo se puede y cuándo no

`down()` **siempre debe ejecutarse sin error** en entorno limpio. Pero en producción:

- ✅ Rollback es seguro si la migración solo agregó estructura (columna, índice).
- ⚠️ Rollback es peligroso si hubo escrituras a la columna nueva.
- ❌ Rollback es imposible si se borró información.

**Política:** revertir en producción se hace con migración nueva, no con `migrate:rollback`.

---

## 9. Transacciones DDL

**MySQL no soporta DDL transaccional.** Si una migración tiene varios `Schema::table(...)` y falla a la mitad, el estado queda inconsistente. Soluciones:

1. Una migración = una operación lógica.
2. Si necesitas varias, hacerlas idempotentes (`if (!Schema::hasColumn(...))`).

---

## 10. Datos sensibles

- **No hacer seeders con PII real** en repositorio.
- **Encriptar columnas con datos sensibles** (DNI, datos bancarios) usando `Crypt::encryptString` a nivel de aplicación; en BD guardar el cifrado.
- **Borrado real** vs soft delete: para datos personales sujetos a derecho al olvido, borrado real más anonimización en agregados.

---

## 11. Checklist antes de proponer commit

- [ ] Nombre del archivo sigue convención.
- [ ] `up()` y `down()` ambos funcionales.
- [ ] FK con `ON DELETE` explícito.
- [ ] Índices nombrados explícitamente (`idx_...`).
- [ ] Charset `utf8mb4` y collation `utf8mb4_unicode_ci`.
- [ ] Columnas nuevas en tablas existentes son nullable o tienen DEFAULT.
- [ ] Si la tabla es grande, evalué el plan de aplicación.
- [ ] Probé `php artisan migrate` y `php artisan migrate:rollback` en local.
- [ ] No estoy modificando una migración ya aplicada en producción.
- [ ] El esquema resultante coincide con lo descrito en el Documento Maestro §9.
