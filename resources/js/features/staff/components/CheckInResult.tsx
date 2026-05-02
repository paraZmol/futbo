import React, { useEffect } from 'react';
import { formatMoney } from '@/shared/lib/money';
import type { CheckInResult as CheckInResultType } from '../types';

type CheckInResultProps = {
    result: CheckInResultType;
    onDone: () => void;
};

export function CheckInResultPanel({ result, onDone }: CheckInResultProps) {
    const isValid = result.status === 'checked_in';

    // Haptic feedback: short = ok, long = error
    useEffect(() => {
        if ('vibrate' in navigator) {
            navigator.vibrate(isValid ? [100] : [300, 100, 300]);
        }
    }, [isValid]);

    const startTime = new Date(result.slotStartsAt).toLocaleTimeString('es-PE', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
    });
    const endTime = new Date(result.slotEndsAt).toLocaleTimeString('es-PE', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
    });

    return (
        <div
            role="alert"
            className={`min-h-screen flex flex-col items-center justify-center px-6 text-center ${
                isValid ? 'bg-[var(--green-soft)]' : 'bg-[var(--slot-taken)]'
            }`}
        >
            <div className="text-7xl mb-4">{isValid ? '✅' : '❌'}</div>

            <h2 className={`text-3xl font-bold mb-2 ${isValid ? 'text-[var(--green-text)]' : 'text-[var(--slot-taken-text)]'}`}>
                {isValid ? 'VÁLIDO' : 'NO VÁLIDO'}
            </h2>

            {isValid && (
                <>
                    <p className="text-lg font-semibold text-[var(--green-text)] mb-1">
                        {startTime} – {endTime}
                    </p>
                    <p className="text-[var(--green-text)] text-base mb-6">
                        {result.bookingPublicId}
                    </p>

                    <div className="bg-white rounded-2xl px-8 py-4 mb-6 shadow">
                        <p className="text-sm text-[var(--gray-secondary)] mb-1">Cobrar en caja:</p>
                        <p className="text-5xl font-bold text-[var(--orange-price)]">
                            {formatMoney(result.balanceDue, result.currency)}
                        </p>
                    </div>
                </>
            )}

            <button
                type="button"
                onClick={onDone}
                className="mt-2 rounded-xl bg-[var(--navy-deep)] text-white font-bold text-lg px-8 py-4 min-h-[56px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
                Volver a escanear
            </button>
        </div>
    );
}
