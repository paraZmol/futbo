<?php

declare(strict_types=1);

namespace App\Application\Reservations;

use App\Application\Shared\TransactionManager;
use App\Domain\Reservations\BookingRepository;
use App\Domain\Shared\ValueObjects\BookingId;
use App\Domain\Shared\ValueObjects\SlotId;
use App\Domain\Slots\SlotRepository;

final readonly class ConfirmBookingPaymentUseCase
{
    public function __construct(
        private BookingRepository $bookings,
        private SlotRepository $slots,
        private TransactionManager $tx,
    ) {}

    public function execute(BookingId $bookingId): void
    {
        $this->tx->run(function () use ($bookingId) {
            $booking = $this->bookings->findOrFail($bookingId);

            // Idempotent: if already reserved, do nothing
            if ($booking->status()->isReserved()) {
                return;
            }

            $booking->confirmPayment();
            $this->bookings->save($booking);
        });
    }
}
