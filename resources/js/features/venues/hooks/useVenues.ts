import { useQuery } from '@tanstack/react-query';
import { searchVenues, getVenue } from '../api/venuesApi';
import type { VenueSearchParams } from '../types';

export function useVenueSearch(params: VenueSearchParams) {
    return useQuery({
        queryKey: ['venues', 'search', params],
        queryFn: () => searchVenues(params),
        staleTime: 60_000,
        enabled: true, // siempre busca — Lima es el default si no hay geolocalización
    });
}

export function useVenue(id: string | undefined) {
    return useQuery({
        queryKey: ['venues', id],
        queryFn: () => getVenue(id!),
        staleTime: 120_000,
        enabled: !!id,
    });
}
