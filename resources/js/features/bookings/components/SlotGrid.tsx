import React from 'react';
import { formatMoney } from '@/shared/lib/money';
import type { Slot } from '../types';

type SlotGridProps = {
    slots: Slot[];
    selectedIds: number[];
    onToggle: (id: number) => void;
};

function groupByPeriod(slots: Slot[]) {
    const m: Slot[] = [], a: Slot[] = [], n: Slot[] = [];
    for (const s of slots) {
        const h = new Date(s.startsAt).getUTCHours();
        if (h < 13) m.push(s); else if (h < 18) a.push(s); else n.push(s);
    }
    return [
        { label: 'Mañana',  icon: '🌅', slots: m },
        { label: 'Tarde',   icon: '☀️',  slots: a },
        { label: 'Noche',   icon: '🌙', slots: n },
    ].filter(g => g.slots.length > 0);
}

function label(slot: Slot) {
    return new Date(slot.startsAt).toLocaleTimeString('es-PE', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
    });
}

type ChipProps = { slot: Slot; selected: boolean; onToggle: (id: number) => void };

function SlotChip({ slot, selected, onToggle }: ChipProps) {
    const unavailable = slot.state !== 'available' && !selected;
    const pending     = slot.state === 'pending_payment';

    /* Estado visual según el prompt maestro */
    let cls = '';
    if (selected) {
        // Seleccionado: relleno con acento, texto blanco, sombra (sensación de presionado)
        cls = 'bg-emerald-500 text-white border-2 border-emerald-500 shadow-md shadow-emerald-200 scale-[1.04] ring-2 ring-emerald-300 ring-offset-1';
    } else if (pending) {
        // En proceso de pago: amarillo suave
        cls = 'bg-amber-50 text-amber-600 border border-amber-200 opacity-60 cursor-not-allowed';
    } else if (unavailable) {
        // Ocupado/bloqueado: opacidad baja, gris, cursor disabled
        cls = 'bg-slate-100 text-slate-400 border border-slate-200 opacity-50 cursor-not-allowed line-through';
    } else {
        // Disponible: fondo blanco, texto oscuro, borde sutil — hover verde
        cls = 'bg-white text-slate-800 border-2 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 cursor-pointer';
    }

    const timeLabel   = label(slot);
    const stateLabel  = selected ? 'seleccionado' : slot.state === 'available' ? 'disponible' : 'ocupado';

    return (
        <button
            type="button"
            disabled={unavailable}
            onClick={() => !unavailable && onToggle(slot.id)}
            aria-label={`${timeLabel}, ${stateLabel}`}
            aria-pressed={selected}
            title={pending ? 'Alguien está reservando este horario' : undefined}
            className={[
                'flex flex-col items-center justify-center shrink-0',
                'rounded-2xl font-bold transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1',
                'min-w-[72px] min-h-[56px] px-3 py-2',
                cls,
            ].join(' ')}
        >
            <span className="text-sm font-extrabold leading-none">{timeLabel}</span>
            {selected ? (
                <span className="text-[10px] font-bold text-emerald-100 mt-1">✓ elegido</span>
            ) : slot.state === 'available' ? (
                <span className="text-[10px] font-medium text-slate-400 mt-0.5 group-hover:text-emerald-500">
                    {formatMoney(slot.unitPrice, slot.currency)}
                </span>
            ) : (
                <span className="text-[10px] text-slate-400 mt-0.5">ocupado</span>
            )}
        </button>
    );
}

export function SlotGrid({ slots, selectedIds, onToggle }: SlotGridProps) {
    const groups = groupByPeriod(slots);
    const availableCount = slots.filter(s => s.state === 'available').length;

    if (groups.length === 0) {
        return (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-100">
                <p className="text-3xl mb-2">🗓</p>
                <p className="text-slate-500 text-sm">No hay horarios disponibles para este día.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Contador */}
            <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    {availableCount} disponible{availableCount !== 1 ? 's' : ''}
                </span>
                {selectedIds.length > 0 && (
                    <>
                        <span className="text-slate-300">·</span>
                        <span className="font-bold text-emerald-700">{selectedIds.length} seleccionado{selectedIds.length !== 1 ? 's' : ''}</span>
                    </>
                )}
            </div>

            {groups.map(group => (
                <div key={group.label}>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-base" aria-hidden="true">{group.icon}</span>
                        <span className="text-sm font-extrabold text-slate-600 uppercase tracking-wider">{group.label}</span>
                        <span className="text-xs text-slate-400">
                            ({group.slots.filter(s => s.state === 'available').length} libre{group.slots.filter(s => s.state === 'available').length !== 1 ? 's' : ''})
                        </span>
                    </div>

                    {/* Scroll horizontal mobile, wrap desktop */}
                    <div className="overflow-x-auto -mx-1 px-1 pb-1 md:overflow-x-visible md:pb-0">
                        <div className="flex gap-2 md:flex-wrap" style={{ minWidth: 'max-content' }}>
                            {group.slots.map(slot => (
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

            {/* Leyenda */}
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500 border-t border-slate-100">
                <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-xl border-2 border-slate-200 bg-white inline-block" />
                    Disponible
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-xl bg-emerald-500 border-2 border-emerald-500 inline-block" />
                    Seleccionado
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-xl bg-slate-100 border border-slate-200 opacity-50 inline-block" />
                    Ocupado
                </span>
            </div>
        </div>
    );
}
