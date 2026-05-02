<?php

declare(strict_types=1);

namespace App\Application\CheckIn;

use App\Application\Shared\Clock;
use App\Application\Shared\TransactionManager;
use App\Domain\Reservations\BookingRepository;
use App\Domain\Reservations\Exceptions\BookingCheckInException;
use RuntimeException;

final readonly class ValidateQRCheckInUseCase
{
    public function __construct(
        private BookingRepository $bookings,
        private TransactionManager $tx,
        private Clock $clock,
    ) {}

    public function execute(ValidateQRCheckInInput $input): CheckInOutput
    {
        return $this->tx->run(function () use ($input) {
            $booking = $this->bookings->findByQrToken($input->qrToken);

            if ($booking === null) {
                throw new RuntimeException('QR token not found');
            }

            $booking->checkIn($this->clock->now());
            $this->bookings->save($booking);

            return new CheckInOutput(
                bookingPublicId: $booking->publicId,
                status: $booking->status()->value,
                balanceDue: $booking->balanceDue->toDecimal(),
                currency: $booking->balanceDue->currency(),
                slotStartsAt: $booking->slotStartsAt->format('Y-m-d\TH:i:s\Z'),
                slotEndsAt: $booking->slotEndsAt->format('Y-m-d\TH:i:s\Z'),
            );
        });
    }
}
