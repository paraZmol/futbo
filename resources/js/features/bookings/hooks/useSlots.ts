import { useQuery } from '@tanstack/react-query';
import { fetchSlots } from '../api/bookingsApi';

export function useSlots(fieldId: number | undefined, date: string | undefined) {
    return useQuery({
        queryKey: ['slots', fieldId, date],
        queryFn: () => fetchSlots(fieldId!, date!),
        staleTime: 30_000,
        enabled: !!(fieldId && date),
    });
}
