import { test, expect } from '@playwright/test';
import { getToken } from './helpers/db';

test.describe('E2E-03: Staff hace check-in con QR', () => {

    test('staff valida QR de reserva confirmada', async ({ request }) => {
        const BASE = 'http://localhost:8000';

        const userToken  = await getToken('user', BASE);
        const staffToken = await getToken('staff', BASE);

        // 1. Crear y confirmar una reserva como usuario
        const today = new Date().toISOString().split('T')[0];
        const slotsRes = await request.get(`${BASE}/api/v1/fields/2/slots?date=${today}`);
        const slotsData = await slotsRes.json() as { data: Array<{ id: number; state: string }> };
        const available = slotsData.data.filter((s) => s.state === 'available');

        test.skip(available.length === 0, 'No hay slots disponibles en campo 2');

        const slotId = available[0]!.id;

        const bookingRes = await request.post(`${BASE}/api/v1/bookings`, {
            headers: {
                Authorization: `Bearer ${userToken}`,
                'Content-Type': 'application/json',
                'Idempotency-Key': crypto.randomUUID(),
            },
            data: { venue_id: 1, field_id: 2, slot_ids: [slotId] },
        });
        const bookingData = await bookingRes.json() as { data: { id: number } };
        const bookingId = bookingData.data.id;

        // 2. Confirmar pago
        await request.post(`${BASE}/api/v1/test/confirm-booking/${bookingId}`);

        // 3. Obtener el QR token de la reserva
        const bookingsRes = await request.get(`${BASE}/api/v1/bookings`, {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        const bookingsData = await bookingsRes.json() as { data: Array<{ id: number; qrToken: string | null }> };
        const booking = bookingsData.data.find((b) => b.id === bookingId);
        const qrToken = booking?.qrToken;

        expect(qrToken).toBeTruthy();

        // 4. Staff abre turno
        const shiftRes = await request.post(`${BASE}/api/v1/staff/shifts`, {
            headers: {
                Authorization: `Bearer ${staffToken}`,
                'Content-Type': 'application/json',
            },
            data: { venue_id: 1 },
        });
        // 409 si ya hay un turno abierto (de otro test) — es válido
        expect([201, 409]).toContain(shiftRes.status());

        // 5. Staff valida el QR
        const checkInRes = await request.post(`${BASE}/api/v1/staff/check-in`, {
            headers: {
                Authorization: `Bearer ${staffToken}`,
                'Content-Type': 'application/json',
            },
            data: { qr_token: qrToken },
        });

        expect(checkInRes.ok()).toBeTruthy();
        const checkInData = await checkInRes.json() as { data: { status: string; balanceDue: string } };
        expect(checkInData.data.status).toBe('checked_in');
        expect(parseFloat(checkInData.data.balanceDue)).toBeGreaterThanOrEqual(0);
    });
});
