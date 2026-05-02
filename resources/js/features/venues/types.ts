export type Venue = {
    id: string;
    name: string;
    address: string;
    city: string;
    lat: number;
    lng: number;
    distanceM?: number;
    minPrice: string;
    currency: string;
    nextAvailableSlot?: string;
    rating?: number;
    reviewCount?: number;
    photos: string[];
    amenities: string[];
    status: 'active' | 'pending' | 'suspended';
};

export type Field = {
    id: number;
    publicId: string;
    name: string;
    sport: string;
    surface: string;
    isIndoor: boolean;
};

export type VenueSearchParams = {
    lat?: number;
    lng?: number;
    sport?: string;
    date?: string;
    radiusKm?: number;
    page?: number;
};
