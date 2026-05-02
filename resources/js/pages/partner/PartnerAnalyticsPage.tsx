import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PartnerLayout } from '@/features/partner/components/PartnerLayout';
import { useMyVenues } from '@/features/partner/hooks/usePartner';
import { fetchAnalytics } from '@/features/partner/api/partnerApi';
import { formatMoney } from '@/shared/lib/money';
import { Skeleton } from '@/shared/components/Skeleton';

export default function PartnerAnalyticsPage() {
    const today      = new Date().toISOString().split('T')[0]!;
    const monthStart = today.slice(0, 8) + '01';
    const [dateFrom, setDateFrom] = useState(monthStart);
    const [dateTo,   setDateTo]   = useState(today);

    const { data: venues = [] } = useMyVenues();
    const venueId = venues[0]?.id ?? null;

    const { data: analytics, isLoading } = useQuery({
        queryKey: ['partner', 'analytics', venueId, dateFrom, dateTo],
        queryFn: () => fetchAnalytics(venueId!, dateFrom, dateTo),
        enabled: !!venueId,
        staleTime: 300_000,
    });

    const kpis = analytics ? [
        { icon: '📅', label: 'Reservas en el período', value: String(analytics.totalBookings), color: 'text-gray-900' },
        { icon: '📊', label: 'Ocupación promedio',     value: `${analytics.occupancyPercent}%`,          color: 'text-blue-700'    },
        { icon: '💰', label: 'Ingresos (anticipo)',     value: formatMoney(analytics.totalRevenue, analytics.currency), color: 'text-emerald-700' },
        { icon: '⏳', label: 'Saldo pendiente en cancha', value: formatMoney(analytics.pendingBalance, analytics.currency), color: 'text-amber-700' },
    ] : [];

    return (
        <PartnerLayout title="Ingresos y analítica">
            <div className="max-w-3xl space-y-6">

                {/* Filtro de fechas */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap items-center gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Desde</label>
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Hasta</label>
                        <input type="date" value={dateTo} max={today} onChange={(e) => setDateTo(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div className="flex gap-2 mt-4">
                        {[
                            { label: 'Esta semana', from: new Date(Date.now() - 7*86400000).toISOString().split('T')[0]! },
                            { label: 'Este mes',    from: monthStart },
                            { label: 'Este año',    from: today.slice(0, 5) + '01-01' },
                        ].map((p) => (
                            <button key={p.label} type="button"
                                onClick={() => { setDateFrom(p.from); setDateTo(today); }}
                                className="px-3 py-1.5 text-xs font-semibold rounded-full border border-gray-200 bg-white text-gray-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors">
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPIs */}
                {isLoading ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[1,2,3,4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {kpis.map((kpi) => (
                            <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <p className="text-2xl mb-2">{kpi.icon}</p>
                                <p className={`text-2xl font-extrabold ${kpi.color} mb-1`}>{kpi.value}</p>
                                <p className="text-xs text-gray-400">{kpi.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && !analytics && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                        <div className="text-4xl mb-3">📊</div>
                        <p className="text-gray-500">No hay datos para este período.</p>
                    </div>
                )}

                {/* Nota */}
                <p className="text-xs text-gray-400 text-center">
                    Los datos se actualizan cada 5 minutos. Los ingresos muestran el anticipo cobrado digitalmente.
                </p>
            </div>
        </PartnerLayout>
    );
}
