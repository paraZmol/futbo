<?php

declare(strict_types=1);

namespace App\Domain\Reservations\Exceptions;

use App\Domain\Shared\DomainException;
use App\Domain\Shared\ValueObjects\BookingId;
use App\Domain\Reservations\BookingStatus;

final class InvalidBookingPaymentStateException extends DomainException
{
    public function __construct(BookingId $bookingId, BookingStatus $currentStatus)
    {
        parent::__construct(
            "Cannot confirm payment for booking {$bookingId->value()} in status '{$currentStatus->value}'"
        );
    }
}
