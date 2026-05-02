<?php

declare(strict_types=1);

namespace App\Domain\Slots\Exceptions;

use App\Domain\Shared\DomainException;
use App\Domain\Shared\ValueObjects\SlotId;

final class SlotNotAvailableException extends DomainException
{
    public function __construct(SlotId $slotId)
    {
        parent::__construct("Slot {$slotId->value()} is not available for booking");
    }
}
