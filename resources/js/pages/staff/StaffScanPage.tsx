import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRScanner } from '@/features/staff/components/QRScanner';
import { CheckInResultPanel } from '@/features/staff/components/CheckInResult';
import { useValidateQR } from '@/features/staff/hooks/useStaff';
import type { CheckInResult } from '@/features/staff/types';
import { ApiError } from '@/shared/lib/apiClient';

type ScanState =
    | { phase: 'scanning' }
    | { phase: 'loading' }
    | { phase: 'success'; result: CheckInResult }
    | { phase: 'error'; message: string };

export default function StaffScanPage() {
    const navigate = useNavigate();
    const validateQR = useValidateQR();
    const [state, setState] = useState<ScanState>({ phase: 'scanning' });
    // Prevent firing multiple times for same frame
    const lastToken = React.useRef<string>('');

    const handleScan = useCallback(async (token: string) => {
        if (token === lastToken.current || state.phase !== 'scanning') return;
        lastToken.current = token;

        setState({ phase: 'loading' });
        try {
            const result = await validateQR.mutateAsync(token);
            setState({ phase: 'success', result });
        } catch (e) {
            const msg = e instanceof ApiError
                ? e.message
                : 'QR no válido. Intenta de nuevo.';
            setState({ phase: 'error', message: msg });
            if ('vibrate' in navigator) navigator.vibrate([300, 100, 300]);
        }
    }, [state.phase, validateQR]);

    function reset() {
        lastToken.current = '';
        setState({ phase: 'scanning' });
    }

    if (state.phase === 'success') {
        return <CheckInResultPanel result={state.result} onDone={reset} />;
    }

    return (
        <main className="min-h-screen bg-[var(--navy-deep)] flex flex-col px-4 pt-6 pb-8">
            <button
                type="button"
                onClick={() => navigate('/staff')}
                className="text-white text-sm font-medium mb-6 self-start"
            >
                ← Volver
            </button>

            <h1 className="text-white text-xl font-bold text-center mb-6">Escanear QR</h1>

            {state.phase !== 'loading' && (
                <QRScanner onScan={handleScan} active={state.phase === 'scanning'} />
            )}

            {state.phase === 'loading' && (
                <div className="flex flex-col items-center justify-center flex-1 gap-4">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    <p className="text-white text-lg font-semibold">Validando...</p>
                </div>
            )}

            {state.phase === 'error' && (
                <div className="mt-6 rounded-xl bg-red-900 text-white px-4 py-4 text-center">
                    <p className="text-2xl mb-2">❌</p>
                    <p className="font-semibold">{state.message}</p>
                    <button
                        type="button"
                        onClick={reset}
                        className="mt-4 rounded-lg bg-white text-red-900 font-bold px-6 py-2"
                    >
                        Volver a escanear
                    </button>
                </div>
            )}

            {state.phase === 'scanning' && (
                <p className="text-white text-center text-sm mt-4 opacity-70">
                    Apunta la cámara al código QR del cliente
                </p>
            )}
        </main>
    );
}
