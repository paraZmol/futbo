<?php

declare(strict_types=1);

namespace App\Domain\Reservations;

use App\Domain\Shared\ValueObjects\BookingId;
use App\Domain\Shared\ValueObjects\UserId;

interface BookingRepository
{
    public function findOrFail(BookingId $id): Booking;

    public function findByIdempotencyKey(string $key): ?Booking;

    public function findByQrToken(string $qrToken): ?Booking;

    /** @return Booking[] */
    public function findByUser(UserId $userId, ?BookingStatus $status = null): array;

    /** Returns the persisted BookingId (may differ from input when ID was 0 on first insert). */
    public function save(Booking $booking): BookingId;

    public function linkSlot(BookingId $bookingId, int $slotId, string $unitPriceSnapshot): void;
}
