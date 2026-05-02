<?php

declare(strict_types=1);

namespace App\Domain\Reservations\Exceptions;

use App\Domain\Shared\DomainException;
use App\Domain\Shared\ValueObjects\BookingId;

final class BookingCheckInException extends DomainException
{
    public function __construct(BookingId $bookingId, string $reason)
    {
        parent::__construct("Cannot check in booking {$bookingId->value()}: {$reason}");
    }
}
