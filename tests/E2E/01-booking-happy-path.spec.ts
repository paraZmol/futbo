import { test, expect } from '@playwright/test';
import { resetDatabase, getToken } from './helpers/db';

test.describe('E2E-01: Usuario reserva un slot y recibe confirmación', () => {

    test.beforeAll(() => {
        resetDatabase();
    });

    test('login → ver slots → crear reserva → confirmar pago → ver QR', async ({ request }) => {
        const BASE = 'http://localhost:8000';

        // 1. Login como usuario
        const token = await getToken('user', BASE);
        expect(token).toBeTruthy();

        // 2. Obtener slots disponibles del campo 1 para hoy
        const today = new Date().toISOString().split('T')[0];
        const slotsRes = await request.get(`${BASE}/api/v1/fields/1/slots?date=${today}`);
        expect(slotsRes.ok()).toBeTruthy();

        const slotsData = await slotsRes.json() as { data: Array<{ id: number; state: string }> };
        const availableSlots = slotsData.data.filter((s) => s.state === 'available');
        expect(availableSlots.length).toBeGreaterThan(0);

        const slotId = availableSlots[0]!.id;

        // 3. Crear reserva (hold)
        const bookingRes = await request.post(`${BASE}/api/v1/bookings`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Idempotency-Key': crypto.randomUUID(),
            },
            data: { venue_id: 1, field_id: 1, slot_ids: [slotId] },
        });

        expect(bookingRes.status()).toBe(201);
        const bookingData = await bookingRes.json() as { data: { id: number; status: string; qrToken: string | null } };
        expect(bookingData.data.status).toBe('pending_payment');

        const bookingId = bookingData.data.id;

        // 4. Simular confirmación de pago (endpoint de test — solo en local)
        const confirmRes = await request.post(`${BASE}/api/v1/test/confirm-booking/${bookingId}`);
        expect(confirmRes.ok()).toBeTruthy();

        // 5. Verificar que la reserva está en estado reserved
        const bookingsRes = await request.get(`${BASE}/api/v1/bookings`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const bookingsData = await bookingsRes.json() as { data: Array<{ id: number; status: string; qrToken: string | null }> };
        const updatedBooking = bookingsData.data.find((b) => b.id === bookingId);

        expect(updatedBooking).toBeDefined();
        expect(updatedBooking!.status).toBe('reserved');
        expect(updatedBooking!.qrToken).toBeTruthy();
    });
});
