import React from 'react';
import { formatMoney } from '@/shared/lib/money';
import type { Booking } from '../types';

type BookingCardProps = {
    booking: Booking;
    onCancel?: (id: number) => void;
    onShowQR?: (id: number) => void;
};

const statusLabels: Record<Booking['status'], string> = {
    pending_payment: 'Pendiente de pago',
    reserved:        'Reservado',
    checked_in:      'Ingresado',
    completed:       'Completado',
    no_show:         'No se presentó',
    cancelled:       'Cancelado',
    refunded:        'Reembolsado',
};

const statusColors: Record<Booking['status'], string> = {
    pending_payment: 'bg-[var(--slot-pending)] text-[var(--slot-pending-text)]',
    reserved:        'bg-[var(--green-soft)] text-[var(--green-text)]',
    checked_in:      'bg-[var(--green-soft)] text-[var(--green-text)]',
    completed:       'bg-[var(--gray-border)] text-[var(--gray-secondary)]',
    no_show:         'bg-[var(--slot-taken)] text-[var(--slot-taken-text)]',
    cancelled:       'bg-[var(--slot-taken)] text-[var(--slot-taken-text)]',
    refunded:        'bg-[var(--gray-border)] text-[var(--gray-secondary)]',
};

export function BookingCard({ booking, onCancel, onShowQR }: BookingCardProps) {
    const startDate = new Date(booking.slotStartsAt);
    const endDate = new Date(booking.slotEndsAt);

    const dateStr = startDate.toLocaleDateString('es-PE', {
        weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
    });
    const timeStr = `${startDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })} – ${endDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })}`;

    return (
        <article
            aria-labelledby={`booking-${booking.id}-title`}
            className="rounded-lg border border-[var(--gray-border)] bg-white p-4 shadow-sm"
        >
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p id={`booking-${booking.id}-title`} className="font-semibold text-[var(--gray-primary)]">
                        {dateStr}
                    </p>
                    <p className="text-sm text-[var(--gray-secondary)]">{timeStr}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${statusColors[booking.status]}`}>
                    {statusLabels[booking.status]}
                </span>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
                <div>
                    <span className="text-[var(--gray-secondary)]">Anticipo pagado: </span>
                    <span className="font-semibold text-[var(--gray-primary)]">
                        {formatMoney(booking.depositAmount, booking.currency)}
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-[var(--gray-secondary)]">Saldo en cancha: </span>
                    <span className="font-semibold text-[var(--orange-price)]">
                        {formatMoney(booking.balanceDue, booking.currency)}
                    </span>
                </div>
            </div>

            {(booking.status === 'reserved' || booking.status === 'checked_in') && onShowQR && (
                <button
                    type="button"
                    onClick={() => onShowQR(booking.id)}
                    className="mt-3 w-full rounded-lg border border-[var(--navy-mid)] text-[var(--navy-mid)] font-semibold text-sm py-2 hover:bg-[var(--navy-soft)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--navy-mid)]"
                >
                    Ver QR de ingreso
                </button>
            )}

            {booking.status === 'reserved' && onCancel && (
                <button
                    type="button"
                    onClick={() => onCancel(booking.id)}
                    className="mt-2 w-full rounded-lg bg-red-50 text-red-700 font-semibold text-sm py-2 hover:bg-red-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                    Cancelar reserva
                </button>
            )}
        </article>
    );
}
