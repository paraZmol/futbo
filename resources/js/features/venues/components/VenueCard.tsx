import React from 'react';
import { formatMoney } from '@/shared/lib/money';
import type { Venue } from '../types';

type VenueCardProps = {
    venue: Venue;
    onSelect: (id: string) => void;
};

const SPORT_PHOTOS: Record<string, string> = {
    futbol5:  'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&q=80',
    futbol7:  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&q=80',
    padel:    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80',
    basket:   'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80',
    tenis:    'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&q=80',
    default:  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&q=80',
};

export function VenueCard({ venue, onSelect }: VenueCardProps) {
    const bgPhoto = venue.photos[0] ?? SPORT_PHOTOS.futbol5;

    const distanceText = venue.distanceM !== undefined
        ? venue.distanceM < 1000
            ? `${venue.distanceM.toFixed(0)} m`
            : `${(venue.distanceM / 1000).toFixed(1)} km`
        : null;

    return (
        <article
            className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            onClick={() => onSelect(venue.id)}
            aria-labelledby={`venue-${venue.id}-name`}
        >
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                <img
                    src={bgPhoto}
                    alt={`Foto de ${venue.name}`}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {venue.nextAvailableSlot && (
                    <span className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                        Libre ahora
                    </span>
                )}
            </div>

            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                    <h3
                        id={`venue-${venue.id}-name`}
                        className="font-semibold text-gray-900 text-base leading-tight line-clamp-1"
                    >
                        {venue.name}
                    </h3>
                    {venue.rating !== undefined && venue.reviewCount !== undefined && venue.reviewCount >= 3 && (
                        <div className="flex items-center gap-1 text-sm shrink-0">
                            <span className="text-amber-400">★</span>
                            <span className="font-medium text-gray-700">{venue.rating.toFixed(1)}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="line-clamp-1">{venue.city}{distanceText ? ` · ${distanceText}` : ''}</span>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-xs text-gray-400">desde </span>
                        <span className="font-bold text-emerald-700 text-lg">
                            {formatMoney(venue.minPrice, venue.currency)}
                        </span>
                        <span className="text-sm text-gray-400">/hora</span>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onSelect(venue.id); }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                        Ver horarios
                    </button>
                </div>
            </div>
        </article>
    );
}
