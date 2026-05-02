<?php

declare(strict_types=1);

namespace App\Domain\Shifts;

use App\Domain\Shared\Money;
use App\Domain\Shared\ValueObjects\ShiftId;
use App\Domain\Shared\ValueObjects\UserId;
use App\Domain\Shared\ValueObjects\VenueId;
use App\Domain\Shifts\Exceptions\ShiftAlreadyOpenException;
use DateTimeImmutable;
use InvalidArgumentException;

final class Shift
{
    private function __construct(
        public readonly ShiftId $id,
        public readonly VenueId $venueId,
        public readonly UserId $staffId,
        public readonly DateTimeImmutable $openedAt,
        private ShiftStatus $status,
        private ?DateTimeImmutable $closedAt,
        private Money $cashExpected,
        private ?Money $cashDelivered,
        private ?Money $cashVariance,
        private ?string $closingNotes,
    ) {}

    public static function open(
        ShiftId $id,
        VenueId $venueId,
        UserId $staffId,
        DateTimeImmutable $now,
    ): self {
        return new self(
            id: $id,
            venueId: $venueId,
            staffId: $staffId,
            openedAt: $now,
            status: ShiftStatus::Open,
            closedAt: null,
            cashExpected: Money::pen(0),
            cashDelivered: null,
            cashVariance: null,
            closingNotes: null,
        );
    }

    public static function reconstitute(
        ShiftId $id,
        VenueId $venueId,
        UserId $staffId,
        DateTimeImmutable $openedAt,
        ShiftStatus $status,
        ?DateTimeImmutable $closedAt,
        Money $cashExpected,
        ?Money $cashDelivered,
        ?Money $cashVariance,
        ?string $closingNotes,
    ): self {
        return new self(
            $id, $venueId, $staffId, $openedAt, $status,
            $closedAt, $cashExpected, $cashDelivered, $cashVariance, $closingNotes
        );
    }

    public function close(
        Money $cashDelivered,
        Money $cashExpected,
        DateTimeImmutable $now,
        ?string $notes,
    ): void {
        if ($this->status === ShiftStatus::Closed) {
            throw new InvalidArgumentException("Shift {$this->id->value()} is already closed");
        }

        $varianceCents = $cashDelivered->amountCents() - $cashExpected->amountCents();
        $variance = Money::pen(abs($varianceCents));

        $this->status = ShiftStatus::Closed;
        $this->closedAt = $now;
        $this->cashExpected = $cashExpected;
        $this->cashDelivered = $cashDelivered;
        $this->cashVariance = $varianceCents >= 0 ? $variance : Money::pen(-$varianceCents);
        $this->closingNotes = $notes;
    }

    public function isOpen(): bool
    {
        return $this->status === ShiftStatus::Open;
    }

    public function status(): ShiftStatus
    {
        return $this->status;
    }

    public function closedAt(): ?DateTimeImmutable
    {
        return $this->closedAt;
    }

    public function cashExpected(): Money
    {
        return $this->cashExpected;
    }

    public function cashDelivered(): ?Money
    {
        return $this->cashDelivered;
    }

    public function cashVariance(): ?Money
    {
        return $this->cashVariance;
    }

    public function closingNotes(): ?string
    {
        return $this->closingNotes;
    }
}
