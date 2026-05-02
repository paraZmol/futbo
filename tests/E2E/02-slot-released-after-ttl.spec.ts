import { test, expect } from '@playwright/test';
import { getToken } from './helpers/db';

test.describe('E2E-02: Slot vuelve a available si no llega pago', () => {

    test('slot en pending_payment es liberado por el job de expiración', async ({ request }) => {
        const BASE = 'http://localhost:8000';
        const token = await getToken('user', BASE);

        // 1. Obtener un slot disponible
        const today = new Date().toISOString().split('T')[0];
        const slotsRes = await request.get(`${BASE}/api/v1/fields/1/slots?date=${today}`);
        const slotsData = await slotsRes.json() as { data: Array<{ id: number; state: string }> };
        const availableSlots = slotsData.data.filter((s) => s.state === 'available');

        // Si no hay slots disponibles, saltar (otro test los puede haber ocupado)
        test.skip(availableSlots.length === 0, 'No hay slots disponibles para este test');

        const slotId = availableSlots[0]!.id;

        // 2. Crear reserva — queda en pending_payment
        const bookingRes = await request.post(`${BASE}/api/v1/bookings`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Idempotency-Key': crypto.randomUUID(),
            },
            data: { venue_id: 1, field_id: 1, slot_ids: [slotId] },
        });
        expect(bookingRes.status()).toBe(201);

        // 3. Verificar que el slot está en pending_payment
        const slotsAfterRes = await request.get(`${BASE}/api/v1/fields/1/slots?date=${today}`);
        const slotsAfterData = await slotsAfterRes.json() as { data: Array<{ id: number; state: string }> };
        const slot = slotsAfterData.data.find((s) => s.id === slotId);

        expect(slot?.state).toBe('pending_payment');

        // 4. Forzar expiración del lock vía artisan (en tests, TTL se puede simular)
        // El job ReleaseExpiredSlotsJob busca lock_expires_at < now()
        // Lo ejecutamos directamente para no esperar 10 minutos reales
        const { execSync } = await import('child_process');
        execSync(
            `php artisan tinker --execute="\\App\\Infrastructure\\Persistence\\Eloquent\\Models\\SlotModel::where('id', ${slotId})->update(['lock_expires_at' => now()->subMinute()]); \\Artisan::call('schedule:run');"`,
            { cwd: process.cwd() }
        );

        // 5. Ejecutar el job manualmente
        execSync('php artisan app:release-expired-slots 2>&1', { cwd: process.cwd() });

        // 6. Verificar que el slot volvió a available
        const slotsReleasedRes = await request.get(`${BASE}/api/v1/fields/1/slots?date=${today}`);
        const slotsReleasedData = await slotsReleasedRes.json() as { data: Array<{ id: number; state: string }> };
        const releasedSlot = slotsReleasedData.data.find((s) => s.id === slotId);

        expect(releasedSlot?.state).toBe('available');
    });
});
