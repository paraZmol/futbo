import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancelBooking, createBooking, fetchMyBookings } from '../api/bookingsApi';
import type { CreateBookingInput } from '../types';

export function useMyBookings() {
    return useQuery({
        queryKey: ['bookings', 'mine'],
        queryFn: fetchMyBookings,
        staleTime: 30_000,
    });
}

export function useCreateBooking() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateBookingInput) => createBooking(input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['bookings'] });
            qc.invalidateQueries({ queryKey: ['slots'] });
        },
    });
}

export function useCancelBooking() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: number; reason: string }) => cancelBooking(id, reason),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['bookings'] });
        },
    });
}
