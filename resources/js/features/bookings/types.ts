export type SlotState = 'available' | 'pending_payment' | 'reserved' | 'event_occupied' | 'completed' | 'expired';

export type Slot = {
    id: number;
    startsAt: string;
    endsAt: string;
    unitPrice: string;
    depositAmount: string;
    currency: string;
    state: SlotState;
};

export type BookingStatus =
    | 'pending_payment' | 'reserved' | 'checked_in'
    | 'completed' | 'no_show' | 'cancelled' | 'refunded';

export type Booking = {
    id: number;
    publicId: string;
    status: BookingStatus;
    priceTotal: string;
    depositAmount: string;
    balanceDue: string;
    currency: string;
    slotStartsAt: string;
    slotEndsAt: string;
    qrToken: string | null;
};

export type CreateBookingInput = {
    venueId: number;
    fieldId: number;
    slotIds: number[];
};
