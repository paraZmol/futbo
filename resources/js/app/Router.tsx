import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Navbar } from '@/shared/components/Navbar';
import { Skeleton } from '@/shared/components/Skeleton';
import { registerServiceWorker } from './registerSW';

registerServiceWorker();

const HomePage            = lazy(() => import('@/pages/HomePage'));
const VenuesPage          = lazy(() => import('@/pages/VenuesPage'));
const VenueDetailPage     = lazy(() => import('@/pages/VenueDetailPage'));
const LoginPage           = lazy(() => import('@/pages/LoginPage'));
const RegisterPage        = lazy(() => import('@/pages/RegisterPage'));
const CheckoutPage        = lazy(() => import('@/pages/CheckoutPage'));
const ConfirmationPage    = lazy(() => import('@/pages/ConfirmationPage'));
const MyBookingsPage      = lazy(() => import('@/pages/MyBookingsPage'));
const PartnerDashboardPage = lazy(() => import('@/pages/partner/PartnerDashboardPage'));
const AdminDashboardPage   = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const StaffHomePage        = lazy(() => import('@/pages/staff/StaffHomePage'));
const StaffScanPage        = lazy(() => import('@/pages/staff/StaffScanPage'));
const StaffBookingsPage    = lazy(() => import('@/pages/staff/StaffBookingsPage'));
const StaffWalkInPage      = lazy(() => import('@/pages/staff/StaffWalkInPage'));

function PageFallback() {
    return (
        <div className="min-h-screen bg-gray-50 px-4 pt-8 space-y-4">
            <Skeleton className="h-8 w-1/2 rounded-xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
    );
}

function AppLayout() {
    const { pathname } = useLocation();
    const isStaff = pathname.startsWith('/staff');
    const isAuthPage = pathname === '/login' || pathname === '/register';

    return (
        <>
            {!isStaff && !isAuthPage && <Navbar />}
            <Suspense fallback={<PageFallback />}>
                <Routes>
                    <Route path="/"                                 element={<HomePage />} />
                    <Route path="/venues"                           element={<VenuesPage />} />
                    <Route path="/venues/:venueId"                  element={<VenueDetailPage />} />
                    <Route path="/login"                            element={<LoginPage />} />
                    <Route path="/register"                         element={<RegisterPage />} />
                    <Route path="/checkout"                         element={<CheckoutPage />} />
                    <Route path="/bookings"                         element={<MyBookingsPage />} />
                    <Route path="/bookings/:bookingId/confirmation" element={<ConfirmationPage />} />
                    <Route path="/partner"   element={<PartnerDashboardPage />} />
                    <Route path="/partner/*" element={<PartnerDashboardPage />} />
                    <Route path="/admin"     element={<AdminDashboardPage />} />
                    <Route path="/admin/*"   element={<AdminDashboardPage />} />
                    <Route path="/staff"          element={<StaffHomePage />} />
                    <Route path="/staff/scan"     element={<StaffScanPage />} />
                    <Route path="/staff/bookings" element={<StaffBookingsPage />} />
                    <Route path="/staff/walk-in"  element={<StaffWalkInPage />} />
                </Routes>
            </Suspense>
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
