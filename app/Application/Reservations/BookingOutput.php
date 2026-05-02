<?php

declare(strict_types=1);

namespace App\Application\Reservations;

use App\Domain\Reservations\Booking;

final readonly class BookingOutput
{
    public function __construct(
        public readonly int $id,
        public readonly string $publicId,
        public readonly string $status,
        public readonly string $priceTotal,
        public readonly string $depositAmount,
        public readonly string $balanceDue,
        public readonly string $currency,
        public readonly string $slotStartsAt,
        public readonly string $slotEndsAt,
        public readonly ?string $qrToken,
    ) {}

    public static function fromDomain(Booking $booking): self
    {
        return new self(
            id: $booking->id->value(),
            publicId: $booking->publicId,
            status: $booking->status()->value,
            priceTotal: $booking->priceTotal->toDecimal(),
            depositAmount: $booking->depositAmount->toDecimal(),
            balanceDue: $booking->balanceDue->toDecimal(),
            currency: $booking->priceTotal->currency(),
            slotStartsAt: $booking->slotStartsAt->format('Y-m-d\TH:i:s\Z'),
            slotEndsAt: $booking->slotEndsAt->format('Y-m-d\TH:i:s\Z'),
            qrToken: $booking->qrToken(),
        );
    }
}
