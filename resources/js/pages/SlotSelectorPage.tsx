import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { SlotGrid } from '@/features/bookings/components/SlotGrid';
import { useSlots } from '@/features/bookings/hooks/useSlots';
import { useVenue } from '@/features/venues/hooks/useVenues';
import { Button } from '@/shared/components/Button';
import { SlotGridSkeleton } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';
import { formatMoney } from '@/shared/lib/money';

const MAX_SLOTS = 4;

export default function SlotSelectorPage() {
    const { venueId } = useParams<{ venueId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const date    = searchParams.get('date') ?? new Date().toISOString().split('T')[0];
    const fieldId = searchParams.get('fieldId') ? Number(searchParams.get('fieldId')) : undefined;

    const { data: venue } = useVenue(venueId);
    const { data: slots = [], isLoading, isError, refetch } = useSlots(fieldId, date);

    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    function handleToggle(slotId: number) {
        setSelectedIds((prev) => {
            if (prev.includes(slotId)) return prev.filter((id) => id !== slotId);

            // Check contiguous constraint
            const allSelected = [...prev, slotId].sort((a, b) => a - b);
            const sortedSlots = slots.filter((s) => allSelected.includes(s.id)).sort((a, b) =>
                new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
            );
            for (let i = 1; i < sortedSlots.length; i++) {
                const prevEnd = new Date(sortedSlots[i - 1]!.endsAt).getTime();
                const currStart = new Date(sortedSlots[i]!.startsAt).getTime();
                if (prevEnd !== currStart) return prev; // not contiguous — ignore
            }

            if (prev.length >= MAX_SLOTS) return prev;
            return [...prev, slotId];
        });
    }

    const selectedSlots = slots.filter((s) => selectedIds.includes(s.id));
    const totalCents = selectedSlots.reduce((sum, s) => sum + parseFloat(s.unitPrice) * 100, 0);
    const depositCents = selectedSlots.reduce((sum, s) => sum + parseFloat(s.depositAmount) * 100, 0);
    const currency = selectedSlots[0]?.currency ?? 'PEN';

    function handleContinue() {
        if (!venueId || !fieldId || selectedIds.length === 0) return;
        const params = new URLSearchParams({
            venueId,
            fieldId: String(fieldId),
            slotIds: selectedIds.join(','),
        });
        navigate(`/checkout?${params.toString()}`);
    }

    return (
        <main className="min-h-screen bg-[var(--gray-page)] px-4 pb-32">
            <header className="sticky top-0 bg-[var(--gray-page)] py-4 z-10">
                <button type="button" onClick={() => navigate(-1)} className="text-[var(--navy-mid)] text-sm font-medium">
                    ← {venue?.name ?? 'Volver'}
                </button>
                <p className="text-xs text-[var(--gray-secondary)] mt-0.5">{date}</p>
            </header>

            {isLoading && <SlotGridSkeleton />}
            {isError && <ErrorState onRetry={() => refetch()} />}

            {!isLoading && !isError && (
                <SlotGrid
                    slots={slots}
                    selectedIds={selectedIds}
                    onToggle={handleToggle}
                />
            )}

            {selectedIds.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--gray-border)] px-4 py-3 safe-area-pb">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-[var(--gray-secondary)]">
                            {selectedSlots.length} hora{selectedSlots.length !== 1 ? 's' : ''}
                        </span>
                        <span className="font-semibold text-[var(--gray-primary)]">
                            Total: {formatMoney(String(totalCents / 100), currency)}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm mb-3">
                        <span className="text-[var(--gray-secondary)]">Anticipo ahora</span>
                        <span className="font-semibold text-[var(--orange-price)]">
                            {formatMoney(String(depositCents / 100), currency)}
                        </span>
                    </div>
                    <Button variant="primary" size="lg" fullWidth onClick={handleContinue}>
                        Continuar al pago →
                    </Button>
                </div>
            )}
        </main>
    );
}
