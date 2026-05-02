import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateWalkIn, useShiftStore } from '@/features/staff/hooks/useStaff';
import { useSlots } from '@/features/bookings/hooks/useSlots';
import { SlotGrid } from '@/features/bookings/components/SlotGrid';
import { Button } from '@/shared/components/Button';
import { ApiError } from '@/shared/lib/apiClient';

// In production, field comes from venue config / staff session
const DEFAULT_FIELD_ID = 1;

export default function StaffWalkInPage() {
    const navigate = useNavigate();
    const { activeVenueId } = useShiftStore();
    const today = new Date().toISOString().split('T')[0]!;

    const { data: slots = [], isLoading } = useSlots(DEFAULT_FIELD_ID, today);
    const createWalkIn = useCreateWalkIn();

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);

    function handleToggle(slotId: number) {
        setSelectedIds((prev) =>
            prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId]
        );
    }

    async function handleConfirm() {
        if (!activeVenueId || selectedIds.length === 0) return;
        setError(null);
        try {
            await createWalkIn.mutateAsync({
                venueId: activeVenueId,
                fieldId: DEFAULT_FIELD_ID,
                slotIds: selectedIds,
            });
            navigate('/staff');
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'Error al crear reserva presencial.');
        }
    }

    return (
        <main className="min-h-screen bg-[var(--gray-page)] px-4 pb-24">
            <header className="sticky top-0 bg-[var(--gray-page)] py-4 flex items-center gap-3">
                <button type="button" onClick={() => navigate('/staff')} className="text-[var(--navy-mid)] text-sm font-medium">
                    ← Volver
                </button>
                <h1 className="font-bold text-lg text-[var(--navy-deep)]">Nueva reserva presencial</h1>
            </header>

            <p className="text-sm text-[var(--gray-secondary)] mb-4">
                Selecciona los horarios — pago 100% en caja
            </p>

            {isLoading ? (
                <p className="text-sm text-[var(--gray-secondary)]">Cargando horarios...</p>
            ) : (
                <SlotGrid slots={slots} selectedIds={selectedIds} onToggle={handleToggle} />
            )}

            {error && (
                <div role="alert" className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {selectedIds.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--gray-border)] px-4 py-4">
                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        loading={createWalkIn.isPending}
                        onClick={handleConfirm}
                    >
                        Confirmar walk-in ({selectedIds.length} slot{selectedIds.length !== 1 ? 's' : ''})
                    </Button>
                </div>
            )}
        </main>
    );
}
