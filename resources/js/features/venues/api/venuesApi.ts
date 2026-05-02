import { api } from '@/shared/lib/apiClient';
import type { PaginatedResponse } from '@/shared/types';
import type { Field, Venue, VenueSearchParams } from '../types';

export async function searchVenues(params: VenueSearchParams): Promise<PaginatedResponse<Venue>> {
    const res = await api.get<PaginatedResponse<Venue>>('/venues', { params });
    return res.data;
}

export async function getVenue(id: string): Promise<Venue> {
    const res = await api.get<{ data: Venue }>(`/venues/${id}`);
    return res.data.data;
}

export async function getVenueFields(venueId: string): Promise<Field[]> {
    const res = await api.get<{ data: Field[] }>(`/venues/${venueId}/fields`);
    return res.data.data;
}
