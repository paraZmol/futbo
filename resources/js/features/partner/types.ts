export type PartnerVenue = {
    id: number;
    publicId: string;
    name: string;
    city: string;
    status: 'active' | 'pending' | 'suspended';
};

export type PartnerBooking = {
    id: number;
    publicId: string;
    status: string;
    source: string;
    slotStartsAt: string;
    slotEndsAt: string;
    priceTotal: string;
    depositAmount: string;
    balanceDue: string;
    currency: string;
    fieldName?: string;
};

export type DayScheduleSlot = {
    fieldId: number;
    fieldName: string;
    slotId: number;
    startsAt: string;
    endsAt: string;
    state: string;
    bookingId?: number;
    bookingStatus?: string;
    guestName?: string;
};

export type Analytics = {
    totalBookings: number;
    occupancyPercent: number;
    totalRevenue: string;
    pendingBalance: string;
    currency: string;
};
