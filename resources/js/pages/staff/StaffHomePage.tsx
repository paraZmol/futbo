import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useShiftStore, useOpenShift, useCloseShift } from '@/features/staff/hooks/useStaff';
import { Button } from '@/shared/components/Button';
import { ApiError } from '@/shared/lib/apiClient';

// Hardcoded venue for now — in production comes from the staff user's profile
const DEFAULT_VENUE_ID = 1;

export default function StaffHomePage() {
    const navigate = useNavigate();
    const { activeShift, activeVenueId } = useShiftStore();
    const openShift  = useOpenShift();
    const closeShift = useCloseShift();

    const [closeError, setCloseError] = React.useState<string | null>(null);
    const [cashInput, setCashInput]   = React.useState('');
    const [showClose, setShowClose]   = React.useState(false);

    async function handleOpen() {
        try {
            await openShift.mutateAsync(DEFAULT_VENUE_ID);
        } catch (e) {
            if (e instanceof ApiError && e.code === 'SHIFT_ALREADY_OPEN') {
                alert('Ya tienes un turno abierto.');
            }
        }
    }

    async function handleClose() {
        if (!activeShift) return;
        const cents = Math.round(parseFloat(cashInput) * 100);
        if (isNaN(cents)) { setCloseError('Ingresa el efectivo entregado.'); return; }

        try {
            await closeShift.mutateAsync({ shiftId: activeShift.id, cash: cents });
            setShowClose(false);
            setCashInput('');
        } catch {
            setCloseError('No se pudo cerrar el turno. Intenta de nuevo.');
        }
    }

    if (!activeShift) {
        return (
            <main className="min-h-screen bg-[var(--gray-page)] flex flex-col items-center justify-center px-6 gap-6">
                <div className="text-6xl">🏟</div>
                <h1 className="text-2xl font-bold text-[var(--navy-deep)] text-center">
                    Staff — Sin turno activo
                </h1>
                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={openShift.isPending}
                    onClick={handleOpen}
                >
                    Abrir turno
                </Button>
            </main>
        );
    }

    if (showClose) {
        return (
            <main className="min-h-screen bg-[var(--gray-page)] flex flex-col justify-center px-6 gap-4">
                <h2 className="text-xl font-bold text-[var(--navy-deep)]">Cerrar turno</h2>
                <p className="text-sm text-[var(--gray-secondary)]">
                    Efectivo esperado: <strong>S/ {activeShift.cashExpected}</strong>
                </p>
                <div>
                    <label htmlFor="cash-input" className="block text-sm font-medium text-[var(--gray-primary)] mb-1">
                        Efectivo entregado (S/)
                    </label>
                    <input
                        id="cash-input"
                        type="number"
                        inputMode="decimal"
                        value={cashInput}
                        onChange={(e) => setCashInput(e.target.value)}
                        className="w-full rounded-lg border border-[var(--gray-border)] px-4 py-3 text-2xl text-[var(--gray-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--navy-mid)]"
                        placeholder="0.00"
                    />
                </div>
                {closeError && <p className="text-sm text-red-600">{closeError}</p>}
                <Button variant="danger" size="lg" fullWidth loading={closeShift.isPending} onClick={handleClose}>
                    Confirmar cierre
                </Button>
                <Button variant="ghost" size="md" fullWidth onClick={() => setShowClose(false)}>
                    Cancelar
                </Button>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[var(--gray-page)] px-4 pt-6 pb-8">
            <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                <span className="text-sm font-semibold text-green-700">Turno abierto</span>
            </div>
            <p className="text-xs text-[var(--gray-secondary)] mb-8">
                Desde {new Date(activeShift.openedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </p>

            <div className="space-y-3">
                {/* Primary action — large green button */}
                <button
                    type="button"
                    onClick={() => navigate('/staff/scan')}
                    className="w-full rounded-2xl bg-[var(--green-action)] text-white font-bold text-xl py-5 min-h-[80px] flex items-center justify-center gap-3 hover:bg-[var(--green-dark)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                >
                    <span className="text-3xl">📷</span>
                    Escanear QR
                </button>

                <Button variant="secondary" size="lg" fullWidth onClick={() => navigate('/staff/walk-in')}>
                    + Nueva reserva presencial
                </Button>

                <Button variant="secondary" size="lg" fullWidth onClick={() => navigate('/staff/bookings')}>
                    📋 Reservas de hoy
                </Button>

                <Button variant="ghost" size="md" fullWidth onClick={() => setShowClose(true)}>
                    💰 Cerrar turno
                </Button>
            </div>
        </main>
    );
}
