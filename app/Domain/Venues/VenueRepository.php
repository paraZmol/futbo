<?php

declare(strict_types=1);

namespace App\Domain\Venues;

use App\Domain\Shared\ValueObjects\VenueId;

interface VenueRepository
{
    public function findOrFail(VenueId $id): Venue;

    public function save(Venue $venue): void;
}
