<?php

declare(strict_types=1);

namespace App\Domain\Slots\Exceptions;

use App\Domain\Shared\DomainException;
use App\Domain\Slots\SlotStatus;

final class InvalidSlotTransitionException extends DomainException
{
    public function __construct(SlotStatus $from, SlotStatus $to)
    {
        parent::__construct("Invalid slot transition: {$from->value} → {$to->value}");
    }
}
