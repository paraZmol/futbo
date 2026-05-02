<?php

declare(strict_types=1);

namespace App\Domain\Reservations;

enum BookingSource: string
{
    case App     = 'app';
    case Web     = 'web';
    case WalkIn  = 'walk_in';
}
