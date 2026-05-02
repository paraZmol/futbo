import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { approvePartner, fetchAuditLogs, fetchPendingPartners, suspendPartner } from '@/features/admin/api/adminApi';
import { Button } from '@/shared/components/Button';
import { Skeleton } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';

type AdminSection = 'partners' | 'audit';

export default function AdminDashboardPage() {
    const [section, setSection] = useState<AdminSection>('partners');
    const qc = useQueryClient();

    // Pending partners
    const { data: partners = [], isLoading: loadingPartners, isError: errorPartners, refetch: refetchPartners } =
        useQuery({ queryKey: ['admin', 'partners'], queryFn: fetchPendingPartners, staleTime: 60_000 });

    const approveMutation = useMutation({
        mutationFn: approvePartner,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'partners'] }),
    });

    const suspendMutation = useMutation({
        mutationFn: suspendPartner,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'partners'] }),
    });

    // Audit logs
    const { data: auditData, isLoading: loadingAudit, isError: errorAudit, refetch: refetchAudit } =
        useQuery({
            queryKey: ['admin', 'audit'],
            queryFn: () => fetchAuditLogs({ page: 1 }),
            staleTime: 60_000,
            enabled: section === 'audit',
        });

    const navItems: { key: AdminSection; label: string }[] = [
        { key: 'partners', label: '👥 Partners pendientes' },
        { key: 'audit',    label: '📋 Audit logs' },
    ];

    return (
        <div className="min-h-screen bg-[var(--gray-page)] flex">
            {/* Sidebar */}
            <aside className="hidden md:flex flex-col w-56 bg-[var(--navy-deep)] text-white min-h-screen p-4 gap-2 shrink-0">
                <div className="flex items-center gap-2 mb-6">
                    <span className="text-2xl">⚙️</span>
                    <span className="font-bold text-lg">Admin</span>
                </div>
                {navItems.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => setSection(item.key)}
                        className={[
                            'text-left px-3 py-2 rounded-lg transition-colors text-sm font-medium',
                            section === item.key
                                ? 'bg-[var(--navy-mid)]'
                                : 'hover:bg-[var(--navy-mid)]',
                        ].join(' ')}
                    >
                        {item.label}
                    </button>
                ))}
            </aside>

            {/* Mobile top nav */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-[var(--navy-deep)] text-white flex z-10">
                {navItems.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => setSection(item.key)}
                        className={`flex-1 py-3 text-xs font-semibold transition-colors ${section === item.key ? 'bg-[var(--navy-mid)]' : ''}`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Main */}
            <main className="flex-1 p-4 md:p-6 pt-14 md:pt-6 overflow-auto">

                {/* Partners pendientes */}
                {section === 'partners' && (
                    <>
                        <h1 className="text-xl font-bold text-[var(--navy-deep)] mb-4">
                            Partners pendientes de aprobación
                        </h1>

                        {loadingPartners && (
                            <div className="space-y-3">
                                {[1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                            </div>
                        )}

                        {errorPartners && <ErrorState onRetry={() => refetchPartners()} />}

                        {!loadingPartners && !errorPartners && partners.length === 0 && (
                            <p className="text-[var(--gray-secondary)] py-8 text-center">
                                No hay partners pendientes. ✅
                            </p>
                        )}

                        <div className="space-y-3">
                            {partners.map((p) => (
                                <div
                                    key={p.id}
                                    className="bg-white rounded-xl border border-[var(--gray-border)] p-4 flex items-start justify-between gap-4"
                                >
                                    <div>
                                        <p className="font-semibold text-[var(--gray-primary)]">{p.name}</p>
                                        <p className="text-sm text-[var(--gray-secondary)]">{p.email}</p>
                                        <p className="text-xs text-[var(--gray-placeholder)] mt-0.5">
                                            {new Date(p.createdAt).toLocaleDateString('es-PE')}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            loading={approveMutation.isPending}
                                            onClick={() => approveMutation.mutate(p.id)}
                                        >
                                            Aprobar
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            loading={suspendMutation.isPending}
                                            onClick={() => suspendMutation.mutate(p.id)}
                                        >
                                            Rechazar
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Audit logs */}
                {section === 'audit' && (
                    <>
                        <h1 className="text-xl font-bold text-[var(--navy-deep)] mb-4">Audit logs</h1>

                        {loadingAudit && <Skeleton className="h-64 w-full rounded-xl" />}
                        {errorAudit && <ErrorState onRetry={() => refetchAudit()} />}

                        {!loadingAudit && !errorAudit && (
                            <div className="bg-white rounded-xl border border-[var(--gray-border)] overflow-hidden">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-[var(--gray-page)] text-xs font-semibold text-[var(--gray-secondary)] uppercase">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Fecha</th>
                                            <th className="px-4 py-3 text-left">Acción</th>
                                            <th className="px-4 py-3 text-left">Entidad</th>
                                            <th className="px-4 py-3 text-left">IP</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--gray-border)]">
                                        {(auditData?.data ?? []).map((log) => (
                                            <tr key={log.id} className="hover:bg-[var(--gray-page)]">
                                                <td className="px-4 py-3 text-[var(--gray-secondary)] whitespace-nowrap">
                                                    {new Date(log.createdAt).toLocaleString('es-PE')}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-[var(--gray-primary)]">
                                                    {log.action}
                                                </td>
                                                <td className="px-4 py-3 text-[var(--gray-secondary)]">
                                                    {log.subjectType} #{log.subjectId}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-[var(--gray-placeholder)]">
                                                    {log.ipAddress ?? '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
