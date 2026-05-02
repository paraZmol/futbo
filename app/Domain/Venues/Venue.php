<?php

declare(strict_types=1);

namespace App\Domain\Venues;

use App\Domain\Shared\ValueObjects\UserId;
use App\Domain\Shared\ValueObjects\VenueId;

final class Venue
{
    private function __construct(
        public readonly VenueId $id,
        public readonly string $publicId,
        public readonly UserId $partnerId,
        public readonly string $name,
        public readonly string $slug,
        public readonly string $address,
        public readonly string $city,
        public readonly string $countryCode,
        public readonly float $lat,
        public readonly float $lng,
        private VenueStatus $status,
    ) {}

    public static function reconstitute(
        VenueId $id,
        string $publicId,
        UserId $partnerId,
        string $name,
        string $slug,
        string $address,
        string $city,
        string $countryCode,
        float $lat,
        float $lng,
        VenueStatus $status,
    ): self {
        return new self(
            $id, $publicId, $partnerId, $name, $slug,
            $address, $city, $countryCode, $lat, $lng, $status
        );
    }

    public function isActive(): bool
    {
        return $this->status === VenueStatus::Active;
    }

    public function status(): VenueStatus
    {
        return $this->status;
    }
}
