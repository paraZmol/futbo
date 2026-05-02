<?php

declare(strict_types=1);

namespace Tests\Unit\Domain;

use App\Domain\Shared\Money;
use App\Domain\Shared\ValueObjects\FieldId;
use App\Domain\Shared\ValueObjects\SlotId;
use App\Domain\Slots\Exceptions\InvalidSlotTransitionException;
use App\Domain\Slots\Exceptions\SlotNotAvailableException;
use App\Domain\Slots\Slot;
use App\Domain\Slots\SlotStatus;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

final class SlotTest extends TestCase
{
    public function test_new_slot_is_available(): void
    {
        $slot = $this->makeSlot();
        $this->assertSame(SlotStatus::Available, $slot->status());
    }

    public function test_available_slot_can_be_held_for_payment(): void
    {
        $slot = $this->makeSlot();
        $lockExpires = new DateTimeImmutable('+10 minutes');

        $slot->holdForPayment($lockExpires);

        $this->assertSame(SlotStatus::PendingPayment, $slot->status());
        $this->assertSame($lockExpires, $slot->lockExpiresAt());
        $this->assertSame(1, $slot->version());
    }

    public function test_pending_slot_can_be_confirmed(): void
    {
        $slot = $this->makeSlot();
        $slot->holdForPayment(new DateTimeImmutable('+10 minutes'));

        $slot->confirmReservation();

        $this->assertSame(SlotStatus::Reserved, $slot->status());
        $this->assertNull($slot->lockExpiresAt());
        $this->assertSame(2, $slot->version());
    }

    public function test_pending_slot_can_be_released(): void
    {
        $slot = $this->makeSlot();
        $slot->holdForPayment(new DateTimeImmutable('+10 minutes'));

        $slot->release();

        $this->assertSame(SlotStatus::Available, $slot->status());
        $this->assertNull($slot->lockExpiresAt());
    }

    public function test_reserved_slot_can_be_completed(): void
    {
        $slot = $this->makeSlot();
        $slot->holdForPayment(new DateTimeImmutable('+10 minutes'));
        $slot->confirmReservation();

        $slot->complete();

        $this->assertSame(SlotStatus::Completed, $slot->status());
    }

    public function test_cannot_hold_non_available_slot(): void
    {
        $slot = $this->makeSlot();
        $slot->holdForPayment(new DateTimeImmutable('+10 minutes'));

        $this->expectException(SlotNotAvailableException::class);
        $slot->holdForPayment(new DateTimeImmutable('+10 minutes'));
    }

    public function test_cannot_confirm_available_slot(): void
    {
        $slot = $this->makeSlot();

        $this->expectException(InvalidSlotTransitionException::class);
        $slot->confirmReservation();
    }

    public function test_cannot_release_reserved_slot(): void
    {
        $slot = $this->makeSlot();
        $slot->holdForPayment(new DateTimeImmutable('+10 minutes'));
        $slot->confirmReservation();

        $this->expectException(InvalidSlotTransitionException::class);
        $slot->release();
    }

    public function test_detects_expired_lock(): void
    {
        $slot = $this->makeSlot();
        $past = new DateTimeImmutable('-1 second');
        $slot->holdForPayment($past);

        $this->assertTrue($slot->isExpiredLock(new DateTimeImmutable()));
    }

    public function test_available_slot_lock_is_not_expired(): void
    {
        $slot = $this->makeSlot();

        $this->assertFalse($slot->isExpiredLock(new DateTimeImmutable()));
    }

    private function makeSlot(): Slot
    {
        return Slot::create(
            id: SlotId::from(1),
            fieldId: FieldId::from(1),
            startsAt: new DateTimeImmutable('2026-06-01 10:00:00'),
            endsAt: new DateTimeImmutable('2026-06-01 11:00:00'),
            unitPrice: Money::pen(8000),
            depositAmount: Money::pen(2400),
        );
    }
}
