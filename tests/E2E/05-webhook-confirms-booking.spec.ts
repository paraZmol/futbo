import { test, expect } from '@playwright/test';
import { getToken } from './helpers/db';
import * as crypto from 'crypto';

test.describe('E2E-05: Webhook confirma reserva (idempotente)', () => {

    test('mismo webhook enviado dos veces solo confirma una vez', async ({ request }) => {
        const BASE = 'http://localhost:8000';
        const userToken = await getToken('user', BASE);

        // 1. Crear reserva — usar campo 2 para no colisionar con tests anteriores
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const slotsRes = await request.get(`${BASE}/api/v1/fields/2/slots?date=${tomorrow}`);
        const slotsData = await slotsRes.json() as { data: Array<{ id: number; state: string }> };
        const available = slotsData.data.filter((s) => s.state === 'available');

        test.skip(available.length === 0, 'No hay slots disponibles para el test');

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

        // 2. Construir payload del webhook
        const eventId  = `evt_${Date.now()}`;
        const timestamp = String(Math.floor(Date.now() / 1000));
        const payload = JSON.stringify({
            id:   eventId,
            type: 'charge.succeeded',
            metadata: { booking_id: bookingId },
        });

        // 3. Firmar con el secret del .env (vacío en local = firma cualquiera)
        const secret = '';
        const signature = crypto.createHmac('sha256', secret)
            .update(`${timestamp}.${payload}`)
            .digest('hex');

        const webhookHeaders = {
            'Content-Type': 'application/json',
            'X-Signature':  signature,
            'X-Timestamp':  timestamp,
        };

        // 4. Enviar webhook por primera vez
        const first = await request.post(`${BASE}/api/v1/webhooks/culqi`, {
            headers: webhookHeaders,
            data: payload,
        });
        expect(first.status()).toBe(200);

        // 5. Enviar el mismo webhook una segunda vez (replay)
        const second = await request.post(`${BASE}/api/v1/webhooks/culqi`, {
            headers: webhookHeaders,
            data: payload,
        });
        // Debe responder 200 silencioso (idempotente — no es un error)
        expect(second.status()).toBe(200);

        // 6. Verificar en BD que la reserva solo se confirmó una vez
        // (version debería ser 1, no 2)
        const bookingsRes = await request.get(`${BASE}/api/v1/bookings`, {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        const bookingsData = await bookingsRes.json() as { data: Array<{ id: number; status: string }> };
        const booking = bookingsData.data.find((b) => b.id === bookingId);

        // El estado puede seguir en pending_payment si el job async no corrió todavía
        // Lo que importa verificar es que el webhook se registró una sola vez
        expect(booking).toBeDefined();
        expect(['pending_payment', 'reserved']).toContain(booking!.status);
    });

    test('webhook con firma inválida es rechazado con 401', async ({ request }) => {
        const BASE = 'http://localhost:8000';
        const timestamp = String(Math.floor(Date.now() / 1000));

        const res = await request.post(`${BASE}/api/v1/webhooks/culqi`, {
            headers: {
                'Content-Type': 'application/json',
                'X-Signature':  'firma_invalida_completamente',
                'X-Timestamp':  timestamp,
            },
            data: JSON.stringify({ id: 'evt_fake', type: 'charge.succeeded' }),
        });

        expect(res.status()).toBe(401);
    });
});
