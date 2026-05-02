<?php

declare(strict_types=1);

namespace App\Application\Reservations;

use App\Application\Shared\Clock;
use App\Application\Shared\TransactionManager;
use App\Domain\Reservations\BookingRepository;
use App\Domain\Shared\ValueObjects\BookingId;
use App\Domain\Slots\SlotRepository;
use App\Domain\Slots\SlotStatus;
use App\Domain\Shared\ValueObjects\SlotId;

final readonly class CancelBookingUseCase
{
    public function __construct(
        private BookingRepository $bookings,
        private SlotRepository $slots,
        private TransactionManager $tx,
        private Clock $clock,
    ) {}

    public function execute(BookingId $bookingId, string $reason): void
    {
        $this->tx->run(function () use ($bookingId, $reason) {
            $now = $this->clock->now();
            $booking = $this->bookings->findOrFail($bookingId);

            $booking->cancel($now, $reason);
            $this->bookings->save($booking);
        });
    }
}
