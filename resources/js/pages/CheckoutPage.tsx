import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCreateBooking } from '@/features/bookings/hooks/useBookings';
import { useSlots } from '@/features/bookings/hooks/useSlots';
import { ApiError } from '@/shared/lib/apiClient';
import { formatMoney } from '@/shared/lib/money';
import { useAuth } from '@/features/auth/hooks/useAuth';

const ERRORS: Record<string, string> = {
    SLOT_NOT_AVAILABLE:      'Ese horario fue tomado justo ahora. Elige otro.',
    IDEMPOTENCY_KEY_MISSING: 'Error de configuración. Intenta de nuevo.',
};

const TTL = 600;

export default function CheckoutPage() {
    const [params]   = useSearchParams();
    const navigate   = useNavigate();
    const { isAuthenticated } = useAuth();

    const venueId = params.get('venueId') ?? '';
    const fieldId = params.get('fieldId') ? Number(params.get('fieldId')) : undefined;
    const slotIds = (params.get('slotIds') ?? '').split(',').map(Number).filter(Boolean);

    // Obtener fecha del primer slot para pasarlo a useSlots
    const today = new Date().toISOString().split('T')[0]!;
    const { data: slots = [] } = useSlots(fieldId, today);
    const selected = slots.filter(s => slotIds.includes(s.id));

    const [error, setError] = useState<string | null>(null);
    const [ttl,   setTtl]   = useState(TTL);
    const create = useCreateBooking();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        const iv = setInterval(() => setTtl(t => Math.max(0, t - 1)), 1000);
        return () => clearInterval(iv);
    }, []);

    const total   = selected.reduce((s, sl) => s + parseFloat(sl.unitPrice),     0);
    const deposit = selected.reduce((s, sl) => s + parseFloat(sl.depositAmount), 0);
    const balance = total - deposit;
    const currency = selected[0]?.currency ?? 'PEN';

    const mins = Math.floor(ttl / 60);
    const secs = ttl % 60;

    function fmtTime(iso: string) {
        return new Date(iso).toLocaleTimeString('es-PE', {
            hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
        });
    }

    async function handleConfirm() {
        if (!venueId || !fieldId || slotIds.length === 0) return;
        setError(null);
        try {
            const booking = await create.mutateAsync({
                venueId: Number(venueId) || 1,
                fieldId,
                slotIds,
            });
            navigate(`/bookings/${booking.id}/confirmation`);
        } catch (e) {
            setError(e instanceof ApiError ? (ERRORS[e.code] ?? 'No se pudo procesar. Intenta de nuevo.') : 'Error inesperado.');
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-10">
            <div className="max-w-lg mx-auto px-4 py-8">

                {/* Volver */}
                <button type="button" onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-semibold mb-6 transition-colors group">
                    <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver
                </button>

                <h1 className="text-2xl font-extrabold text-slate-900 mb-6">Confirmar reserva</h1>

                <div className="space-y-4">
                    {/* Resumen de horarios */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Horarios seleccionados</h2>
                        {selected.length === 0 ? (
                            <p className="text-slate-500 text-sm">Cargando...</p>
                        ) : (
                            <div className="space-y-2">
                                {selected.map(sl => (
                                    <div key={sl.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="font-bold text-slate-900 text-sm">
                                                {fmtTime(sl.startsAt)} – {fmtTime(sl.endsAt)}
                                            </span>
                                        </div>
                                        <span className="font-semibold text-slate-700 text-sm">
                                            {formatMoney(sl.unitPrice, sl.currency)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Desglose financiero — siempre visible */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Resumen de pago</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Total reserva</span>
                                <span className="font-bold text-slate-900">{formatMoney(String(total), currency)}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 px-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                <div>
                                    <p className="font-extrabold text-emerald-800 text-sm">Pagas ahora (anticipo)</p>
                                    <p className="text-xs text-emerald-600 mt-0.5">Reserva garantizada al pagar</p>
                                </div>
                                <span className="text-xl font-extrabold text-emerald-700">{formatMoney(String(deposit), currency)}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 px-4 bg-slate-50 rounded-xl">
                                <div>
                                    <p className="font-semibold text-slate-700 text-sm">Pendiente en cancha</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Lo pagas al llegar</p>
                                </div>
                                <span className="text-base font-bold text-slate-900">{formatMoney(String(balance), currency)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Contador TTL */}
                    {ttl < 300 && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                            <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-amber-800 font-medium">
                                Tu reserva se libera en{' '}
                                <span className="font-extrabold text-amber-900">
                                    {mins}:{String(secs).padStart(2, '0')}
                                </span>
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                            <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    {/* CTA */}
                    <button
                        type="button"
                        disabled={create.isPending || selected.length === 0}
                        onClick={handleConfirm}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-white font-extrabold rounded-2xl text-base transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                    >
                        {create.isPending ? (
                            <>
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Procesando...
                            </>
                        ) : (
                            `Confirmar y pagar ${formatMoney(String(deposit), currency)}`
                        )}
                    </button>

                    <p className="text-center text-xs text-slate-400">
                        Al confirmar aceptas los términos de uso · Pago 100% seguro
                    </p>
                </div>
            </div>
        </div>
    );
}
