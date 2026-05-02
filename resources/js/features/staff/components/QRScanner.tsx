import React, { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';

type QRScannerProps = {
    onScan: (token: string) => void;
    active: boolean;
};

export function QRScanner({ onScan, active }: QRScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);
    const readerRef = useRef<BrowserQRCodeReader | null>(null);

    useEffect(() => {
        if (!active) return;

        const reader = new BrowserQRCodeReader();
        readerRef.current = reader;

        reader.decodeFromVideoDevice(undefined, videoRef.current!, (result, err) => {
            if (result) {
                onScan(result.getText());
            }
            if (err && !(err.name === 'NotFoundException')) {
                setError('No se pudo acceder a la cámara.');
            }
        }).catch(() => setError('No se pudo acceder a la cámara.'));

        return () => {
            BrowserQRCodeReader.releaseAllStreams();
        };
    }, [active, onScan]);

    if (error) {
        return (
            <div className="flex items-center justify-center h-64 rounded-xl bg-red-50 text-red-700 text-sm px-4 text-center">
                {error}
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-xl bg-black aspect-square max-w-xs mx-auto">
            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                aria-label="Vista de cámara para escanear QR"
                muted
                playsInline
            />
            {/* Scanning frame overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-white rounded-lg opacity-60" />
            </div>
        </div>
    );
}
