import { api } from '@/shared/lib/apiClient';
import type { AuditLogEntry, PendingPartner } from '../types';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

export async function fetchPendingPartners(): Promise<PendingPartner[]> {
    const res = await api.get<ApiResponse<PendingPartner[]>>('/admin/partners?status=pending');
    return res.data.data;
}

export async function approvePartner(userId: number): Promise<void> {
    await api.post(`/admin/partners/${userId}/approve`);
}

export async function suspendPartner(userId: number): Promise<void> {
    await api.post(`/admin/partners/${userId}/suspend`);
}

export async function fetchAuditLogs(params: {
    page?: number;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
}): Promise<PaginatedResponse<AuditLogEntry>> {
    const res = await api.get<PaginatedResponse<AuditLogEntry>>('/admin/audit-logs', { params });
    return res.data;
}
