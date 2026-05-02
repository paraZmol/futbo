import React from 'react';
import { Button } from './Button';

type ErrorStateProps = {
    message?: string;
    onRetry?: () => void;
};

export function ErrorState({ message = 'No se pudo cargar. ¿Reintentar?', onRetry }: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-[var(--gray-secondary)] text-sm">{message}</p>
            {onRetry && (
                <Button variant="ghost" size="sm" onClick={onRetry}>
                    Reintentar
                </Button>
            )}
        </div>
    );
}
