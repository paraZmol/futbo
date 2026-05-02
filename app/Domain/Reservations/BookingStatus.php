<?php

declare(strict_types=1);

namespace App\Domain\Reservations;

enum BookingStatus: string
{
    case PendingPayment = 'pending_payment';
    case Reserved       = 'reserved';
    case CheckedIn      = 'checked_in';
    case Completed      = 'completed';
    case NoShow         = 'no_show';
    case Cancelled      = 'cancelled';
    case Refunded       = 'refunded';

    public function isPendingPayment(): bool
    {
        return $this === self::PendingPayment;
    }

    public function isReserved(): bool
    {
        return $this === self::Reserved;
    }

    public function isCancellable(): bool
    {
        return in_array($this, [self::PendingPayment, self::Reserved], true);
    }

    public function isTerminal(): bool
    {
        return in_array($this, [self::Completed, self::NoShow, self::Cancelled, self::Refunded], true);
    }
}
