<?php

declare(strict_types=1);

namespace App\Infrastructure\Time;

use App\Application\Shared\Clock;
use DateTimeImmutable;

final readonly class SystemClock implements Clock
{
    public function now(): DateTimeImmutable
    {
        return new DateTimeImmutable('now', new \DateTimeZone('UTC'));
    }
}
