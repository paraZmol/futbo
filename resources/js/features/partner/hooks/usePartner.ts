import { useQuery } from '@tanstack/react-query';
import { fetchAnalytics, fetchDaySchedule, fetchMyVenues, fetchVenueBookings } from '../api/partnerApi';

export function useMyVenues() {
    return useQuery({
        queryKey: ['partner', 'venues'],
        queryFn: fetchMyVenues,
        staleTime: 300_000,
    });
}

export function useVenueBookings(venueId: number | null, date: string) {
    return useQuery({
        queryKey: ['partner', 'bookings', venueId, date],
        queryFn: () => fetchVenueBookings(venueId!, date),
        staleTime: 30_000,
        enabled: !!venueId,
    });
}

export function useDaySchedule(venueId: number | null, date: string) {
    return useQuery({
        queryKey: ['partner', 'schedule', venueId, date],
        queryFn: () => fetchDaySchedule(venueId!, date),
        staleTime: 30_000,
        enabled: !!venueId,
    });
}

export function useAnalytics(venueId: number | null, dateFrom: string, dateTo: string) {
    return useQuery({
        queryKey: ['partner', 'analytics', venueId, dateFrom, dateTo],
        queryFn: () => fetchAnalytics(venueId!, dateFrom, dateTo),
        staleTime: 300_000,
        enabled: !!venueId,
    });
}
