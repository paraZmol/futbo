import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useVenue } from '@/features/venues/hooks/useVenues';
import { useSlots } from '@/features/bookings/hooks/useSlots';
import { SlotGrid } from '@/features/bookings/components/SlotGrid';
import { getVenueFields } from '@/features/venues/api/venuesApi';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { formatMoney } from '@/shared/lib/money';
import { Skeleton } from '@/shared/components/Skeleton';
import type { Slot } from '@/features/bookings/types';
import type { Field } from '@/features/venues/types';

const TODAY = new Date().toISOString().split('T')[0] as string;
const MAX_SLOTS = 4;

const AMENITY_ICONS: Record<string, string> = {
    estacionamiento: '🚗', parking: '🚗', vestuarios: '👕',
    duchas: '🚿', cafeteria: '☕', wifi: '📶',
    iluminacion: '💡', tribuna: '🪑', instructor: '🎓',
};

function amenityIcon(label: string) {
    const key = label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return Object.entries(AMENITY_ICONS).find(([k]) => key.includes(k))?.[1] ?? '✓';
}

function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('es-PE', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
    });
}

/* ─── GALERÍA ESTILO AIRBNB ─────────────────────────────── */
const PH = [
    'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=900&q=85',
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=500&q=80',
    'https://images.unsplash.com/photo-1521731978332-9e9e714bdd20?w=500&q=80',
    'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=500&q=80',
];

function Gallery({ photos }: { photos: string[] }) {
    const imgs = photos.length >= 3 ? photos : [...photos, ...PH].slice(0, 4);
    return (
        <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden h-[420px]">
            <div className="row-span-2">
                <img src={imgs[0]} alt="Foto principal" className="w-full h-full object-cover" loading="eager" />
            </div>
            <div className="grid grid-rows-2 gap-2">
                <img src={imgs[1] ?? imgs[0]} alt="Foto 2" className="w-full h-full object-cover" loading="lazy" />
                <div className="relative">
                    <img src={imgs[2] ?? imgs[0]} alt="Foto 3" className="w-full h-full object-cover" loading="lazy" />
                    {photos.length > 4 && (
                        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">+{photos.length - 3} fotos</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── PANEL RESUMEN FINANCIERO (columna derecha desktop) ─── */
type SummaryProps = {
    venueName: string;
    fieldName?: string;
    selectedSlots: Slot[];
    onReservar: () => void;
    minPrice: string;
    currency: string;
};

function SummaryPanel({ venueName, fieldName, selectedSlots, onReservar, minPrice, currency }: SummaryProps) {
    const total   = selectedSlots.reduce((s, sl) => s + parseFloat(sl.unitPrice), 0);
    const deposit = selectedSlots.reduce((s, sl) => s + parseFloat(sl.depositAmount), 0);
    const balance = total - deposit;
    const has     = selectedSlots.length > 0;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Complejo</p>
            <h3 className="font-extrabold text-slate-900 text-lg leading-tight mb-0.5">{venueName}</h3>
            {fieldName && <p className="text-sm text-slate-500 mb-5">{fieldName}</p>}

            {has ? (
                <>
                    {/* Líneas de horario */}
                    <div className="space-y-2 mb-4">
                        {selectedSlots.map(sl => (
                            <div key={sl.id} className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {fmtTime(sl.startsAt)} – {fmtTime(sl.endsAt)}
                                </span>
                                <span className="font-semibold text-slate-900">{formatMoney(sl.unitPrice, sl.currency)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Desglose financiero */}
                    <div className="border-t border-slate-100 pt-4 space-y-2.5 mb-5">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Total ({selectedSlots.length} hora{selectedSlots.length !== 1 ? 's' : ''})</span>
                            <span className="font-bold text-slate-900">{formatMoney(String(total), currency)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-bold text-emerald-700">Pagas ahora (anticipo)</p>
                                <p className="text-xs text-slate-400">~30% del total</p>
                            </div>
                            <span className="text-xl font-extrabold text-emerald-600">{formatMoney(String(deposit), currency)}</span>
                        </div>
                        <div className="flex justify-between text-sm bg-slate-50 rounded-xl px-3 py-2.5">
                            <span className="text-slate-600 font-medium">Pendiente en cancha</span>
                            <span className="font-bold text-slate-900">{formatMoney(String(balance), currency)}</span>
                        </div>
                    </div>

                    <button type="button" onClick={onReservar}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-extrabold rounded-xl text-base transition-all shadow-md shadow-emerald-100">
                        Reservar — pagar {formatMoney(String(deposit), currency)}
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-3">Sin cargos extras · Pago seguro</p>
                </>
            ) : (
                <>
                    <div className="flex items-center justify-center flex-col py-6 text-center">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="font-semibold text-slate-700 text-sm">Elige tu horario</p>
                        <p className="text-xs text-slate-400 mt-1">Selecciona uno o varios slots seguidos</p>
                    </div>
                    <div className="border-t border-slate-100 pt-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Desde</span>
                            <span className="font-extrabold text-slate-900 text-lg">
                                {formatMoney(minPrice, currency)}
                                <span className="text-xs font-normal text-slate-400"> /hora</span>
                            </span>
                        </div>
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-4">Sin cargos extras · Pago seguro</p>
                </>
            )}
        </div>
    );
}

/* ─── PÁGINA PRINCIPAL ───────────────────────────────────── */
export default function VenueDetailPage() {
    const { venueId } = useParams<{ venueId: string }>();
    const navigate    = useNavigate();
    const location    = useLocation();
    const isAuth      = useAuth(s => s.isAuthenticated);

    const searchParams   = new URLSearchParams(location.search);
    const initialDate    = searchParams.get('date') ?? TODAY;

    const [date,        setDate]        = useState(initialDate);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [fieldId,     setFieldId]     = useState<number | null>(null);

    const { data: venue, isLoading: venueLoading, isError: venueError } = useVenue(venueId);

    const { data: fields = [], isLoading: fieldsLoading } = useQuery<Field[]>({
        queryKey: ['venue-fields', venueId],
        queryFn:  () => getVenueFields(venueId!),
        staleTime: 120_000,
        enabled: !!venueId,
    });

    const activeFieldId = fieldId ?? fields[0]?.id;
    const activeField   = fields.find(f => f.id === activeFieldId) ?? fields[0];

    const { data: slots = [], isLoading: slotsLoading } = useSlots(activeFieldId, date);

    function changeField(fid: number) { setFieldId(fid); setSelectedIds([]); }
    function changeDate(d: string)    { setDate(d);      setSelectedIds([]); }

    function handleToggle(slotId: number) {
        setSelectedIds(prev => {
            if (prev.includes(slotId)) return prev.filter(id => id !== slotId);
            const next = [...prev, slotId].sort((a, b) => a - b);
            const ordered = slots
                .filter(s => next.includes(s.id))
                .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
            for (let i = 1; i < ordered.length; i++) {
                if (new Date(ordered[i - 1]!.endsAt).getTime() !== new Date(ordered[i]!.startsAt).getTime())
                    return prev; // no contiguos
            }
            if (prev.length >= MAX_SLOTS) return prev;
            return next;
        });
    }

    const selectedSlots = slots.filter(s => selectedIds.includes(s.id));
    const total   = selectedSlots.reduce((s, sl) => s + parseFloat(sl.unitPrice), 0);
    const deposit = selectedSlots.reduce((s, sl) => s + parseFloat(sl.depositAmount), 0);
    const balance = total - deposit;

    function handleReservar() {
        if (!isAuth) {
            navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
            return;
        }
        if (!venueId || !activeFieldId || selectedIds.length === 0) return;
        navigate(`/checkout?venueId=${venueId}&fieldId=${activeFieldId}&slotIds=${selectedIds.join(',')}`);
    }

    /* Loading */
    if (venueLoading) {
        return (
            <div className="min-h-screen bg-slate-50 max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
                <Skeleton className="h-[420px] w-full rounded-2xl" />
                <Skeleton className="h-8 w-2/3 rounded-xl" />
                <Skeleton className="h-4 w-1/3 rounded-lg" />
            </div>
        );
    }

    if (venueError || !venue) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-5xl mb-4">😕</p>
                    <p className="font-bold text-slate-900 mb-4">No encontramos este complejo</p>
                    <button type="button" onClick={() => navigate(-1)}
                        className="px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors">
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-32 md:pb-12">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">

                {/* Breadcrumb + volver */}
                <button type="button" onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-semibold mb-5 group transition-colors">
                    <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver a resultados
                </button>

                {/* Galería — solo desktop */}
                <div className="hidden md:block mb-7">
                    <Gallery photos={venue.photos ?? []} />
                </div>

                {/* Foto mobile */}
                <div className="md:hidden -mx-4 mb-5">
                    <div className="aspect-[16/9] overflow-hidden">
                        <img
                            src={venue.photos?.[0] ?? 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80'}
                            alt={venue.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Layout 2 columnas (desktop) / 1 columna (mobile) */}
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">

                    {/* ══ COLUMNA IZQUIERDA 65% ══════════════════════════ */}
                    <div className="flex-1 min-w-0 space-y-8">

                        {/* Header del venue */}
                        <div>
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-2">
                                        {venue.name}
                                    </h1>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
                                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span>{venue.address}</span>
                                        <span className="text-slate-300">·</span>
                                        <span>{venue.city}</span>
                                    </div>
                                </div>
                                {venue.rating != null && (
                                    <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full shrink-0">
                                        <svg className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span className="font-bold text-amber-700 text-sm">{venue.rating.toFixed(1)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Servicios */}
                        {venue.amenities?.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold text-slate-900 mb-3">Servicios</h2>
                                <div className="flex flex-wrap gap-2">
                                    {venue.amenities.map(a => (
                                        <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-full">
                                            <span aria-hidden="true">{amenityIcon(a)}</span>
                                            {a}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ── SELECTOR DE CANCHA + FECHA + SLOTS ── */}
                        <section>
                            <h2 className="text-xl font-extrabold text-slate-900 mb-4">Reservar cancha</h2>

                            {/* Tabs de cancha */}
                            {fieldsLoading ? (
                                <div className="flex gap-2 mb-5">
                                    {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-36 rounded-2xl" />)}
                                </div>
                            ) : fields.length > 0 && (
                                <div className="flex gap-2 flex-wrap mb-5">
                                    {fields.map(f => {
                                        const active = f.id === activeFieldId;
                                        return (
                                            <button key={f.id} type="button"
                                                onClick={() => changeField(f.id)}
                                                className={`flex flex-col items-start px-4 py-3 rounded-2xl border-2 text-left transition-all cursor-pointer hover:-translate-y-0.5 ${
                                                    active
                                                        ? 'border-emerald-500 bg-emerald-50 shadow-sm shadow-emerald-100'
                                                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                                                }`}>
                                                <span className={`font-bold text-sm leading-tight ${active ? 'text-emerald-800' : 'text-slate-900'}`}>
                                                    {f.name}
                                                </span>
                                                <span className={`text-xs mt-0.5 ${active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {f.sport} · {f.surface}{f.isIndoor ? ' · Techada' : ''}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Selector de fecha */}
                            <div className="flex items-center gap-3 mb-5">
                                <label className="text-sm font-bold text-slate-700 shrink-0">Fecha:</label>
                                <input
                                    type="date"
                                    value={date}
                                    min={TODAY}
                                    onChange={e => changeDate(e.target.value)}
                                    className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                                />
                            </div>

                            {/* Banner instrucción */}
                            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3.5 mb-5">
                                <span className="text-xl mt-0.5" aria-hidden="true">💡</span>
                                <div>
                                    <p className="text-sm font-bold text-emerald-800">Reserva varias horas seguidas</p>
                                    <p className="text-xs text-emerald-700 mt-0.5">
                                        Toca los horarios contiguos que necesitas. Hasta {MAX_SLOTS} horas por reserva.
                                    </p>
                                </div>
                            </div>

                            {/* Grid de slots */}
                            {slotsLoading ? (
                                <div className="space-y-3">
                                    {[1,2,3].map(i => (
                                        <div key={i} className="animate-pulse">
                                            <div className="h-3 bg-slate-200 rounded w-20 mb-2" />
                                            <div className="flex gap-2">
                                                {Array.from({length: 6}).map((_, j) => (
                                                    <div key={j} className="h-14 w-20 bg-slate-200 rounded-xl" />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : slots.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                                    <p className="text-4xl mb-3">🗓</p>
                                    <p className="font-semibold text-slate-700 mb-1">Sin horarios disponibles</p>
                                    <p className="text-sm text-slate-400">Prueba con otra fecha</p>
                                </div>
                            ) : (
                                <SlotGrid slots={slots} selectedIds={selectedIds} onToggle={handleToggle} />
                            )}

                            {/* Resumen selección inline */}
                            {selectedIds.length > 0 && (
                                <div className="mt-5 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="font-bold text-slate-900 text-sm">
                                            {selectedSlots.length} hora{selectedSlots.length !== 1 ? 's' : ''} seleccionada{selectedSlots.length !== 1 ? 's' : ''}
                                        </span>
                                        <button type="button" onClick={() => setSelectedIds([])}
                                            className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                                            Limpiar selección
                                        </button>
                                    </div>
                                    {selectedSlots.map(s => (
                                        <div key={s.id} className="flex justify-between text-xs text-slate-600 py-0.5">
                                            <span className="font-medium">{fmtTime(s.startsAt)} – {fmtTime(s.endsAt)}</span>
                                            <span>{formatMoney(s.unitPrice, s.currency)}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-slate-100 mt-2 pt-2 flex justify-between text-sm font-bold text-slate-900">
                                        <span>Total</span>
                                        <span>{formatMoney(String(total), selectedSlots[0]?.currency ?? 'PEN')}</span>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* ══ COLUMNA DERECHA 35% — sticky ═══════════════════ */}
                    <aside className="hidden lg:block w-[380px] shrink-0">
                        <div className="sticky top-[92px]">
                            <SummaryPanel
                                venueName={venue.name}
                                fieldName={activeField?.name}
                                selectedSlots={selectedSlots}
                                onReservar={handleReservar}
                                minPrice={venue.minPrice}
                                currency={venue.currency}
                            />
                        </div>
                    </aside>
                </div>
            </div>

            {/* ══ STICKY BOTTOM BAR — mobile ═══════════════════════════ */}
            <div className="lg:hidden fixed bottom-[60px] left-0 right-0 z-40 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgb(0,0,0,0.08)] px-4 py-3">
                {selectedIds.length > 0 ? (
                    <>
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-slate-500">
                                <span className="font-bold text-slate-900">{selectedSlots.length} hora{selectedSlots.length !== 1 ? 's' : ''}</span>
                                {' · '}Total: <span className="font-bold text-slate-900">{formatMoney(String(total), selectedSlots[0]?.currency ?? 'PEN')}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400">Anticipo ahora</p>
                                <p className="font-extrabold text-emerald-600 text-base leading-tight">{formatMoney(String(deposit), selectedSlots[0]?.currency ?? 'PEN')}</p>
                            </div>
                        </div>
                        <button type="button" onClick={handleReservar}
                            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-extrabold rounded-xl text-base transition-all shadow-lg shadow-emerald-100">
                            Reservar — pagar {formatMoney(String(deposit), selectedSlots[0]?.currency ?? 'PEN')}
                        </button>
                    </>
                ) : (
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400 mb-0.5">Desde</p>
                            <p className="text-xl font-extrabold text-slate-900">
                                {formatMoney(venue.minPrice, venue.currency)}
                                <span className="text-sm font-normal text-slate-400"> /hora</span>
                            </p>
                        </div>
                        <p className="text-sm text-slate-400 font-medium">← Elige tu horario</p>
                    </div>
                )}
            </div>
        </div>
    );
}
