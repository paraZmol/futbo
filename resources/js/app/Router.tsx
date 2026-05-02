import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Skeleton } from '@/shared/components/Skeleton';

const HomePage         = lazy(() => import('@/pages/HomePage'));
const VenuesPage       = lazy(() => import('@/pages/VenuesPage'));
const SlotSelectorPage = lazy(() => import('@/pages/SlotSelectorPage'));
const CheckoutPage     = lazy(() => import('@/pages/CheckoutPage'));
const ConfirmationPage = lazy(() => import('@/pages/ConfirmationPage'));
const MyBookingsPage   = lazy(() => import('@/pages/MyBookingsPage'));

function PageFallback() {
    return (
        <div className="min-h-screen bg-[var(--gray-page)] px-4 pt-8 space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    );
}

export function AppRouter() {
    return (
        <BrowserRouter>
            <Suspense fallback={<PageFallback />}>
                <Routes>
                    <Route path="/"                                element={<HomePage />} />
                    <Route path="/venues"                          element={<VenuesPage />} />
                    <Route path="/venues/:venueId"                 element={<SlotSelectorPage />} />
                    <Route path="/checkout"                        element={<CheckoutPage />} />
                    <Route path="/bookings"                        element={<MyBookingsPage />} />
                    <Route path="/bookings/:bookingId/confirmation" element={<ConfirmationPage />} />
                </Routes>
            </Suspense>
            <BottomNav />
        </BrowserRouter>
    );
}
