import React, { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { formatMoney } from '@/shared/lib/money';
import { useMyBookings } from '@/features/bookings/hooks/useBookings';

export default function ConfirmationPage() {
    const { bookingId } = useParams<{ bookingId: string }>();
    const navigate = useNavigate();
    const { data: bookings = [], isLoading } = useMyBookings();
    const booking = bookings.find(b => b.id === Number(bookingId));
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (booking?.qrToken && canvasRef.current) {
            QRCode.toCanvas(canvasRef.current, booking.qrToken, {
                width: 220,
                margin: 2,
                color: { dark: '#0f172a', light: '#ffffff' },
            });
        }
    }, [booking?.qrToken]);

    function shareWhatsApp() {
        if (!booking) return;
        const start = new Date(booking.slotStartsAt).toLocaleTimeString('es-PE', {
            hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
        });
        const end = new Date(booking.slotEndsAt).toLocaleTimeString('es-PE', {
            hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
        });
        const msg = encodeURIComponent(
            `✅ ¡Reserva confirmada!\n🕐 ${start} – ${end}\n💰 Saldo a pagar en cancha: ${formatMoney(booking.balanceDue, booking.currency)}\n\nReservado en CanchasApp`
        );
        window.open(`https://wa.me/?text=${msg}`, '_blank');
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4">
                <p className="text-5xl">🔍</p>
                <p className="font-bold text-slate-900">Reserva no encontrada</p>
                <button type="button" onClick={() => navigate('/bookings')}
                    className="px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors">
                    Ver mis reservas
                </button>
            </div>
        );
    }

    const startDate = new Date(booking.slotStartsAt);
    const endDate   = new Date(booking.slotEndsAt);
    const dateStr   = startDate.toLocaleDateString('es-PE', {
        weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
    });
    const startTime = startDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
    const endTime   = endDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });

    return (
        <div className="min-h-screen bg-slate-50 pb-20 md:pb-8">
            <div className="max-w-md mx-auto px-4 py-10 flex flex-col items-center text-center">

                {/* Ícono de éxito */}
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-5 shadow-lg shadow-emerald-200">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-3xl font-extrabold text-slate-900 mb-1">¡Reserva confirmada!</h1>
                <p className="text-slate-500 text-base mb-6">Tu cancha está reservada. Muestra el QR al llegar.</p>

                {/* Tarjeta de detalle */}
                <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4 text-left">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Detalle de la reserva</p>
                    <div className="space-y-2.5">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Fecha
                            </span>
                            <span className="font-semibold text-slate-900 capitalize">{dateStr}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Horario
                            </span>
                            <span className="font-bold text-slate-900">{startTime} – {endTime}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Anticipo pagado</span>
                            <span className="font-semibold text-slate-900">{formatMoney(booking.depositAmount, booking.currency)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                            <div>
                                <p className="text-sm font-bold text-slate-700">Pendiente en cancha</p>
                                <p className="text-xs text-slate-400">Recuerda llevar este monto</p>
                            </div>
                            <span className="text-xl font-extrabold text-emerald-600">
                                {formatMoney(booking.balanceDue, booking.currency)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* QR Code — fondo BLANCO PURO obligatorio */}
                {booking.qrToken && (
                    <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-4 flex flex-col items-center">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Tu código QR</p>
                        <div className="bg-white p-3 rounded-xl border-2 border-slate-100 inline-block">
                            <canvas ref={canvasRef} aria-label="Código QR de ingreso" />
                        </div>
                        <p className="text-xs text-slate-400 mt-3">Muestra este código al staff al ingresar</p>
                    </div>
                )}

                {/* Acciones */}
                <div className="w-full space-y-3">
                    <button type="button" onClick={shareWhatsApp}
                        className="w-full py-3.5 bg-[#25D366] hover:bg-[#22c55e] active:scale-[0.98] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.117 1.528 5.845L.057 24l6.305-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.897 0-3.67-.49-5.214-1.348l-.373-.222-3.875 1.016 1.034-3.77-.243-.388A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                        </svg>
                        Compartir por WhatsApp
                    </button>
                    <button type="button" onClick={() => navigate('/bookings')}
                        className="w-full py-3.5 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl transition-all text-sm">
                        Ver mis reservas
                    </button>
                    <button type="button" onClick={() => navigate('/')}
                        className="w-full py-3 text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors">
                        Volver al inicio
                    </button>
                </div>
            </div>
        </div>
    );
}
