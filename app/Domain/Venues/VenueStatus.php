<?php

declare(strict_types=1);

namespace App\Domain\Venues;

enum VenueStatus: string
{
    case Pending   = 'pending';
    case Active    = 'active';
    case Suspended = 'suspended';
}
