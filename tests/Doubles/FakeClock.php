<?php

declare(strict_types=1);

namespace Tests\Doubles;

use App\Application\Shared\Clock;
use DateTimeImmutable;

final class FakeClock implements Clock
{
    private DateTimeImmutable $now;

    public function __construct(string $datetime = '2026-06-01 10:00:00')
    {
        $this->now = new DateTimeImmutable($datetime);
    }

    public static function at(string $datetime): self
    {
        return new self($datetime);
    }

    public function now(): DateTimeImmutable
    {
        return $this->now;
    }

    public function advanceSeconds(int $seconds): void
    {
        $this->now = $this->now->modify("+{$seconds} seconds");
    }
}
