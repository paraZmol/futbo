<?php

declare(strict_types=1);

namespace App\Domain\Reservations\Exceptions;

use App\Domain\Shared\DomainException;
use App\Domain\Shared\ValueObjects\BookingId;

final class BookingAlreadyCancelledException extends DomainException
{
    public function __construct(BookingId $bookingId)
    {
        parent::__construct("Booking {$bookingId->value()} is already cancelled");
    }
}
