export type Shift = {
    id: number;
    status: 'open' | 'closed';
    openedAt: string;
    closedAt: string | null;
    cashExpected: string;
    cashDelivered: string | null;
    cashVariance: string | null;
};

export type CheckInResult = {
    bookingPublicId: string;
    status: string;
    balanceDue: string;
    currency: string;
    slotStartsAt: string;
    slotEndsAt: string;
};

export type DayBooking = {
    id: number;
    publicId: string;
    status: string;
    slotStartsAt: string;
    slotEndsAt: string;
    balanceDue: string;
    currency: string;
    qrToken: string | null;
};
