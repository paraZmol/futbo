<?php

declare(strict_types=1);

namespace Tests\Unit\Domain;

use App\Domain\Shared\Money;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class MoneyTest extends TestCase
{
    public function test_creates_from_cents(): void
    {
        $money = Money::pen(8000);
        $this->assertSame(8000, $money->amountCents());
        $this->assertSame('PEN', $money->currency());
        $this->assertSame('80.00', $money->toDecimal());
    }

    public function test_creates_from_decimal_string(): void
    {
        $money = Money::fromDecimal('80.00', 'PEN');
        $this->assertSame(8000, $money->amountCents());
    }

    public function test_add(): void
    {
        $a = Money::pen(3000);
        $b = Money::pen(5000);
        $this->assertSame(8000, $a->add($b)->amountCents());
    }

    public function test_subtract(): void
    {
        $a = Money::pen(8000);
        $b = Money::pen(2400);
        $this->assertSame(5600, $a->subtract($b)->amountCents());
    }

    public function test_cannot_subtract_resulting_in_negative(): void
    {
        $this->expectException(InvalidArgumentException::class);
        Money::pen(100)->subtract(Money::pen(200));
    }

    public function test_multiply_by_ratio(): void
    {
        $money = Money::pen(10000);
        $this->assertSame(3000, $money->multiplyByRatio(0.30)->amountCents());
    }

    public function test_cannot_create_negative(): void
    {
        $this->expectException(InvalidArgumentException::class);
        Money::of(-1, 'PEN');
    }

    public function test_currency_mismatch_throws(): void
    {
        $this->expectException(InvalidArgumentException::class);
        Money::pen(100)->add(Money::of(100, 'USD'));
    }

    public function test_equality(): void
    {
        $this->assertTrue(Money::pen(8000)->equals(Money::pen(8000)));
        $this->assertFalse(Money::pen(8000)->equals(Money::pen(8001)));
    }
}
