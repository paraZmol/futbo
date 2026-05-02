import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useVenueSearch } from '@/features/venues/hooks/useVenues';
import { formatMoney } from '@/shared/lib/money';

const SPORT_LABELS: Record<string, string> = {
    futbol5: 'Fútbol 5', futbol7: 'Fútbol 7', futbol11: 'Fútbol 11',
    padel: 'Pádel', basket: 'Basket', tenis: 'Tenis',
};

const FALLBACK_PHOTOS: Record<string, string> = {
    futbol5:  'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&q=80',
    futbol7:  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&q=80',
    padel:    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80',
    basket:   'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80',
    tenis:    'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&q=80',
    default:  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&q=80',
};

function CardSkeleton() {
    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm animate-pulse">
            <div className="aspect-[4/3] bg-slate-200" />
            <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
                <div className="h-3 bg-slate-200 rounded-lg w-1/2" />
                <div className="flex justify-between items-center pt-2">
                    <div className="h-5 bg-slate-200 rounded-lg w-20" />
                    <div className="h-9 bg-slate-200 rounded-xl w-28" />
                </div>
            </div>
        </div>
    );
}

export default function VenuesPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sport = searchParams.get('sport') ?? 'futbol5';
    const date  = searchParams.get('date')  ?? new Date().toISOString().split('T')[0]!;

    const [coords, setCoords] = useState({ lat: -12.0464, lng: -77.0428 });
    const [sort,   setSort]   = useState<'distancia' | 'precio'>('distancia');

    useEffect(() => {
        navigator.geolocation?.getCurrentPosition(
            p => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
            () => {},
            { timeout: 5000 },
        );
    }, []);

    const { data, isLoading, isError, refetch } = useVenueSearch({
        lat: coords.lat, lng: coords.lng, sport, date, radiusKm: 30,
    });

    const venues = (data?.data ?? []).slice().sort((a, b) =>
        sort === 'precio'
            ? parseFloat(a.minPrice) - parseFloat(b.minPrice)
            : (a.distanceM ?? 99999) - (b.distanceM ?? 99999)
    );

    const dateLabel = (() => {
        try {
            return new Date(date + 'T12:00:00').toLocaleDateString('es-PE', {
                weekday: 'short', day: 'numeric', month: 'short',
            });
        } catch { return date; }
    })();

    return (
        <div className="min-h-screen bg-slate-50 pb-20 md:pb-10">

            {/* Subheader sticky */}
            <div className="sticky top-0 md:top-[68px] z-30 bg-white border-b border-slate-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                        <button type="button" onClick={() => navigate(-1)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors shrink-0">
                            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-sm truncate">
                                {SPORT_LABELS[sport] ?? sport} · {dateLabel}
                            </p>
                            <p className="text-xs text-slate-400">
                                {isLoading
                                    ? 'Buscando...'
                                    : `${venues.length} complejo${venues.length !== 1 ? 's' : ''} encontrado${venues.length !== 1 ? 's' : ''}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {(['distancia', 'precio'] as const).map(s => (
                            <button key={s} type="button" onClick={() => setSort(s)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                                    sort === s
                                        ? 'bg-emerald-500 text-white border-emerald-500'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                }`}>
                                {s === 'distancia' ? '📍 Distancia' : '💲 Precio'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">

                {isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
                    </div>
                )}

                {isError && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="text-5xl mb-4">😕</div>
                        <h3 className="font-bold text-slate-900 text-lg mb-2">No pudimos cargar las canchas</h3>
                        <p className="text-slate-500 text-sm mb-6">Revisa tu conexión e intenta de nuevo.</p>
                        <button type="button" onClick={() => refetch()}
                            className="px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors">
                            Reintentar
                        </button>
                    </div>
                )}

                {!isLoading && !isError && venues.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="text-5xl mb-4">🔍</div>
                        <h3 className="font-bold text-slate-900 text-lg mb-2">Sin resultados</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            No encontramos canchas de {SPORT_LABELS[sport]} para esa fecha.
                        </p>
                        <button type="button" onClick={() => navigate('/')}
                            className="px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors">
                            Cambiar búsqueda
                        </button>
                    </div>
                )}

                {!isLoading && !isError && venues.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {venues.map(venue => {
                            const photo = venue.photos[0] ?? FALLBACK_PHOTOS[sport] ?? FALLBACK_PHOTOS.default;
                            const dist = venue.distanceM !== undefined
                                ? venue.distanceM < 1000
                                    ? `${Math.round(venue.distanceM)} m`
                                    : `${(venue.distanceM / 1000).toFixed(1)} km`
                                : null;

                            return (
                                <article key={venue.id}
                                    className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                                    onClick={() => navigate(`/venues/${venue.id}?date=${date}`)}>

                                    {/* Foto */}
                                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                                        <img src={photo} alt={`Foto de ${venue.name}`} loading="lazy"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        {venue.nextAvailableSlot && (
                                            <span className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                                                Libre hoy
                                            </span>
                                        )}
                                        {dist && (
                                            <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                                                📍 {dist}
                                            </span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className="font-bold text-slate-900 text-base leading-tight line-clamp-1">
                                                {venue.name}
                                            </h3>
                                            {venue.rating !== undefined && (
                                                <div className="flex items-center gap-1 shrink-0 text-sm">
                                                    <svg className="w-3.5 h-3.5 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                    <span className="font-semibold text-slate-700">{venue.rating.toFixed(1)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 mb-3 line-clamp-1">{venue.city}</p>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-xs text-slate-400">desde </span>
                                                <span className="text-lg font-extrabold text-slate-900">
                                                    {formatMoney(venue.minPrice, venue.currency)}
                                                </span>
                                                <span className="text-xs text-slate-400">/hr</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={e => { e.stopPropagation(); navigate(`/venues/${venue.id}?date=${date}`); }}
                                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-emerald-100">
                                                Ver horarios
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
