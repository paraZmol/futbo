<?php

declare(strict_types=1);

namespace App\Domain\Shared\ValueObjects;

final readonly class ShiftId
{
    private function __construct(private int $value) {}

    public static function from(int $value): self
    {
        return new self($value);
    }

    public function value(): int
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }
}
