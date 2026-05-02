import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PartnerLayout } from '@/features/partner/components/PartnerLayout';
import { api } from '@/shared/lib/apiClient';
import { formatMoney } from '@/shared/lib/money';

type Booking = {
    id: number; publicId: string; status: string; source: string;
    slotStartsAt: string; slotEndsAt: string;
    priceTotal: string; depositAmount: string; balanceDue: string; currency: string;
    fieldName?: string;
};

const STATUS_LABELS: Record<string, string> = {
    pending_payment: 'Pendiente', reserved: 'Reservado', checked_in: 'Ingresado',
    completed: 'Completado', no_show: 'No show', cancelled: 'Cancelado',
};
const STATUS_COLORS: Record<string, string> = {
    pending_payment: 'bg-yellow-50 text-yellow-700',
    reserved:        'bg-emerald-50 text-emerald-700',
    checked_in:      'bg-blue-50 text-blue-700',
    completed:       'bg-gray-100 text-gray-600',
    no_show:         'bg-red-50 text-red-600',
    cancelled:       'bg-red-50 text-red-600',
};

export default function PartnerBookingsPage() {
    const today = new Date().toISOString().split('T')[0]!;
    const [date, setDate] = useState(today);
    const [statusFilter, setStatusFilter] = useState('all');

    const { data: bookings = [], isLoading, refetch } = useQuery<Booking[]>({
        queryKey: ['partner', 'bookings', date],
        queryFn: async () => {
            const res = await api.get<{ data: Booking[] }>('/partner/bookings', { params: { date } });
            return res.data.data;
        },
        staleTime: 30_000,
    });

    const filtered = statusFilter === 'all'
        ? bookings
        : bookings.filter((b) => b.status === statusFilter);

    const totalRevenue = bookings
        .filter((b) => ['reserved', 'checked_in', 'completed'].includes(b.status))
        .reduce((sum, b) => sum + parseFloat(b.depositAmount), 0);

    return (
        <PartnerLayout title="Reservas">
            <div className="max-w-4xl space-y-6">

                {/* Filtros */}
                <div className="flex flex-wrap items-center gap-3">
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                        className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />

                    <div className="flex gap-2 overflow-x-auto">
                        {[
                            { key: 'all', label: 'Todas' },
                            { key: 'reserved', label: 'Reservadas' },
                            { key: 'checked_in', label: 'Ingresadas' },
                            { key: 'no_show', label: 'No show' },
                            { key: 'cancelled', label: 'Canceladas' },
                        ].map((f) => (
                            <button key={f.key} type="button" onClick={() => setStatusFilter(f.key)}
                                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                                    statusFilter === f.key
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                }`}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPI rápido del día */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Total reservas', value: bookings.length.toString() },
                        { label: 'Anticipo cobrado', value: formatMoney(totalRevenue.toFixed(2), 'PEN') },
                        { label: 'No shows', value: bookings.filter((b) => b.status === 'no_show').length.toString() },
                    ].map((k) => (
                        <div key={k.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                            <p className="text-xl font-bold text-gray-900">{k.value}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{k.label}</p>
                        </div>
                    ))}
                </div>

                {/* Lista */}
                {isLoading ? (
                    <div className="space-y-3">{[1,2,3].map((i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-20" />
                    ))}</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                        <p className="text-gray-500">No hay reservas para esta fecha o filtro.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((b) => {
                            const start = new Date(b.slotStartsAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
                            const end   = new Date(b.slotEndsAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
                            return (
                                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-bold text-gray-900">{start} – {end}</span>
                                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                                {STATUS_LABELS[b.status] ?? b.status}
                                            </span>
                                            {b.source === 'walk_in' && (
                                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                                    Walk-in
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 font-mono">{b.publicId}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-bold text-gray-900">{formatMoney(b.priceTotal, b.currency)}</p>
                                        <p className="text-xs text-gray-400">Saldo: {formatMoney(b.balanceDue, b.currency)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </PartnerLayout>
    );
}
