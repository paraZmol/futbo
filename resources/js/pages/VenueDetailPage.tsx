import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useVenue } from '@/features/venues/hooks/useVenues';
import { useSlots } from '@/features/bookings/hooks/useSlots';
import { SlotGrid } from '@/features/bookings/components/SlotGrid';
import { getVenueFields } from '@/features/venues/api/venuesApi';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { formatMoney } from '@/shared/lib/money';
import { Skeleton, SlotGridSkeleton } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';
import type { Slot } from '@/features/bookings/types';
import type { Field } from '@/features/venues/types';

const PLACEHOLDER_PHOTOS = [
    'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80',
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&q=80',
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400&q=80',
    'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=400&q=80',
];

const MAX_SLOTS = 4;

function todayISO(): string {
    return new Date().toISOString().split('T')[0] as string;
}

function StarRating({ rating }: { rating: number }) {
    return (
        <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm font-semibold text-gray-900">{rating.toFixed(1)}</span>
        </span>
    );
}

function AmenityBadge({ label }: { label: string }) {
    const icons: Record<string, string> = {
        estacionamiento: '🚗',
        parking: '🚗',
        vestuarios: '👕',
        duchas: '🚿',
        cafeteria: '☕',
        wifi: '📶',
        iluminacion: '💡',
        tribuna: '🪑',
        bar: '🍺',
        tienda: '🛒',
    };
    const key = label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const icon = Object.entries(icons).find(([k]) => key.includes(k))?.[1] ?? '✓';

    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
            <span aria-hidden="true">{icon}</span>
            {label}
        </span>
    );
}

function FieldChip({ field }: { field: Field }) {
    const sportColors: Record<string, string> = {
        futbol: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        fútbol: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        tenis: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
        padel: 'bg-blue-50 text-blue-700 border border-blue-200',
        pádel: 'bg-blue-50 text-blue-700 border border-blue-200',
        basquet: 'bg-orange-50 text-orange-700 border border-orange-200',
        básquet: 'bg-orange-50 text-orange-700 border border-orange-200',
        voley: 'bg-purple-50 text-purple-700 border border-purple-200',
    };

    const sportKey = field.sport.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const colorClass = Object.entries(sportColors).find(([k]) => sportKey.includes(k))?.[1]
        ?? 'bg-gray-50 text-gray-700 border border-gray-200';

    return (
        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all">
            <div>
                <p className="font-semibold text-gray-900 text-sm">{field.name}</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
                        {field.sport}
                    </span>
                    <span className="text-xs text-gray-500">{field.surface}</span>
                    {field.isIndoor && (
                        <span className="text-xs text-gray-500 flex items-center gap-0.5">
                            <span aria-hidden="true">🏠</span> Indoor
                        </span>
                    )}
                </div>
            </div>
            <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </div>
    );
}

function PhotoGallery({ photos }: { photos: string[] }) {
    const images = photos.length > 0 ? photos : PLACEHOLDER_PHOTOS;
    const [main, ...rest] = images;
    const grid = rest.slice(0, 3);

    // Pad to 3 if fewer
    while (grid.length < 3) {
        grid.push(PLACEHOLDER_PHOTOS[grid.length] ?? PLACEHOLDER_PHOTOS[0] as string);
    }

    return (
        <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden aspect-[16/9]">
            {/* Foto principal — ocupa toda la columna izquierda */}
            <div className="row-span-2">
                <img
                    src={main}
                    alt="Foto principal de la cancha"
                    className="w-full h-full object-cover"
                    loading="eager"
                />
            </div>
            {/* 2 fotos pequeñas a la derecha en 2 filas */}
            <div className="grid grid-rows-2 gap-2 h-full">
                {grid.slice(0, 2).map((src, i) => (
                    <img
                        key={i}
                        src={src}
                        alt={`Foto ${i + 2} de la cancha`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ))}
            </div>
        </div>
    );
}

function MobilePhotoHeader({ photo }: { photo: string }) {
    return (
        <div className="aspect-[16/9] w-full overflow-hidden">
            <img
                src={photo}
                alt="Foto de la cancha"
                className="w-full h-full object-cover"
                loading="eager"
            />
        </div>
    );
}

export default function VenueDetailPage() {
    const { venueId } = useParams<{ venueId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const isAuthenticated = useAuth((s) => s.isAuthenticated);

    const [date, setDate] = useState<string>(todayISO());
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const { data: venue, isLoading: venueLoading, isError: venueError } = useVenue(venueId);

    const { data: fields = [], isLoading: fieldsLoading } = useQuery({
        queryKey: ['venue-fields', venueId],
        queryFn: () => getVenueFields(venueId!),
        staleTime: 120_000,
        enabled: !!venueId,
    });

    const firstField: Field | undefined = fields[0];
    const fieldId = firstField?.id;

    const { data: slots = [], isLoading: slotsLoading, isError: slotsError, refetch: refetchSlots } = useSlots(fieldId, date);

    function handleToggle(slotId: number) {
        setSelectedIds((prev) => {
            if (prev.includes(slotId)) return prev.filter((id) => id !== slotId);

            const allSelected = [...prev, slotId].sort((a, b) => a - b);
            const sortedSlots = slots
                .filter((s) => allSelected.includes(s.id))
                .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

            for (let i = 1; i < sortedSlots.length; i++) {
                const prevEnd = new Date(sortedSlots[i - 1]!.endsAt).getTime();
                const currStart = new Date(sortedSlots[i]!.startsAt).getTime();
                if (prevEnd !== currStart) return prev;
            }

            if (prev.length >= MAX_SLOTS) return prev;
            return [...prev, slotId];
        });
    }

    const selectedSlots: Slot[] = slots.filter((s) => selectedIds.includes(s.id));
    const currency = selectedSlots[0]?.currency ?? 'PEN';

    const totalAmount = selectedSlots.reduce((sum, s) => sum + parseFloat(s.unitPrice), 0);
    const depositAmount = selectedSlots.reduce((sum, s) => sum + parseFloat(s.depositAmount), 0);
    const balanceAmount = totalAmount - depositAmount;

    function formatTime(iso: string): string {
        return new Date(iso).toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'UTC',
        });
    }

    function handleReservar() {
        if (!isAuthenticated) {
            const redirect = encodeURIComponent(location.pathname + location.search);
            navigate(`/login?redirect=${redirect}`);
            return;
        }
        if (!venueId || !fieldId || selectedIds.length === 0) return;
        const params = new URLSearchParams({
            venueId,
            fieldId: String(fieldId),
            slotIds: selectedIds.join(','),
        });
        navigate(`/checkout?${params.toString()}`);
    }

    const mainPhoto = (venue?.photos?.[0] ?? PLACEHOLDER_PHOTOS[0]) as string;
    const hasSelection = selectedIds.length > 0;

    // ── Loading states ────────────────────────────────────────────

    if (venueLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
                    <Skeleton className="h-[380px] w-full rounded-2xl" />
                    <Skeleton className="h-8 w-2/3 rounded-xl" />
                    <Skeleton className="h-4 w-1/3 rounded-lg" />
                </div>
            </div>
        );
    }

    if (venueError || !venue) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <ErrorState onRetry={() => window.location.reload()} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-28 md:pb-12">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">

                {/* ── Mobile: foto full-width ── */}
                <div className="md:hidden -mx-4 mb-4">
                    <MobilePhotoHeader photo={mainPhoto} />
                </div>

                {/* ── Desktop: galería ── */}
                <div className="hidden md:block mb-6">
                    <PhotoGallery photos={venue.photos ?? []} />
                </div>

                {/* ── Layout dos columnas (desktop) ── */}
                <div className="flex flex-col md:flex-row gap-8">

                    {/* ══════════════════════════════════════════
                        COLUMNA IZQUIERDA — 65%
                    ══════════════════════════════════════════ */}
                    <div className="flex-1 min-w-0 space-y-8">

                        {/* Info del venue */}
                        <div>
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <h1 className="text-3xl font-bold text-gray-900 leading-tight">{venue.name}</h1>
                                {venue.rating != null && <StarRating rating={venue.rating} />}
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                <span aria-hidden="true">📍</span>
                                <span>{venue.address}</span>
                                <span className="text-gray-300">•</span>
                                <span>{venue.city}</span>
                                {venue.reviewCount != null && (
                                    <>
                                        <span className="text-gray-300">•</span>
                                        <span>{venue.reviewCount} reseñas</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Servicios / Amenities */}
                        {venue.amenities.length > 0 && (
                            <section aria-labelledby="amenities-heading">
                                <h2 id="amenities-heading" className="text-lg font-bold text-gray-900 mb-3">
                                    Servicios
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {venue.amenities.map((a) => (
                                        <AmenityBadge key={a} label={a} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Canchas disponibles */}
                        <section aria-labelledby="fields-heading">
                            <h2 id="fields-heading" className="text-lg font-bold text-gray-900 mb-3">
                                Canchas disponibles
                            </h2>
                            {fieldsLoading ? (
                                <div className="space-y-2">
                                    {[1, 2].map((i) => (
                                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                                    ))}
                                </div>
                            ) : fields.length === 0 ? (
                                <p className="text-sm text-gray-500 py-4">No hay canchas registradas en este complejo.</p>
                            ) : (
                                <div className="space-y-2">
                                    {fields.map((field) => (
                                        <FieldChip key={field.id} field={field} />
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Selector de fecha */}
                        <section aria-labelledby="date-heading">
                            <h2 id="date-heading" className="text-lg font-bold text-gray-900 mb-3">
                                Selecciona una fecha
                            </h2>
                            <input
                                type="date"
                                value={date}
                                min={todayISO()}
                                onChange={(e) => {
                                    setDate(e.target.value);
                                    setSelectedIds([]);
                                }}
                                className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 bg-white hover:border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-colors cursor-pointer"
                            />
                        </section>

                        {/* SlotGrid */}
                        <section aria-labelledby="slots-heading">
                            <h2 id="slots-heading" className="text-lg font-bold text-gray-900 mb-3">
                                Horarios disponibles
                                {firstField && (
                                    <span className="ml-2 text-sm font-normal text-gray-500">
                                        — {firstField.name}
                                    </span>
                                )}
                            </h2>

                            {!fieldId ? (
                                <p className="text-sm text-gray-500 py-4">Selecciona una cancha para ver horarios.</p>
                            ) : slotsLoading ? (
                                <SlotGridSkeleton />
                            ) : slotsError ? (
                                <ErrorState onRetry={() => void refetchSlots()} />
                            ) : (
                                <SlotGrid
                                    slots={slots}
                                    selectedIds={selectedIds}
                                    onToggle={handleToggle}
                                />
                            )}
                        </section>

                    </div>

                    {/* ══════════════════════════════════════════
                        COLUMNA DERECHA — 35% (sticky, desktop)
                    ══════════════════════════════════════════ */}
                    <aside className="hidden md:block w-full md:w-[380px] shrink-0">
                        <div className="sticky top-24">
                            <BookingCard
                                venueName={venue.name}
                                minPrice={venue.minPrice}
                                currency={venue.currency}
                                selectedSlots={selectedSlots}
                                depositAmount={depositAmount}
                                balanceAmount={balanceAmount}
                                totalAmount={totalAmount}
                                onReservar={handleReservar}
                                formatTime={formatTime}
                            />
                        </div>
                    </aside>

                </div>
            </div>

            {/* ── Mobile: sticky bottom bar ── */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-4px_16px_rgb(0,0,0,0.08)] px-4 py-3">
                {hasSelection ? (
                    <div>
                        <div className="flex items-center justify-between mb-2 text-sm">
                            <span className="text-gray-600">
                                {selectedSlots.length} hora{selectedSlots.length !== 1 ? 's' : ''} ·{' '}
                                <span className="text-gray-900 font-semibold">
                                    {formatMoney(String(totalAmount), currency)}
                                </span>
                            </span>
                            <span className="text-gray-500">
                                Anticipo:{' '}
                                <span className="font-semibold text-emerald-700">
                                    {formatMoney(String(depositAmount), currency)}
                                </span>
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleReservar}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-xl text-base transition-all shadow-sm"
                        >
                            Reservar — {formatMoney(String(depositAmount), currency)}
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">Desde</p>
                            <p className="text-lg font-bold text-gray-900">
                                {formatMoney(venue.minPrice, venue.currency)}
                                <span className="text-sm font-normal text-gray-500"> /hora</span>
                            </p>
                        </div>
                        <p className="text-sm text-gray-400">Selecciona un horario</p>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────
   Sub-componente: BookingCard (columna derecha desktop)
───────────────────────────────────────────────────── */

type BookingCardProps = {
    venueName: string;
    minPrice: string;
    currency: string;
    selectedSlots: Slot[];
    depositAmount: number;
    balanceAmount: number;
    totalAmount: number;
    onReservar: () => void;
    formatTime: (iso: string) => string;
};

function BookingCard({
    venueName,
    minPrice,
    currency,
    selectedSlots,
    depositAmount,
    balanceAmount,
    totalAmount,
    onReservar,
    formatTime,
}: BookingCardProps) {
    const hasSelection = selectedSlots.length > 0;

    return (
        <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
            {/* Header */}
            <div className="mb-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Complejo</p>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">{venueName}</h3>
            </div>

            {hasSelection ? (
                <>
                    {/* Slots seleccionados */}
                    <div className="mb-5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Horarios seleccionados
                        </p>
                        <div className="space-y-1.5">
                            {selectedSlots.map((slot) => (
                                <div key={slot.id} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-700 font-medium">
                                        {formatTime(slot.startsAt)} – {formatTime(slot.endsAt)}
                                    </span>
                                    <span className="text-gray-900 font-semibold">
                                        {formatMoney(slot.unitPrice, slot.currency)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Desglose de pago */}
                    <div className="border-t border-gray-100 pt-4 mb-5 space-y-2.5">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Anticipo ahora (30%)</span>
                            <span className="font-bold text-emerald-700">
                                {formatMoney(String(depositAmount), currency)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Saldo en cancha (70%)</span>
                            <span className="font-semibold text-gray-700">
                                {formatMoney(String(balanceAmount), currency)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-2.5 mt-2.5">
                            <span className="font-bold text-gray-900">Total</span>
                            <span className="font-bold text-gray-900 text-base">
                                {formatMoney(String(totalAmount), currency)}
                            </span>
                        </div>
                    </div>

                    {/* CTA */}
                    <button
                        type="button"
                        onClick={onReservar}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-xl text-base transition-all shadow-md"
                    >
                        Reservar — {formatMoney(String(depositAmount), currency)}
                    </button>

                    <p className="mt-3 text-center text-xs text-gray-400">
                        Sin tarifa de servicio · Pago seguro
                    </p>
                </>
            ) : (
                <>
                    {/* Estado vacío */}
                    <div className="text-center py-6">
                        <span className="text-4xl" aria-hidden="true">📅</span>
                        <p className="mt-3 text-sm text-gray-600 font-medium">
                            Selecciona fecha y horario
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            para ver el precio total
                        </p>
                    </div>

                    <div className="border-t border-gray-100 pt-4 mt-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Desde</span>
                            <span className="font-bold text-gray-900 text-base">
                                {formatMoney(minPrice, currency)}
                                <span className="text-sm font-normal text-gray-500"> /hora</span>
                            </span>
                        </div>
                    </div>

                    <p className="mt-4 text-center text-xs text-gray-400">
                        Sin tarifa de servicio · Pago seguro
                    </p>
                </>
            )}
        </div>
    );
}
