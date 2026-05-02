import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { VenueCard } from '@/features/venues/components/VenueCard';
import { useVenueSearch } from '@/features/venues/hooks/useVenues';
import { VenueCardSkeleton } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';

export default function VenuesPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sport = searchParams.get('sport') ?? 'futbol5';
    const date  = searchParams.get('date') ?? new Date().toISOString().split('T')[0];

    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        navigator.geolocation?.getCurrentPosition(
            (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => setCoords({ lat: -12.0464, lng: -77.0428 }), // Lima default
        );
    }, []);

    const { data, isLoading, isError, refetch } = useVenueSearch({
        lat: coords?.lat,
        lng: coords?.lng,
        sport,
        date,
        radiusKm: 10,
    });

    const venues = data?.data ?? [];

    return (
        <main className="min-h-screen bg-[var(--gray-page)] px-4 pb-24">
            <header className="sticky top-0 bg-[var(--gray-page)] py-4 z-10">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="text-[var(--navy-mid)] text-sm font-medium"
                    aria-label="Volver"
                >
                    ← Volver
                </button>
                <p className="text-sm text-[var(--gray-secondary)] mt-1">
                    {isLoading ? 'Buscando...' : `${venues.length} canchas encontradas`}
                </p>
            </header>

            {isLoading && (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => <VenueCardSkeleton key={i} />)}
                </div>
            )}

            {isError && <ErrorState onRetry={() => refetch()} />}

            {!isLoading && !isError && venues.length === 0 && (
                <ErrorState message="No encontramos canchas cerca. Intenta con otra fecha." />
            )}

            {!isLoading && !isError && (
                <div className="space-y-4">
                    {venues.map((venue) => (
                        <VenueCard
                            key={venue.id}
                            venue={venue}
                            onSelect={(id) => navigate(`/venues/${id}?date=${date}`)}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}
