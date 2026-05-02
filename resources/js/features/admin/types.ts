export type PendingPartner = {
    id: number;
    name: string;
    email: string;
    createdAt: string;
    venueCount: number;
};

export type AuditLogEntry = {
    id: number;
    userId: number | null;
    action: string;
    subjectType: string;
    subjectId: number;
    createdAt: string;
    ipAddress: string | null;
};
