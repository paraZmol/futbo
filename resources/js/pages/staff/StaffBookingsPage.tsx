import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarkNoShow, useShiftStore, useTodayBookings } from '@/features/staff/hooks/useStaff';
import { Skeleton } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';
import { formatMoney } from '@/shared/lib/money';

const STATUS_LABELS: Record<string, string> = {
    pending_payment: 'Pendiente pago',
    reserved:        'Reservado',
    checked_in:      'Ingresado',
    completed:       'Completado',
    no_show:         'No show',
    cancelled:       'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
    pending_payment: 'bg-yellow-100 text-yellow-800',
    reserved:        'bg-[var(--green-soft)] text-[var(--green-text)]',
    checked_in:      'bg-[var(--green-soft)] text-[var(--green-text)]',
    completed:       'bg-gray-100 text-gray-600',
    no_show:         'bg-red-100 text-red-700',
    cancelled:       'bg-red-100 text-red-700',
};

export default function StaffBookingsPage() {
    const navigate = useNavigate();
    const { activeVenueId } = useShiftStore();
    const { data: bookings = [], isLoading, isError, refetch } = useTodayBookings(activeVenueId);
    const noShow = useMarkNoShow();

    function handleNoShow(id: number) {
        if (confirm('¿Marcar como No-Show?')) {
            noShow.mutate(id);
        }
    }

    return (
        <main className="min-h-screen bg-[var(--gray-page)] px-4 pb-8">
            <header className="sticky top-0 bg-[var(--gray-page)] py-4 flex items-center gap-3">
                <button type="button" onClick={() => navigate('/staff')} className="text-[var(--navy-mid)] text-sm font-medium">
                    ← Volver
                </button>
                <h1 className="font-bold text-lg text-[var(--navy-deep)]">Reservas de hoy</h1>
            </header>

            {isLoading && (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                </div>
            )}

            {isError && <ErrorState onRetry={() => refetch()} />}

            {!isLoading && !isError && bookings.length === 0 && (
                <p className="text-center text-[var(--gray-secondary)] py-8">No hay reservas para hoy.</p>
            )}

            {!isLoading && !isError && (
                <div className="space-y-3">
                    {bookings.map((b) => {
                        const start = new Date(b.slotStartsAt).toLocaleTimeString('es-PE', {
                            hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
                        });
                        const end = new Date(b.slotEndsAt).toLocaleTimeString('es-PE', {
                            hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
                        });
                        return (
                            <div key={b.id} className="bg-white rounded-xl p-4 border border-[var(--gray-border)]">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-semibold text-[var(--gray-primary)]">
                                        {start} – {end}
                                    </p>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                        {STATUS_LABELS[b.status] ?? b.status}
                                    </span>
                                </div>
                                <p className="text-sm text-[var(--orange-price)] font-semibold">
                                    Saldo: {formatMoney(b.balanceDue, b.currency)}
                                </p>
                                {b.status === 'reserved' && (
                                    <button
                                        type="button"
                                        onClick={() => handleNoShow(b.id)}
                                        className="mt-2 text-xs text-red-600 font-semibold underline"
                                    >
                                        Marcar No-Show
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
