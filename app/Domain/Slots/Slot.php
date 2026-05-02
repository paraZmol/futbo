<?php

declare(strict_types=1);

namespace App\Domain\Slots;

use App\Domain\Shared\Money;
use App\Domain\Shared\ValueObjects\BookingId;
use App\Domain\Shared\ValueObjects\FieldId;
use App\Domain\Shared\ValueObjects\SlotId;
use App\Domain\Slots\Exceptions\InvalidSlotTransitionException;
use App\Domain\Slots\Exceptions\SlotNotAvailableException;
use DateTimeImmutable;

final class Slot
{
    private function __construct(
        public readonly SlotId $id,
        public readonly FieldId $fieldId,
        public readonly DateTimeImmutable $startsAt,
        public readonly DateTimeImmutable $endsAt,
        public readonly Money $unitPrice,
        public readonly Money $depositAmount,
        private SlotStatus $status,
        private int $version,
        private ?DateTimeImmutable $lockExpiresAt,
    ) {}

    public static function create(
        SlotId $id,
        FieldId $fieldId,
        DateTimeImmutable $startsAt,
        DateTimeImmutable $endsAt,
        Money $unitPrice,
        Money $depositAmount,
    ): self {
        return new self(
            id: $id,
            fieldId: $fieldId,
            startsAt: $startsAt,
            endsAt: $endsAt,
            unitPrice: $unitPrice,
            depositAmount: $depositAmount,
            status: SlotStatus::Available,
            version: 0,
            lockExpiresAt: null,
        );
    }

    public static function reconstitute(
        SlotId $id,
        FieldId $fieldId,
        DateTimeImmutable $startsAt,
        DateTimeImmutable $endsAt,
        Money $unitPrice,
        Money $depositAmount,
        SlotStatus $status,
        int $version,
        ?DateTimeImmutable $lockExpiresAt,
    ): self {
        return new self($id, $fieldId, $startsAt, $endsAt, $unitPrice, $depositAmount, $status, $version, $lockExpiresAt);
    }

    public function holdForPayment(DateTimeImmutable $lockExpiresAt): void
    {
        if (!$this->status->canBeReserved()) {
            throw new SlotNotAvailableException($this->id);
        }

        $this->status = SlotStatus::PendingPayment;
        $this->lockExpiresAt = $lockExpiresAt;
        $this->version++;
    }

    public function confirmReservation(): void
    {
        if (!$this->status->canBeConfirmed()) {
            throw new InvalidSlotTransitionException($this->status, SlotStatus::Reserved);
        }

        $this->status = SlotStatus::Reserved;
        $this->lockExpiresAt = null;
        $this->version++;
    }

    public function release(): void
    {
        if (!$this->status->canBeReleased()) {
            throw new InvalidSlotTransitionException($this->status, SlotStatus::Available);
        }

        $this->status = SlotStatus::Available;
        $this->lockExpiresAt = null;
        $this->version++;
    }

    public function complete(): void
    {
        if (!$this->status->canBeCompleted()) {
            throw new InvalidSlotTransitionException($this->status, SlotStatus::Completed);
        }

        $this->status = SlotStatus::Completed;
        $this->version++;
    }

    public function expire(): void
    {
        $this->status = SlotStatus::Expired;
        $this->version++;
    }

    public function blockForEvent(): void
    {
        if ($this->status !== SlotStatus::Available) {
            throw new SlotNotAvailableException($this->id);
        }

        $this->status = SlotStatus::EventOccupied;
        $this->version++;
    }

    public function isExpiredLock(DateTimeImmutable $now): bool
    {
        return $this->status === SlotStatus::PendingPayment
            && $this->lockExpiresAt !== null
            && $this->lockExpiresAt < $now;
    }

    public function status(): SlotStatus
    {
        return $this->status;
    }

    public function version(): int
    {
        return $this->version;
    }

    public function lockExpiresAt(): ?DateTimeImmutable
    {
        return $this->lockExpiresAt;
    }
}
