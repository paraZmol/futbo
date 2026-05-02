<?php

declare(strict_types=1);

namespace App\Domain\Shifts\Exceptions;

use App\Domain\Shared\DomainException;
use App\Domain\Shared\ValueObjects\UserId;
use App\Domain\Shared\ValueObjects\VenueId;

final class ShiftAlreadyOpenException extends DomainException
{
    public function __construct(UserId $staffId, VenueId $venueId)
    {
        parent::__construct(
            "Staff {$staffId->value()} already has an open shift at venue {$venueId->value()}"
        );
    }
}
