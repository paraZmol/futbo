import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { useMyBookings } from '@/features/bookings/hooks/useBookings';
import { formatMoney } from '@/shared/lib/money';

export default function QRPage() {
    const { bookingId } = useParams<{ bookingId: string }>();
    const navigate = useNavigate();
    const { data: bookings = [], isLoading } = useMyBookings();
    const booking = bookings.find((b) => b.id === Number(bookingId));
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Generar QR en canvas
    useEffect(() => {
        if (booking?.qrToken && canvasRef.current) {
            QRCode.toCanvas(canvasRef.current, booking.qrToken, {
                width: 280,
                margin: 2,
                color: { dark: '#000000', light: '#FFFFFF' },
            });
        }
    }, [booking?.qrToken]);

    // wakeLock — impide que la pantalla se apague mientras se muestra el QR
    useEffect(() => {
        let wakeLock: WakeLockSentinel | null = null;

        async function requestWakeLock() {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } })
                        .wakeLock.request('screen');
                }
            } catch {
                // wakeLock no disponible en este dispositivo/browser — no es crítico
            }
        }

        requestWakeLock();
        return () => { wakeLock?.release(); };
    }, []);

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false));
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!booking || !booking.qrToken) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
                <div className="text-5xl">🔍</div>
                <p className="text-gray-600 font-medium">Reserva no encontrada</p>
                <button type="button" onClick={() => navigate('/bookings')}
                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold">
                    Mis reservas
                </button>
            </div>
        );
    }

    const startTime = new Date(booking.slotStartsAt).toLocaleTimeString('es-PE', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
    });
    const endTime = new Date(booking.slotEndsAt).toLocaleTimeString('es-PE', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
    });
    const dateStr = new Date(booking.slotStartsAt).toLocaleDateString('es-PE', {
        weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
    });

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center px-4 py-8 ${
            isFullscreen ? 'bg-white' : 'bg-gray-50'
        }`}>
            {/* Botón volver — oculto en fullscreen */}
            {!isFullscreen && (
                <div className="w-full max-w-sm mb-6">
                    <button type="button" onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver
                    </button>
                </div>
            )}

            <div className="w-full max-w-sm">
                {/* Header con info de la reserva */}
                {!isFullscreen && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 text-center">
                        <p className="text-sm text-gray-500 mb-0.5 capitalize">{dateStr}</p>
                        <p className="text-2xl font-bold text-gray-900">{startTime} – {endTime}</p>
                    </div>
                )}

                {/* QR Code — fondo BLANCO PURO obligatorio para que el escáner lo lea */}
                <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 flex flex-col items-center gap-4 shadow-sm">
                    <canvas
                        ref={canvasRef}
                        aria-label="Código QR de ingreso"
                        className="block"
                        style={{ imageRendering: 'pixelated' }}
                    />
                    <p className="text-xs text-gray-400 text-center">
                        Muestra este código al staff al ingresar
                    </p>
                </div>

                {/* Saldo a pagar — bien visible para el staff */}
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                    <p className="text-sm text-amber-700 font-medium mb-0.5">Saldo a pagar en cancha</p>
                    <p className="text-3xl font-extrabold text-amber-800">
                        {formatMoney(booking.balanceDue, booking.currency)}
                    </p>
                </div>

                {/* Botón pantalla completa */}
                <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="mt-4 w-full py-3 border-2 border-gray-200 hover:border-emerald-400 rounded-2xl text-gray-600 hover:text-emerald-700 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    {isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa · Brillo al máximo'}
                </button>
            </div>
        </div>
    );
}
