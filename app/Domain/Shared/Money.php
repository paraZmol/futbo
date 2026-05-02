<?php

declare(strict_types=1);

namespace App\Domain\Shared;

use InvalidArgumentException;

final class Money
{
    private function __construct(
        private readonly int $amountCents,
        private readonly string $currency,
    ) {}

    public static function of(int $amountCents, string $currency): self
    {
        if ($amountCents < 0) {
            throw new InvalidArgumentException("Money amount cannot be negative: {$amountCents}");
        }

        return new self($amountCents, strtoupper($currency));
    }

    public static function pen(int $amountCents): self
    {
        return new self($amountCents, 'PEN');
    }

    public static function fromDecimal(string $decimal, string $currency): self
    {
        $cents = (int) round((float) $decimal * 100);
        return new self($cents, strtoupper($currency));
    }

    public function amountCents(): int
    {
        return $this->amountCents;
    }

    public function toDecimal(): string
    {
        return number_format($this->amountCents / 100, 2, '.', '');
    }

    public function currency(): string
    {
        return $this->currency;
    }

    public function add(self $other): self
    {
        $this->assertSameCurrency($other);
        return new self($this->amountCents + $other->amountCents, $this->currency);
    }

    public function subtract(self $other): self
    {
        $this->assertSameCurrency($other);
        $result = $this->amountCents - $other->amountCents;
        if ($result < 0) {
            throw new InvalidArgumentException('Money subtraction resulted in negative amount');
        }
        return new self($result, $this->currency);
    }

    public function multiplyByRatio(float $ratio): self
    {
        return new self((int) round($this->amountCents * $ratio), $this->currency);
    }

    public function equals(self $other): bool
    {
        return $this->amountCents === $other->amountCents
            && $this->currency === $other->currency;
    }

    private function assertSameCurrency(self $other): void
    {
        if ($this->currency !== $other->currency) {
            throw new InvalidArgumentException(
                "Currency mismatch: {$this->currency} vs {$other->currency}"
            );
        }
    }
}
