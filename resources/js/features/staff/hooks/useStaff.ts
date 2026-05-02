import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    closeShift,
    createWalkIn,
    fetchTodayBookings,
    markNoShow,
    openShift,
    validateQR,
} from '../api/staffApi';
import type { Shift } from '../types';

// Shift state persisted in localStorage so staff doesn't lose context on refresh
type ShiftStore = {
    activeShift: Shift | null;
    activeVenueId: number | null;
    setShift: (shift: Shift, venueId: number) => void;
    clearShift: () => void;
};

export const useShiftStore = create<ShiftStore>()(
    persist(
        (set) => ({
            activeShift: null,
            activeVenueId: null,
            setShift: (shift, venueId) => set({ activeShift: shift, activeVenueId: venueId }),
            clearShift: () => set({ activeShift: null, activeVenueId: null }),
        }),
        { name: 'staff-shift' },
    ),
);

export function useOpenShift() {
    const { setShift } = useShiftStore();
    return useMutation({
        mutationFn: (venueId: number) => openShift(venueId),
        onSuccess: (shift, venueId) => setShift(shift, venueId),
    });
}

export function useCloseShift() {
    const { clearShift } = useShiftStore();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ shiftId, cash, notes }: { shiftId: number; cash: number; notes?: string }) =>
            closeShift(shiftId, cash, notes),
        onSuccess: () => {
            clearShift();
            qc.invalidateQueries({ queryKey: ['staff', 'bookings'] });
        },
    });
}

export function useValidateQR() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (qrToken: string) => validateQR(qrToken),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['staff', 'bookings'] }),
    });
}

export function useMarkNoShow() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (bookingId: number) => markNoShow(bookingId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['staff', 'bookings'] }),
    });
}

export function useCreateWalkIn() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createWalkIn,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['staff', 'bookings'] }),
    });
}

export function useTodayBookings(venueId: number | null) {
    return useQuery({
        queryKey: ['staff', 'bookings', venueId],
        queryFn: () => fetchTodayBookings(venueId!),
        staleTime: 30_000,
        enabled: !!venueId,
        // Keep stale data visible when offline — staff needs to see the list
        placeholderData: (prev) => prev,
    });
}
