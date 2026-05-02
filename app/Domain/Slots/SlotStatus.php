<?php

declare(strict_types=1);

namespace App\Domain\Slots;

enum SlotStatus: string
{
    case Available      = 'available';
    case PendingPayment = 'pending_payment';
    case Reserved       = 'reserved';
    case EventOccupied  = 'event_occupied';
    case Completed      = 'completed';
    case Expired        = 'expired';

    public function isAvailable(): bool
    {
        return $this === self::Available;
    }

    public function canBeReserved(): bool
    {
        return $this === self::Available;
    }

    public function canBeConfirmed(): bool
    {
        return $this === self::PendingPayment;
    }

    public function canBeReleased(): bool
    {
        return $this === self::PendingPayment;
    }

    public function canBeCompleted(): bool
    {
        return $this === self::Reserved;
    }
}
