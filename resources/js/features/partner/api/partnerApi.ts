import { api } from '@/shared/lib/apiClient';
import type { Analytics, DayScheduleSlot, PartnerBooking, PartnerVenue } from '../types';
import type { ApiResponse } from '@/shared/types';

export async function fetchMyVenues(): Promise<PartnerVenue[]> {
    const res = await api.get<ApiResponse<PartnerVenue[]>>('/partner/venues');
    return res.data.data;
}

export async function fetchVenueBookings(venueId: number, date: string): Promise<PartnerBooking[]> {
    const res = await api.get<ApiResponse<PartnerBooking[]>>(
        `/partner/venues/${venueId}/bookings`,
        { params: { date } }
    );
    return res.data.data;
}

export async function fetchDaySchedule(venueId: number, date: string): Promise<DayScheduleSlot[]> {
    const res = await api.get<ApiResponse<DayScheduleSlot[]>>(
        `/partner/venues/${venueId}/schedule`,
        { params: { date } }
    );
    return res.data.data;
}

export async function fetchAnalytics(venueId: number, dateFrom: string, dateTo: string): Promise<Analytics> {
    const res = await api.get<ApiResponse<Analytics>>(
        `/partner/venues/${venueId}/analytics`,
        { params: { date_from: dateFrom, date_to: dateTo } }
    );
    return res.data.data;
}
