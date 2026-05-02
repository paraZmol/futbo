<?php

declare(strict_types=1);

namespace App\Application\CheckIn;

use App\Application\Shared\Clock;
use App\Application\Shared\TransactionManager;
use App\Domain\Reservations\BookingRepository;
use App\Domain\Shared\ValueObjects\BookingId;

final readonly class MarkNoShowUseCase
{
    public function __construct(
        private BookingRepository $bookings,
        private TransactionManager $tx,
        private Clock $clock,
    ) {}

    public function execute(BookingId $bookingId): void
    {
        $this->tx->run(function () use ($bookingId) {
            $booking = $this->bookings->findOrFail($bookingId);
            $booking->markNoShow($this->clock->now());
            $this->bookings->save($booking);
        });
    }
}
