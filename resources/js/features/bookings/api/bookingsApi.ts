import { api, newIdempotencyKey } from '@/shared/lib/apiClient';
import type { Booking, CreateBookingInput, Slot } from '../types';
import type { ApiResponse } from '@/shared/types';

export async function fetchSlots(fieldId: number, date: string): Promise<Slot[]> {
    const res = await api.get<ApiResponse<Slot[]>>(`/fields/${fieldId}/slots`, { params: { date } });
    return res.data.data;
}

export async function fetchMyBookings(): Promise<Booking[]> {
    const res = await api.get<ApiResponse<Booking[]>>('/bookings');
    return res.data.data;
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
    const res = await api.post<ApiResponse<Booking>>(
        '/bookings',
        input,
        { headers: { 'Idempotency-Key': newIdempotencyKey() } },
    );
    return res.data.data;
}

export async function cancelBooking(id: number, reason: string): Promise<void> {
    await api.post(`/bookings/${id}/cancel`, { reason });
}
