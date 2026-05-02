import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DayGrid } from '@/features/partner/components/DayGrid';
import { KPIBar } from '@/features/partner/components/KPIBar';
import { useAnalytics, useDaySchedule, useMyVenues, useVenueBookings } from '@/features/partner/hooks/usePartner';
import { ErrorState } from '@/shared/components/ErrorState';
import { formatMoney } from '@/shared/lib/money';

export default function PartnerDashboardPage() {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0]!;

    const { data: venues = [] } = useMyVenues();
    const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState(today);
    const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);

    const activeVenueId = selectedVenueId ?? venues[0]?.id ?? null;

    const { data: schedule = [], isLoading: loadingSchedule, isError: errorSchedule, refetch } =
        useDaySchedule(activeVenueId, selectedDate);

    const { data: analytics, isLoading: loadingAnalytics } =
        useAnalytics(activeVenueId, today, today);

    const { data: bookings = [] } = useVenueBookings(activeVenueId, selectedDate);
    const selectedBooking = bookings.find((b) => b.id === selectedBookingId);

    return (
        <div className="min-h-screen bg-[var(--gray-page)] flex">
            {/* Sidebar */}
            <aside className="hidden md:flex flex-col w-56 bg-[var(--navy-deep)] text-white min-h-screen p-4 gap-2 shrink-0">
                <div className="flex items-center gap-2 mb-6">
                    <span className="text-2xl">🏟</span>
                    <span className="font-bold text-lg">Partner</span>
                </div>
                {[
                    { label: '📊 Hoy',        path: '/partner' },
                    { label: '📅 Reservas',   path: '/partner/bookings' },
                    { label: '⚙️ Mis canchas', path: '/partner/fields' },
                    { label: '👥 Staff',       path: '/partner/staff' },
                ].map((item) => (
                    <button
                        key={item.path}
                        type="button"
                        onClick={() => navigate(item.path)}
                        className="text-left px-3 py-2 rounded-lg hover:bg-[var(--navy-mid)] transition-colors text-sm font-medium"
                    >
                        {item.label}
                    </button>
                ))}
            </aside>

            {/* Main content */}
            <main className="flex-1 p-4 md:p-6 overflow-auto">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <h1 className="text-xl font-bold text-[var(--navy-deep)]">Vista del día</h1>
                    <div className="flex items-center gap-2">
                        {venues.length > 1 && (
                            <select
                                value={activeVenueId ?? ''}
                                onChange={(e) => setSelectedVenueId(Number(e.target.value))}
                                className="rounded-lg border border-[var(--gray-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--navy-mid)]"
                            >
                                {venues.map((v) => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        )}
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="rounded-lg border border-[var(--gray-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--navy-mid)]"
                        />
                    </div>
                </div>

                {/* KPI bar */}
                <KPIBar analytics={analytics} isLoading={loadingAnalytics} />

                {/* Day grid */}
                {errorSchedule && <ErrorState onRetry={() => refetch()} />}
                {!errorSchedule && (
                    <DayGrid slots={schedule} onSelectBooking={setSelectedBookingId} />
                )}

                {/* Legend */}
                <div className="flex gap-4 mt-3 text-xs text-[var(--gray-secondary)] flex-wrap">
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-sm bg-[var(--green-soft)] border border-[var(--slot-free-border)] inline-block" />
                        Online
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-sm bg-[var(--navy-soft)] border border-[var(--navy-mid)] inline-block" />
                        Walk-in
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-sm bg-gray-200 border border-gray-300 inline-block" />
                        Bloqueado
                    </span>
                </div>

                {/* Booking detail panel */}
                {selectedBooking && (
                    <div className="mt-6 bg-white rounded-xl border border-[var(--gray-border)] p-4">
                        <div className="flex justify-between items-start mb-3">
                            <h2 className="font-semibold text-[var(--gray-primary)]">Detalle reserva</h2>
                            <button
                                type="button"
                                onClick={() => setSelectedBookingId(null)}
                                className="text-[var(--gray-placeholder)] hover:text-[var(--gray-secondary)] text-lg"
                                aria-label="Cerrar detalle"
                            >
                                ×
                            </button>
                        </div>
                        <div className="text-sm space-y-1 text-[var(--gray-secondary)]">
                            <p>ID: <span className="font-mono text-[var(--gray-primary)]">{selectedBooking.publicId}</span></p>
                            <p>Estado: <strong>{selectedBooking.status}</strong></p>
                            <p>
                                {new Date(selectedBooking.slotStartsAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })}
                                {' – '}
                                {new Date(selectedBooking.slotEndsAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })}
                            </p>
                            <p>Total: <strong className="text-[var(--gray-primary)]">{formatMoney(selectedBooking.priceTotal, selectedBooking.currency)}</strong></p>
                            <p>Saldo pendiente: <strong className="text-[var(--orange-price)]">{formatMoney(selectedBooking.balanceDue, selectedBooking.currency)}</strong></p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
