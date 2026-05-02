<?php

declare(strict_types=1);

namespace App\Application\CheckIn;

use App\Domain\Shared\ValueObjects\UserId;

final readonly class ValidateQRCheckInInput
{
    public function __construct(
        public readonly string $qrToken,
        public readonly UserId $staffId,
    ) {}
}
