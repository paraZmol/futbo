<?php

declare(strict_types=1);

namespace App\Application\WalkIn;

use App\Domain\Shared\ValueObjects\FieldId;
use App\Domain\Shared\ValueObjects\UserId;
use App\Domain\Shared\ValueObjects\VenueId;

final readonly class CreateWalkInInput
{
    /**
     * @param int[] $slotIds
     */
    public function __construct(
        public readonly VenueId $venueId,
        public readonly FieldId $fieldId,
        public readonly array $slotIds,
        public readonly string $idempotencyKey,
        public readonly UserId $staffId,
    ) {}
}
