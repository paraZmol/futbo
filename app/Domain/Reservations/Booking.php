<?php

declare(strict_types=1);

namespace App\Domain\Reservations;

use App\Domain\Reservations\Exceptions\BookingAlreadyCancelledException;
use App\Domain\Reservations\Exceptions\BookingCheckInException;
use App\Domain\Reservations\Exceptions\BookingNotCancellableException;
use App\Domain\Reservations\Exceptions\InvalidBookingPaymentStateException;
use App\Domain\Shared\Money;
use App\Domain\Shared\ValueObjects\BookingId;
use App\Domain\Shared\ValueObjects\FieldId;
use App\Domain\Shared\ValueObjects\UserId;
use App\Domain\Shared\ValueObjects\VenueId;
use DateTimeImmutable;

final class Booking
{
    private function __construct(
        public readonly BookingId $id,
        public readonly string $publicId,
        public readonly ?UserId $userId,
        public readonly VenueId $venueId,
        public readonly FieldId $fieldId,
        public readonly string $idempotencyKey,
        public readonly DateTimeImmutable $slotStartsAt,
        public readonly DateTimeImmutable $slotEndsAt,
        public readonly Money $priceTotal,
        public readonly Money $depositAmount,
        public readonly Money $balanceDue,
        public readonly BookingSource $source,
        private BookingStatus $status,
        private int $version,
        private ?string $qrToken,
        private ?DateTimeImmutable $checkedInAt,
        private ?DateTimeImmutable $noShowAt,
        private ?DateTimeImmutable $cancelledAt,
        private ?string $cancellationReason,
    ) {}

    public static function create(
        BookingId $id,
        string $publicId,
        ?UserId $userId,
        VenueId $venueId,
        FieldId $fieldId,
        string $idempotencyKey,
        DateTimeImmutable $slotStartsAt,
        DateTimeImmutable $slotEndsAt,
        Money $priceTotal,
        Money $depositAmount,
        Money $balanceDue,
        BookingSource $source,
        string $qrToken,
    ): self {
        return new self(
            id: $id,
            publicId: $publicId,
            userId: $userId,
            venueId: $venueId,
            fieldId: $fieldId,
            idempotencyKey: $idempotencyKey,
            slotStartsAt: $slotStartsAt,
            slotEndsAt: $slotEndsAt,
            priceTotal: $priceTotal,
            depositAmount: $depositAmount,
            balanceDue: $balanceDue,
            source: $source,
            status: BookingStatus::PendingPayment,
            version: 0,
            qrToken: $qrToken,
            checkedInAt: null,
            noShowAt: null,
            cancelledAt: null,
            cancellationReason: null,
        );
    }

    public static function reconstitute(
        BookingId $id,
        string $publicId,
        ?UserId $userId,
        VenueId $venueId,
        FieldId $fieldId,
        string $idempotencyKey,
        DateTimeImmutable $slotStartsAt,
        DateTimeImmutable $slotEndsAt,
        Money $priceTotal,
        Money $depositAmount,
        Money $balanceDue,
        BookingSource $source,
        BookingStatus $status,
        int $version,
        ?string $qrToken,
        ?DateTimeImmutable $checkedInAt,
        ?DateTimeImmutable $noShowAt,
        ?DateTimeImmutable $cancelledAt,
        ?string $cancellationReason,
    ): self {
        return new self(
            $id, $publicId, $userId, $venueId, $fieldId, $idempotencyKey,
            $slotStartsAt, $slotEndsAt, $priceTotal, $depositAmount, $balanceDue,
            $source, $status, $version, $qrToken, $checkedInAt, $noShowAt,
            $cancelledAt, $cancellationReason,
        );
    }

    public function confirmPayment(): void
    {
        if ($this->status === BookingStatus::Reserved) {
            return; // idempotente: ya confirmado
        }

        if (!$this->status->isPendingPayment()) {
            throw new InvalidBookingPaymentStateException($this->id, $this->status);
        }

        $this->status = BookingStatus::Reserved;
        $this->version++;
    }

    public function checkIn(DateTimeImmutable $now): void
    {
        if (!$this->status->isReserved()) {
            throw new BookingCheckInException($this->id, "status is '{$this->status->value}'");
        }

        $windowStart = $this->slotStartsAt->modify('-15 minutes');
        if ($now < $windowStart) {
            throw new BookingCheckInException($this->id, 'too early — check-in opens 15 min before slot');
        }

        $this->status = BookingStatus::CheckedIn;
        $this->checkedInAt = $now;
        $this->version++;
    }

    public function markNoShow(DateTimeImmutable $now): void
    {
        if (!$this->status->isReserved()) {
            throw new BookingCheckInException($this->id, "cannot mark no-show from status '{$this->status->value}'");
        }

        $noShowWindow = $this->slotStartsAt->modify('+15 minutes');
        if ($now < $noShowWindow) {
            throw new BookingCheckInException($this->id, 'no-show window opens 15 min after slot start');
        }

        $this->status = BookingStatus::NoShow;
        $this->noShowAt = $now;
        $this->version++;
    }

    public function cancel(DateTimeImmutable $now, string $reason): void
    {
        if ($this->status === BookingStatus::Cancelled) {
            throw new BookingAlreadyCancelledException($this->id);
        }

        if (!$this->status->isCancellable()) {
            throw new BookingNotCancellableException($this->id, $this->status);
        }

        $this->status = BookingStatus::Cancelled;
        $this->cancelledAt = $now;
        $this->cancellationReason = $reason;
        $this->version++;
    }

    public function complete(): void
    {
        $this->status = BookingStatus::Completed;
        $this->version++;
    }

    public function status(): BookingStatus
    {
        return $this->status;
    }

    public function version(): int
    {
        return $this->version;
    }

    public function qrToken(): ?string
    {
        return $this->qrToken;
    }

    public function checkedInAt(): ?DateTimeImmutable
    {
        return $this->checkedInAt;
    }

    public function noShowAt(): ?DateTimeImmutable
    {
        return $this->noShowAt;
    }

    public function cancelledAt(): ?DateTimeImmutable
    {
        return $this->cancelledAt;
    }

    public function cancellationReason(): ?string
    {
        return $this->cancellationReason;
    }
}
