<?php

declare(strict_types=1);

namespace App\Domain\Reservations\Exceptions;

use App\Domain\Shared\DomainException;
use App\Domain\Shared\ValueObjects\BookingId;
use App\Domain\Reservations\BookingStatus;

final class BookingNotCancellableException extends DomainException
{
    public function __construct(BookingId $bookingId, BookingStatus $currentStatus)
    {
        parent::__construct(
            "Booking {$bookingId->value()} cannot be cancelled from status '{$currentStatus->value}'"
        );
    }
}
