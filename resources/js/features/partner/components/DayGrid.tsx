import React, { useState } from 'react';
import type { DayScheduleSlot, PartnerBooking } from '../types';

type DayGridProps = {
    slots: DayScheduleSlot[];
    onSelectBooking?: (bookingId: number) => void;
};

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 07:00 – 22:00

function slotColor(state: string, source?: string): string {
    if (state === 'reserved' || state === 'checked_in') {
        return source === 'walk_in'
            ? 'bg-[var(--navy-soft)] text-[var(--navy-deep)] border border-[var(--navy-mid)]'
            : 'bg-[var(--green-soft)] text-[var(--green-text)] border border-[var(--slot-free-border)]';
    }
    if (state === 'event_occupied') return 'bg-gray-200 text-gray-600 border border-gray-300';
    if (state === 'pending_payment') return 'bg-[var(--slot-pending)] text-[var(--slot-pending-text)] border border-yellow-300';
    return ''; // available — empty
}

export function DayGrid({ slots, onSelectBooking }: DayGridProps) {
    const [selectedBooking, setSelectedBooking] = useState<number | null>(null);

    // Group by fieldId
    const fields = Array.from(new Map(slots.map((s) => [s.fieldId, s.fieldName])).entries());

    function handleClick(bookingId: number | undefined) {
        if (!bookingId) return;
        setSelectedBooking(bookingId);
        onSelectBooking?.(bookingId);
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-[var(--gray-border)] bg-white">
            <table className="min-w-full text-xs border-collapse">
                <thead>
                    <tr className="bg-[var(--gray-page)]">
                        <th className="sticky left-0 bg-[var(--gray-page)] px-3 py-2 text-left font-semibold text-[var(--gray-secondary)] w-28 border-b border-r border-[var(--gray-border)]">
                            Cancha
                        </th>
                        {HOURS.map((h) => (
                            <th key={h} className="px-2 py-2 text-center font-medium text-[var(--gray-secondary)] min-w-[52px] border-b border-[var(--gray-border)]">
                                {String(h).padStart(2, '0')}:00
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {fields.map(([fieldId, fieldName]) => {
                        const fieldSlots = slots.filter((s) => s.fieldId === fieldId);
                        return (
                            <tr key={fieldId} className="border-b border-[var(--gray-border)] last:border-b-0">
                                <td className="sticky left-0 bg-white px-3 py-2 font-medium text-[var(--gray-primary)] border-r border-[var(--gray-border)] whitespace-nowrap">
                                    {fieldName}
                                </td>
                                {HOURS.map((h) => {
                                    const slot = fieldSlots.find(
                                        (s) => new Date(s.startsAt).getUTCHours() === h
                                    );
                                    const color = slot ? slotColor(slot.state, slot.bookingStatus) : '';
                                    const isSelected = slot?.bookingId === selectedBooking;

                                    return (
                                        <td key={h} className="px-1 py-1 text-center">
                                            {slot && color ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleClick(slot.bookingId)}
                                                    className={[
                                                        'w-full rounded px-1 py-1 font-medium truncate transition-all',
                                                        color,
                                                        isSelected ? 'ring-2 ring-[var(--navy-mid)]' : '',
                                                    ].join(' ')}
                                                    title={slot.guestName ?? slot.bookingStatus ?? slot.state}
                                                >
                                                    {slot.guestName?.split(' ')[0] ?? '●'}
                                                </button>
                                            ) : (
                                                <span className="block w-full h-6" />
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
