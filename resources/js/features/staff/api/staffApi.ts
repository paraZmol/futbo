import { api, newIdempotencyKey } from '@/shared/lib/apiClient';
import type { CheckInResult, DayBooking, Shift } from '../types';
import type { ApiResponse } from '@/shared/types';

export async function openShift(venueId: number): Promise<Shift> {
    const res = await api.post<ApiResponse<Shift>>('/staff/shifts', { venue_id: venueId });
    return res.data.data;
}

export async function closeShift(
    shiftId: number,
    cashDelivered: number,
    notes?: string,
): Promise<Shift> {
    const res = await api.post<ApiResponse<Shift>>(`/staff/shifts/${shiftId}/close`, {
        cash_delivered: cashDelivered,
        notes,
    });
    return res.data.data;
}

export async function validateQR(qrToken: string): Promise<CheckInResult> {
    const res = await api.post<ApiResponse<CheckInResult>>('/staff/check-in', { qr_token: qrToken });
    return res.data.data;
}

export async function markNoShow(bookingId: number): Promise<void> {
    await api.post(`/staff/bookings/${bookingId}/no-show`);
}

export async function createWalkIn(params: {
    venueId: number;
    fieldId: number;
    slotIds: number[];
}): Promise<{ id: number; publicId: string }> {
    const res = await api.post<ApiResponse<{ id: number; publicId: string }>>(
        '/staff/walk-ins',
        {
            venue_id: params.venueId,
            field_id: params.fieldId,
            slot_ids: params.slotIds,
        },
        { headers: { 'Idempotency-Key': newIdempotencyKey() } },
    );
    return res.data.data;
}

export async function fetchTodayBookings(venueId: number): Promise<DayBooking[]> {
    const res = await api.get<ApiResponse<DayBooking[]>>('/staff/bookings/today', {
        params: { venue_id: venueId },
    });
    return res.data.data;
}
