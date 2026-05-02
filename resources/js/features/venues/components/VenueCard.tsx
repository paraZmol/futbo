import React from 'react';
import { formatMoney } from '@/shared/lib/money';
import type { Venue } from '../types';

type VenueCardProps = {
    venue: Venue;
    onSelect: (id: string) => void;
};

export function VenueCard({ venue, onSelect }: VenueCardProps) {
    const distanceText = venue.distanceM !== undefined
        ? venue.distanceM < 1000
            ? `${venue.distanceM.toFixed(0)} m`
            : `${(venue.distanceM / 1000).toFixed(1)} km`
        : null;

    return (
        <article
            aria-labelledby={`venue-${venue.id}-name`}
            className="rounded-xl overflow-hidden bg-[var(--gray-card)] shadow-sm"
        >
            <div className="relative aspect-video overflow-hidden bg-[var(--gray-border)]">
                {venue.photos[0] ? (
                    <img
                        src={venue.photos[0]}
                        alt={`Foto de ${venue.name}`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--gray-placeholder)]">
                        <span className="text-4xl">🏟</span>
                    </div>
                )}
            </div>

            <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                    <h3
                        id={`venue-${venue.id}-name`}
                        className="font-semibold text-[var(--gray-primary)] text-base leading-tight"
                    >
                        {venue.name}
                    </h3>
                    {venue.rating !== undefined && venue.reviewCount !== undefined && venue.reviewCount >= 5 && (
                        <span className="text-xs text-[var(--gray-secondary)] shrink-0">
                            ⭐ {venue.rating.toFixed(1)}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 mt-1 text-sm text-[var(--gray-secondary)]">
                    {distanceText && <span>📍 {distanceText}</span>}
                    <span>{venue.city}</span>
                </div>

                {venue.nextAvailableSlot && (
                    <p className="mt-1 text-xs text-[var(--gray-secondary)]">
                        Próximo libre: {new Date(venue.nextAvailableSlot).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </p>
                )}

                <div className="flex items-center justify-between mt-3 gap-2">
                    <span className="text-sm font-semibold text-[var(--orange-price)]">
                        desde {formatMoney(venue.minPrice, venue.currency)}/h
                    </span>
                    <button
                        type="button"
                        onClick={() => onSelect(venue.id)}
                        className="rounded-lg bg-[var(--green-action)] text-white text-sm font-semibold px-4 py-2 min-h-[44px] hover:bg-[var(--green-dark)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                    >
                        Ver horarios
                    </button>
                </div>
            </div>
        </article>
    );
}
