<?php

declare(strict_types=1);

namespace App\Application\CheckIn;

final readonly class CheckInOutput
{
    public function __construct(
        public readonly string $bookingPublicId,
        public readonly string $status,
        public readonly string $balanceDue,
        public readonly string $currency,
        public readonly string $slotStartsAt,
        public readonly string $slotEndsAt,
    ) {}
}
