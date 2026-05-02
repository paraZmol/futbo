import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { VenueCard } from '@/features/venues/components/VenueCard';
import { useVenueSearch } from '@/features/venues/hooks/useVenues';
import { ErrorState } from '@/shared/components/ErrorState';

function VenueCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
            <div className="aspect-[4/3] bg-gray-200" />
            <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="flex justify-between items-center pt-1">
                    <div className="h-5 bg-gray-200 rounded w-24" />
                    <div className="h-9 bg-gray-200 rounded-xl w-28" />
                </div>
            </div>
        </div>
    );
}

const SPORT_LABELS: Record<string, string> = {
    futbol5: 'Fútbol 5', futbol7: 'Fútbol 7', futbol11: 'Fútbol 11',
    padel: 'Pádel', basket: 'Basket', tenis: 'Tenis',
};

export default function VenuesPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sport = searchParams.get('sport') ?? 'futbol5';
    const date  = searchParams.get('date') ?? new Date().toISOString().split('T')[0]!;

    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        navigator.geolocation?.getCurrentPosition(
            (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => setCoords({ lat: -12.0464, lng: -77.0428 }),
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
    const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString('es-PE', {
        weekday: 'short', day: 'numeric', month: 'short',
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">

            {/* Subheader sticky */}
            <div className="sticky top-0 md:top-16 z-20 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => navigate(-1)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <p className="text-sm font-bold text-gray-900">
                                {SPORT_LABELS[sport] ?? sport} · {dateFormatted}
                            </p>
                            <p className="text-xs text-gray-400">
                                {isLoading ? 'Buscando...' : `${venues.length} complejo${venues.length !== 1 ? 's' : ''} encontrado${venues.length !== 1 ? 's' : ''}`}
                            </p>
                        </div>
                    </div>

                    {/* Filtros rápidos desktop */}
                    <div className="hidden md:flex items-center gap-2">
                        {['Precio', 'Distancia', 'Disponible ahora'].map((f) => (
                            <button key={f} type="button"
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-full hover:border-gray-300 transition-colors">
                                {f} ↕
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">

                {/* Grid responsivo */}
                {isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {Array.from({ length: 8 }).map((_, i) => <VenueCardSkeleton key={i} />)}
                    </div>
                )}

                {isError && (
                    <ErrorState
                        message="No pudimos cargar las canchas. Revisa tu conexión."
                        onRetry={() => refetch()}
                    />
                )}

                {!isLoading && !isError && venues.length === 0 && (
                    <div className="text-center py-20">
                        <div className="text-5xl mb-4">🔍</div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Sin resultados</h3>
                        <p className="text-gray-500 mb-6">No encontramos canchas para esa fecha. Prueba con otra.</p>
                        <button type="button" onClick={() => navigate('/')}
                            className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
                            Cambiar búsqueda
                        </button>
                    </div>
                )}

                {!isLoading && !isError && venues.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {venues.map((venue) => (
                            <VenueCard
                                key={venue.id}
                                venue={venue}
                                onSelect={(id) => navigate(`/venues/${id}?date=${date}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
