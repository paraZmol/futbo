import React from 'react';
import type { Slot } from '../types';

type SlotGridProps = {
    slots: Slot[];
    selectedIds: number[];
    onToggle: (slotId: number) => void;
};

type SlotGroup = { label: string; slots: Slot[] };

function groupSlotsByPeriod(slots: Slot[]): SlotGroup[] {
    const morning: Slot[] = [];
    const afternoon: Slot[] = [];
    const night: Slot[] = [];

    for (const slot of slots) {
        const hour = new Date(slot.startsAt).getUTCHours();
        if (hour < 13) morning.push(slot);
        else if (hour < 18) afternoon.push(slot);
        else night.push(slot);
    }

    return [
        { label: 'Mañana', slots: morning },
        { label: 'Tarde', slots: afternoon },
        { label: 'Noche', slots: night },
    ].filter((g) => g.slots.length > 0);
}

function slotLabel(slot: Slot): string {
    return new Date(slot.startsAt).toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC',
    });
}

type SlotChipProps = { slot: Slot; selected: boolean; onToggle: (id: number) => void };

function SlotChip({ slot, selected, onToggle }: SlotChipProps) {
    const isUnavailable = slot.state !== 'available' && !selected;
    const isPending = slot.state === 'pending_payment';

    let bg = 'bg-[var(--slot-free)] text-[var(--slot-free-text)] border border-[var(--slot-free-border)]';
    if (selected) bg = 'bg-[var(--slot-selected)] text-[var(--slot-selected-text)] border border-[var(--slot-selected)]';
    else if (isPending) bg = 'bg-[var(--slot-pending)] text-[var(--slot-pending-text)] border border-yellow-300 cursor-not-allowed';
    else if (isUnavailable) bg = 'bg-[var(--slot-taken)] text-[var(--slot-taken-text)] border border-[var(--slot-taken-border)] cursor-not-allowed';

    const label = slotLabel(slot);
    const stateLabel = selected ? 'seleccionado por ti' : slot.state === 'available' ? 'disponible' : 'ocupado';

    return (
        <button
            type="button"
            disabled={isUnavailable}
            onClick={() => !isUnavailable && onToggle(slot.id)}
            aria-label={`${label}, ${stateLabel}`}
            aria-pressed={selected}
            className={[
                'flex-shrink-0 rounded-lg font-semibold text-sm transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--navy-mid)]',
                'min-w-[72px] min-h-[44px] px-2',
                bg,
            ].join(' ')}
        >
            {label}
        </button>
    );
}

export function SlotGrid({ slots, selectedIds, onToggle }: SlotGridProps) {
    const groups = groupSlotsByPeriod(slots);

    if (groups.length === 0) {
        return (
            <p className="text-sm text-[var(--gray-secondary)] py-4 text-center">
                No hay horarios disponibles para este día.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {groups.map((group) => (
                <div key={group.label}>
                    <p className="text-xs font-semibold text-[var(--gray-secondary)] uppercase tracking-wide mb-2">
                        {group.label}
                    </p>
                    <div className="overflow-x-auto -mx-4 px-4">
                        <div className="flex gap-2 pb-2" style={{ minWidth: 'max-content' }}>
                            {group.slots.map((slot) => (
                                <SlotChip
                                    key={slot.id}
                                    slot={slot}
                                    selected={selectedIds.includes(slot.id)}
                                    onToggle={onToggle}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            ))}

            <div className="flex gap-4 text-xs text-[var(--gray-secondary)] pt-1 flex-wrap">
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-[var(--slot-free)] border border-[var(--slot-free-border)] inline-block" />
                    Libre
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-[var(--slot-taken)] border border-[var(--slot-taken-border)] inline-block" />
                    Ocupado
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-[var(--slot-selected)] inline-block" />
                    Tú
                </span>
            </div>
        </div>
    );
}
