<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Reservations\Booking;
use App\Domain\Reservations\BookingRepository;
use App\Domain\Reservations\BookingSource;
use App\Domain\Reservations\BookingStatus;
use App\Domain\Shared\Money;
use App\Domain\Shared\ValueObjects\BookingId;
use App\Domain\Shared\ValueObjects\FieldId;
use App\Domain\Shared\ValueObjects\UserId;
use App\Domain\Shared\ValueObjects\VenueId;
use App\Infrastructure\Persistence\Eloquent\Models\BookingModel;
use App\Infrastructure\Persistence\Eloquent\Models\BookingSlotModel;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final readonly class EloquentBookingRepository implements BookingRepository
{
    public function findOrFail(BookingId $id): Booking
    {
        $model = BookingModel::findOrFail($id->value());
        return $this->toDomain($model);
    }

    public function findByIdempotencyKey(string $key): ?Booking
    {
        $model = BookingModel::where('idempotency_key', $key)->first();
        return $model ? $this->toDomain($model) : null;
    }

    public function findByQrToken(string $qrToken): ?Booking
    {
        $model = BookingModel::where('qr_token', $qrToken)->first();
        return $model ? $this->toDomain($model) : null;
    }

    public function findByUser(UserId $userId, ?BookingStatus $status = null): array
    {
        $query = BookingModel::where('user_id', $userId->value());
        if ($status !== null) {
            $query->where('status', $status->value);
        }
        return $query->orderByDesc('created_at')
            ->get()
            ->map(fn(BookingModel $m) => $this->toDomain($m))
            ->all();
    }

    public function save(Booking $booking): BookingId
    {
        $data = [
            'public_id'           => $booking->publicId,
            'user_id'             => $booking->userId?->value(),
            'venue_id'            => $booking->venueId->value(),
            'field_id'            => $booking->fieldId->value(),
            'idempotency_key'     => $booking->idempotencyKey,
            'slot_starts_at'      => $booking->slotStartsAt->format('Y-m-d H:i:s'),
            'slot_ends_at'        => $booking->slotEndsAt->format('Y-m-d H:i:s'),
            'price_total'         => $booking->priceTotal->toDecimal(),
            'deposit_amount'      => $booking->depositAmount->toDecimal(),
            'balance_due'         => $booking->balanceDue->toDecimal(),
            'currency'            => $booking->priceTotal->currency(),
            'status'              => $booking->status()->value,
            'source'              => $booking->source->value,
            'qr_token'            => $booking->qrToken(),
            'cancellation_reason' => $booking->cancellationReason(),
            'checked_in_at'       => $booking->checkedInAt()?->format('Y-m-d H:i:s'),
            'no_show_at'          => $booking->noShowAt()?->format('Y-m-d H:i:s'),
            'cancelled_at'        => $booking->cancelledAt()?->format('Y-m-d H:i:s'),
            'version'             => $booking->version(),
        ];

        if ($booking->id->value() === 0) {
            $model = BookingModel::create($data);
            return BookingId::from($model->id);
        }

        $affected = DB::table('bookings')
            ->where('id', $booking->id->value())
            ->where('version', $booking->version() - 1)
            ->update($data + ['updated_at' => now()]);

        if ($affected === 0) {
            throw new RuntimeException("Booking {$booking->id->value()} concurrent update conflict");
        }

        return $booking->id;
    }

    public function linkSlot(BookingId $bookingId, int $slotId, string $unitPriceSnapshot): void
    {
        BookingSlotModel::create([
            'booking_id'         => $bookingId->value(),
            'slot_id'            => $slotId,
            'unit_price_snapshot' => $unitPriceSnapshot,
        ]);
    }

    private function toDomain(BookingModel $model): Booking
    {
        return Booking::reconstitute(
            id: BookingId::from($model->id),
            publicId: $model->public_id,
            userId: $model->user_id ? UserId::from($model->user_id) : null,
            venueId: VenueId::from($model->venue_id),
            fieldId: FieldId::from($model->field_id),
            idempotencyKey: $model->idempotency_key,
            slotStartsAt: new DateTimeImmutable($model->slot_starts_at->toDateTimeString()),
            slotEndsAt: new DateTimeImmutable($model->slot_ends_at->toDateTimeString()),
            priceTotal: Money::fromDecimal((string) $model->price_total, $model->currency),
            depositAmount: Money::fromDecimal((string) $model->deposit_amount, $model->currency),
            balanceDue: Money::fromDecimal((string) $model->balance_due, $model->currency),
            source: BookingSource::from($model->source),
            status: BookingStatus::from($model->status),
            version: $model->version,
            qrToken: $model->qr_token,
            checkedInAt: $model->checked_in_at
                ? new DateTimeImmutable($model->checked_in_at->toDateTimeString()) : null,
            noShowAt: $model->no_show_at
                ? new DateTimeImmutable($model->no_show_at->toDateTimeString()) : null,
            cancelledAt: $model->cancelled_at
                ? new DateTimeImmutable($model->cancelled_at->toDateTimeString()) : null,
            cancellationReason: $model->cancellation_reason,
        );
    }
}
