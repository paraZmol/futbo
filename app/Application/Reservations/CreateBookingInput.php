<?php

declare(strict_types=1);

namespace App\Application\Reservations;

use App\Domain\Reservations\BookingSource;
use App\Domain\Shared\ValueObjects\UserId;
use App\Domain\Shared\ValueObjects\VenueId;
use App\Domain\Shared\ValueObjects\FieldId;

final readonly class CreateBookingInput
{
    /**
     * @param int[] $slotIds
     */
    public function __construct(
        public readonly ?UserId $userId,
        public readonly VenueId $venueId,
        public readonly FieldId $fieldId,
        public readonly array $slotIds,
        public readonly string $idempotencyKey,
        public readonly BookingSource $source,
    ) {}
}
