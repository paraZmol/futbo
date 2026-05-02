import React from 'react';

type SkeletonProps = { className?: string };

export function Skeleton({ className = '' }: SkeletonProps) {
    return <div className={`animate-pulse bg-[var(--gray-border)] rounded ${className}`} />;
}

export function VenueCardSkeleton() {
    return (
        <div className="rounded-xl overflow-hidden bg-white shadow-sm">
            <Skeleton className="h-36 w-full rounded-none" />
            <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    );
}

export function SlotGridSkeleton() {
    return (
        <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-16 flex-shrink-0" />
            ))}
        </div>
    );
}
