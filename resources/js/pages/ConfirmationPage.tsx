import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { formatMoney } from '@/shared/lib/money';
import { Button } from '@/shared/components/Button';
import { useMyBookings } from '@/features/bookings/hooks/useBookings';

export default function ConfirmationPage() {
    const { bookingId } = useParams<{ bookingId: string }>();
    const navigate = useNavigate();
    const { data: bookings = [] } = useMyBookings();
    const booking = bookings.find((b) => b.id === Number(bookingId));

    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (booking?.qrToken && canvasRef.current) {
            QRCode.toCanvas(canvasRef.current, booking.qrToken, {
                width: 240,
                color: { dark: '#000000', light: '#FFFFFF' },
            });
        }
    }, [booking?.qrToken]);

    if (!booking) {
        return (
            <main className="min-h-screen bg-[var(--gray-page)] flex items-center justify-center px-4">
                <p className="text-[var(--gray-secondary)]">Cargando reserva...</p>
            </main>
        );
    }

    function shareWhatsApp() {
        const startTime = new Date(booking!.slotStartsAt).toLocaleTimeString('es-PE', {
            hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
        });
        const endTime = new Date(booking!.slotEndsAt).toLocaleTimeString('es-PE', {
            hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
        });
        const msg = encodeURIComponent(
            `✅ Reserva confirmada!\n🕐 ${startTime} – ${endTime}\n💰 Saldo en cancha: ${formatMoney(booking!.balanceDue, booking!.currency)}`
        );
        window.open(`https://wa.me/?text=${msg}`, '_blank');
    }

    return (
        <main className="min-h-screen bg-[var(--gray-page)] px-4 py-8 text-center">
            <div className="text-5xl mb-3">✅</div>
            <h1 className="text-2xl font-bold text-[var(--navy-deep)] mb-1">¡Reserva confirmada!</h1>

            <div className="bg-white rounded-xl p-4 border border-[var(--gray-border)] mt-4 mb-4 text-sm space-y-1">
                <div className="flex justify-between">
                    <span className="text-[var(--gray-secondary)]">Anticipo pagado</span>
                    <span className="font-semibold">{formatMoney(booking.depositAmount, booking.currency)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[var(--gray-secondary)]">Saldo en cancha</span>
                    <span className="font-semibold text-[var(--orange-price)]">{formatMoney(booking.balanceDue, booking.currency)}</span>
                </div>
            </div>

            {booking.qrToken && (
                <div className="flex flex-col items-center gap-2 my-4">
                    <div className="bg-white p-3 rounded-xl inline-block">
                        <canvas ref={canvasRef} aria-label="Código QR de ingreso" />
                    </div>
                    <p className="text-sm text-[var(--gray-secondary)]">Muestra este QR al llegar</p>
                </div>
            )}

            <div className="space-y-3 mt-4">
                <Button variant="secondary" size="md" fullWidth onClick={shareWhatsApp}>
                    Compartir por WhatsApp
                </Button>
                <Button variant="ghost" size="md" fullWidth onClick={() => navigate('/bookings')}>
                    Ver mis reservas
                </Button>
            </div>
        </main>
    );
}
