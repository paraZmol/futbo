import React from 'react';
import { formatMoney } from '@/shared/lib/money';
import type { Analytics } from '../types';
import { Skeleton } from '@/shared/components/Skeleton';

type KPIBarProps = { analytics: Analytics | undefined; isLoading: boolean };

export function KPIBar({ analytics, isLoading }: KPIBarProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
        );
    }

    if (!analytics) return null;

    const kpis = [
        { label: 'Reservas hoy', value: String(analytics.totalBookings), color: 'text-[var(--navy-deep)]' },
        { label: 'Ocupación', value: `${analytics.occupancyPercent}%`, color: 'text-[var(--green-action)]' },
        { label: 'Ingresos', value: formatMoney(analytics.totalRevenue, analytics.currency), color: 'text-[var(--gray-primary)]' },
        { label: 'Saldo pendiente', value: formatMoney(analytics.pendingBalance, analytics.currency), color: 'text-[var(--orange-price)]' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {kpis.map((kpi) => (
                <div key={kpi.label} className="bg-white rounded-xl p-4 border border-[var(--gray-border)]">
                    <p className="text-xs text-[var(--gray-secondary)] mb-1">{kpi.label}</p>
                    <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                </div>
            ))}
        </div>
    );
}
