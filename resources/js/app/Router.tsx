import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Skeleton } from '@/shared/components/Skeleton';
import { registerServiceWorker } from './registerSW';

registerServiceWorker();

// User app pages
const HomePage         = lazy(() => import('@/pages/HomePage'));
const VenuesPage       = lazy(() => import('@/pages/VenuesPage'));
const SlotSelectorPage = lazy(() => import('@/pages/SlotSelectorPage'));
const CheckoutPage     = lazy(() => import('@/pages/CheckoutPage'));
const ConfirmationPage = lazy(() => import('@/pages/ConfirmationPage'));
const MyBookingsPage   = lazy(() => import('@/pages/MyBookingsPage'));

// Partner dashboard pages
const PartnerDashboardPage = lazy(() => import('@/pages/partner/PartnerDashboardPage'));

// Admin backoffice pages
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));

// Staff PWA pages
const StaffHomePage     = lazy(() => import('@/pages/staff/StaffHomePage'));
const StaffScanPage     = lazy(() => import('@/pages/staff/StaffScanPage'));
const StaffBookingsPage = lazy(() => import('@/pages/staff/StaffBookingsPage'));
const StaffWalkInPage   = lazy(() => import('@/pages/staff/StaffWalkInPage'));

function PageFallback() {
    return (
        <div className="min-h-screen bg-[var(--gray-page)] px-4 pt-8 space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    );
}

function AppLayout() {
    const { pathname } = useLocation();
    const isStaff   = pathname.startsWith('/staff');
    const isPartner = pathname.startsWith('/partner');
    const isAdmin   = pathname.startsWith('/admin');

    return (
        <>
            <Suspense fallback={<PageFallback />}>
                <Routes>
                    {/* User app */}
                    <Route path="/"                                    element={<HomePage />} />
                    <Route path="/venues"                              element={<VenuesPage />} />
                    <Route path="/venues/:venueId"                     element={<SlotSelectorPage />} />
                    <Route path="/checkout"                            element={<CheckoutPage />} />
                    <Route path="/bookings"                            element={<MyBookingsPage />} />
                    <Route path="/bookings/:bookingId/confirmation"    element={<ConfirmationPage />} />

                    {/* Partner dashboard — no bottom nav */}
                    <Route path="/partner"            element={<PartnerDashboardPage />} />
                    <Route path="/partner/*"          element={<PartnerDashboardPage />} />

                    {/* Admin backoffice — no bottom nav */}
                    <Route path="/admin"              element={<AdminDashboardPage />} />
                    <Route path="/admin/*"            element={<AdminDashboardPage />} />

                    {/* Staff PWA — no bottom nav */}
                    <Route path="/staff"              element={<StaffHomePage />} />
                    <Route path="/staff/scan"          element={<StaffScanPage />} />
                    <Route path="/staff/bookings"      element={<StaffBookingsPage />} />
                    <Route path="/staff/walk-in"       element={<StaffWalkInPage />} />
                </Routes>
            </Suspense>
            {/* Bottom nav only for user app */}
            {!isStaff && !isPartner && !isAdmin && <BottomNav />}
        </>
    );
}

export function AppRouter() {
    return (
        <BrowserRouter>
            <AppLayout />
        </BrowserRouter>
    );
}
