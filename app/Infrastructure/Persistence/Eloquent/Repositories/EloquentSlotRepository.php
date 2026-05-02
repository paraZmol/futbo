<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Shared\Money;
use App\Domain\Shared\ValueObjects\FieldId;
use App\Domain\Shared\ValueObjects\SlotId;
use App\Domain\Slots\Exceptions\SlotConcurrentlyModifiedException;
use App\Domain\Slots\Slot;
use App\Domain\Slots\SlotRepository;
use App\Domain\Slots\SlotStatus;
use App\Infrastructure\Persistence\Eloquent\Models\SlotModel;
use DateTimeImmutable;
use RuntimeException;
use Illuminate\Support\Facades\DB;

final readonly class EloquentSlotRepository implements SlotRepository
{
    public function findOrFail(SlotId $id): Slot
    {
        $model = SlotModel::findOrFail($id->value());
        return $this->toDomain($model);
    }

    public function findAvailableByField(FieldId $fieldId, DateTimeImmutable $from, DateTimeImmutable $to): array
    {
        return SlotModel::where('field_id', $fieldId->value())
            ->where('state', SlotStatus::Available->value)
            ->whereBetween('starts_at', [$from->format('Y-m-d H:i:s'), $to->format('Y-m-d H:i:s')])
            ->orderBy('starts_at')
            ->get()
            ->map(fn(SlotModel $m) => $this->toDomain($m))
            ->all();
    }

    public function findExpiredLocksBefore(DateTimeImmutable $before): array
    {
        return SlotModel::where('state', SlotStatus::PendingPayment->value)
            ->where('lock_expires_at', '<', $before->format('Y-m-d H:i:s'))
            ->get()
            ->map(fn(SlotModel $m) => $this->toDomain($m))
            ->all();
    }

    public function save(Slot $slot): void
    {
        // Optimistic locking: UPDATE only if version matches expected (current - 1)
        $affected = DB::table('slots')
            ->where('id', $slot->id->value())
            ->where('version', $slot->version() - 1)
            ->update([
                'state'           => $slot->status()->value,
                'version'         => $slot->version(),
                'lock_expires_at' => $slot->lockExpiresAt()?->format('Y-m-d H:i:s'),
                'updated_at'      => now(),
            ]);

        if ($affected === 0) {
            throw new SlotConcurrentlyModifiedException($slot->id);
        }
    }

    public function saveMany(array $slots): void
    {
        foreach ($slots as $slot) {
            $this->save($slot);
        }
    }

    private function toDomain(SlotModel $model): Slot
    {
        return Slot::reconstitute(
            id: SlotId::from($model->id),
            fieldId: FieldId::from($model->field_id),
            startsAt: new DateTimeImmutable($model->starts_at->toDateTimeString()),
            endsAt: new DateTimeImmutable($model->ends_at->toDateTimeString()),
            unitPrice: Money::fromDecimal((string) $model->unit_price, $model->currency),
            depositAmount: Money::fromDecimal((string) $model->deposit_amount, $model->currency),
            status: SlotStatus::from($model->state),
            version: $model->version,
            lockExpiresAt: $model->lock_expires_at
                ? new DateTimeImmutable($model->lock_expires_at->toDateTimeString())
                : null,
        );
    }
}
