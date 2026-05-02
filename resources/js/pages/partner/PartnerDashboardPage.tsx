import React, { useState } from 'react';
import { DayGrid } from '@/features/partner/components/DayGrid';
import { KPIBar } from '@/features/partner/components/KPIBar';
import { PartnerLayout } from '@/features/partner/components/PartnerLayout';
import { useAnalytics, useDaySchedule, useMyVenues, useVenueBookings } from '@/features/partner/hooks/usePartner';
import { ErrorState } from '@/shared/components/ErrorState';
import { formatMoney } from '@/shared/lib/money';

export default function PartnerDashboardPage() {
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
        <PartnerLayout title="Vista del día">
            <div className="space-y-6">

                {/* Controles */}
                <div className="flex flex-wrap items-center gap-3">
                    {venues.length > 1 && (
                        <select value={activeVenueId ?? ''}
                            onChange={(e) => setSelectedVenueId(Number(e.target.value))}
                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500">
                            {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    )}
                    <input type="date" value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500" />
                </div>

                {/* KPIs */}
                <KPIBar analytics={analytics} isLoading={loadingAnalytics} />

                {/* Grilla del día */}
                {errorSchedule
                    ? <ErrorState onRetry={() => refetch()} />
                    : <DayGrid slots={schedule} onSelectBooking={setSelectedBookingId} />
                }

                {/* Leyenda */}
                <div className="flex gap-4 text-xs text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300 inline-block" />
                        Online
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-300 inline-block" />
                        Walk-in
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-gray-200 border border-gray-300 inline-block" />
                        Bloqueado
                    </span>
                </div>

                {/* Panel de detalle de reserva */}
                {selectedBooking && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex justify-between items-start mb-3">
                            <h2 className="font-bold text-gray-900">Detalle de la reserva</h2>
                            <button type="button" onClick={() => setSelectedBookingId(null)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-lg">
                                ×
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">ID</p>
                                <p className="font-mono text-gray-700 text-xs">{selectedBooking.publicId}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">Estado</p>
                                <p className="font-semibold text-gray-900">{selectedBooking.status}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">Horario</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(selectedBooking.slotStartsAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })}
                                    {' – '}
                                    {new Date(selectedBooking.slotEndsAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">Total</p>
                                <p className="font-bold text-gray-900">{formatMoney(selectedBooking.priceTotal, selectedBooking.currency)}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs text-gray-400 mb-0.5">Saldo a cobrar en cancha</p>
                                <p className="font-bold text-amber-600 text-lg">{formatMoney(selectedBooking.balanceDue, selectedBooking.currency)}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PartnerLayout>
    );
}
