import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingCard } from '@/features/bookings/components/BookingCard';
import { useCancelBooking, useMyBookings } from '@/features/bookings/hooks/useBookings';
import { Skeleton } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';

export default function MyBookingsPage() {
    const navigate = useNavigate();
    const { data: bookings = [], isLoading, isError, refetch } = useMyBookings();
    const cancelMutation = useCancelBooking();

    function handleCancel(id: number) {
        if (confirm('¿Cancelar esta reserva?')) {
            cancelMutation.mutate({ id, reason: 'user_request' });
        }
    }

    return (
        <main className="min-h-screen bg-[var(--gray-page)] px-4 pb-24">
            <header className="sticky top-0 bg-[var(--gray-page)] py-4">
                <h1 className="font-bold text-xl text-[var(--navy-deep)]">Mis reservas</h1>
            </header>

            {isLoading && (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
            )}

            {isError && <ErrorState onRetry={() => refetch()} />}

            {!isLoading && !isError && bookings.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-[var(--gray-secondary)] mb-4">No tienes reservas todavía.</p>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="text-[var(--navy-mid)] font-semibold text-sm underline"
                    >
                        Buscar canchas
                    </button>
                </div>
            )}

            {!isLoading && !isError && (
                <div className="space-y-3">
                    {bookings.map((booking) => (
                        <BookingCard
                            key={booking.id}
                            booking={booking}
                            onCancel={handleCancel}
                            onShowQR={(id) => navigate(`/bookings/${id}/qr`)}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}
