<?php

declare(strict_types=1);

namespace App\Domain\Shifts;

use App\Domain\Shared\ValueObjects\ShiftId;
use App\Domain\Shared\ValueObjects\UserId;
use App\Domain\Shared\ValueObjects\VenueId;

interface ShiftRepository
{
    public function findOrFail(ShiftId $id): Shift;

    public function findOpenByStaffAndVenue(UserId $staffId, VenueId $venueId): ?Shift;

    public function save(Shift $shift): void;
}
