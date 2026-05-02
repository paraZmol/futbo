<?php

declare(strict_types=1);

namespace Tests\Doubles;

use App\Domain\Reservations\Booking;
use App\Domain\Reservations\BookingRepository;
use App\Domain\Reservations\BookingStatus;
use App\Domain\Shared\ValueObjects\BookingId;
use App\Domain\Shared\ValueObjects\UserId;
use RuntimeException;

final class InMemoryBookingRepository implements BookingRepository
{
    /** @var array<int, Booking> */
    private array $bookings = [];

    /** @var array<string, int> idempotencyKey => bookingId */
    private array $byIdempotency = [];

    /** @var array<string, int> qrToken => bookingId */
    private array $byQrToken = [];

    /** @var array<int, array<int, string>> bookingId => [slotId => unitPrice] */
    private array $bookingSlots = [];

    private int $nextId = 1;

    public function findOrFail(BookingId $id): Booking
    {
        return $this->bookings[$id->value()] ?? throw new RuntimeException("Booking {$id->value()} not found");
    }

    public function findByIdempotencyKey(string $key): ?Booking
    {
        $id = $this->byIdempotency[$key] ?? null;
        return $id !== null ? ($this->bookings[$id] ?? null) : null;
    }

    public function findByQrToken(string $qrToken): ?Booking
    {
        $id = $this->byQrToken[$qrToken] ?? null;
        return $id !== null ? ($this->bookings[$id] ?? null) : null;
    }

    public function findByUser(UserId $userId, ?BookingStatus $status = null): array
    {
        return array_values(array_filter(
            $this->bookings,
            fn(Booking $b) => $b->userId?->equals($userId)
                && ($status === null || $b->status() === $status)
        ));
    }

    public function save(Booking $booking): void
    {
        // readonly properties cannot be mutated — reconstitute with real ID on first save
        if ($booking->id->value() === 0) {
            $newId = $this->nextId++;
            $booking = Booking::reconstitute(
                id: \App\Domain\Shared\ValueObjects\BookingId::from($newId),
                publicId: $booking->publicId,
                userId: $booking->userId,
                venueId: $booking->venueId,
                fieldId: $booking->fieldId,
                idempotencyKey: $booking->idempotencyKey,
                slotStartsAt: $booking->slotStartsAt,
                slotEndsAt: $booking->slotEndsAt,
                priceTotal: $booking->priceTotal,
                depositAmount: $booking->depositAmount,
                balanceDue: $booking->balanceDue,
                source: $booking->source,
                status: $booking->status(),
                version: $booking->version(),
                qrToken: $booking->qrToken(),
                checkedInAt: $booking->checkedInAt(),
                noShowAt: $booking->noShowAt(),
                cancelledAt: $booking->cancelledAt(),
                cancellationReason: $booking->cancellationReason(),
            );
        }

        $id = $booking->id->value();
        $this->bookings[$id] = $booking;
        $this->byIdempotency[$booking->idempotencyKey] = $id;

        if ($booking->qrToken() !== null) {
            $this->byQrToken[$booking->qrToken()] = $id;
        }
    }

    public function linkSlot(BookingId $bookingId, int $slotId, string $unitPriceSnapshot): void
    {
        $this->bookingSlots[$bookingId->value()][$slotId] = $unitPriceSnapshot;
    }

    public function getLinkedSlots(BookingId $bookingId): array
    {
        return $this->bookingSlots[$bookingId->value()] ?? [];
    }
}
