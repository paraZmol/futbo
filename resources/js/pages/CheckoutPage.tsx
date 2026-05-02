import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCreateBooking } from '@/features/bookings/hooks/useBookings';
import { useSlots } from '@/features/bookings/hooks/useSlots';
import { Button } from '@/shared/components/Button';
import { ApiError } from '@/shared/lib/apiClient';
import { formatMoney } from '@/shared/lib/money';
import { useAuth } from '@/features/auth/hooks/useAuth';

const PAYMENT_ERRORS: Record<string, string> = {
    SLOT_NOT_AVAILABLE: 'Ese horario fue tomado mientras elegías. Elige otro.',
    IDEMPOTENCY_KEY_MISSING: 'Error de configuración. Intenta de nuevo.',
};

const TTL_SECONDS = 600;

export default function CheckoutPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const venueId = Number(searchParams.get('venueId'));
    const fieldId = Number(searchParams.get('fieldId'));
    const slotIds = (searchParams.get('slotIds') ?? '').split(',').map(Number).filter(Boolean);

    const { data: slots = [] } = useSlots(fieldId, undefined);
    const selectedSlots = slots.filter((s) => slotIds.includes(s.id));

    const [error, setError] = useState<string | null>(null);
    const [ttl, setTtl] = useState(TTL_SECONDS);

    const createBooking = useCreateBooking();

    // Countdown timer — visual urgency for the user
    useEffect(() => {
        const interval = setInterval(() => setTtl((t) => Math.max(0, t - 1)), 1000);
        return () => clearInterval(interval);
    }, []);

    const totalCents   = selectedSlots.reduce((s, sl) => s + parseFloat(sl.unitPrice) * 100, 0);
    const depositCents = selectedSlots.reduce((s, sl) => s + parseFloat(sl.depositAmount) * 100, 0);
    const balanceCents = totalCents - depositCents;
    const currency     = selectedSlots[0]?.currency ?? 'PEN';

    const minutesLeft = Math.floor(ttl / 60);
    const secondsLeft = ttl % 60;

    async function handleConfirm() {
        if (!isAuthenticated) {
            navigate('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
            return;
        }

        setError(null);
        try {
            const booking = await createBooking.mutateAsync({ venueId, fieldId, slotIds });
            navigate(`/bookings/${booking.id}/confirmation`);
        } catch (e) {
            if (e instanceof ApiError) {
                setError(PAYMENT_ERRORS[e.code] ?? 'No se pudo procesar. Intenta de nuevo.');
            }
        }
    }

    return (
        <main className="min-h-screen bg-[var(--gray-page)] px-4 pb-24">
            <header className="sticky top-0 bg-[var(--gray-page)] py-4">
                <button type="button" onClick={() => navigate(-1)} className="text-[var(--navy-mid)] text-sm font-medium">
                    ← Confirmar reserva
                </button>
            </header>

            <div className="space-y-4">
                {/* Summary */}
                <section className="bg-white rounded-xl p-4 border border-[var(--gray-border)]">
                    <h2 className="font-semibold text-[var(--gray-primary)] mb-2">Resumen</h2>
                    {selectedSlots.map((slot) => (
                        <p key={slot.id} className="text-sm text-[var(--gray-secondary)]">
                            {new Date(slot.startsAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })}
                            {' – '}
                            {new Date(slot.endsAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })}
                        </p>
                    ))}
                </section>

                {/* Price breakdown — always visible */}
                <section className="bg-white rounded-xl p-4 border border-[var(--gray-border)] space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--gray-secondary)]">Anticipo ahora</span>
                        <span className="font-semibold text-[var(--gray-primary)]">
                            {formatMoney(String(depositCents / 100), currency)}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--gray-secondary)]">Saldo en cancha</span>
                        <span className="font-semibold text-[var(--orange-price)]">
                            {formatMoney(String(balanceCents / 100), currency)}
                        </span>
                    </div>
                    <div className="border-t border-[var(--gray-border)] pt-2 flex justify-between">
                        <span className="font-semibold text-[var(--gray-primary)]">Total reserva</span>
                        <span className="font-semibold text-[var(--gray-primary)]">
                            {formatMoney(String(totalCents / 100), currency)}
                        </span>
                    </div>
                </section>

                {/* TTL countdown */}
                {ttl < 300 && (
                    <p className="text-sm text-[var(--orange-price)] font-semibold text-center">
                        ⏱ Tu horario se libera en {minutesLeft}:{String(secondsLeft).padStart(2, '0')}
                    </p>
                )}

                {/* Error banner */}
                {error && (
                    <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={createBooking.isPending}
                    onClick={handleConfirm}
                >
                    Confirmar y pagar {formatMoney(String(depositCents / 100), currency)} →
                </Button>
            </div>
        </main>
    );
}
