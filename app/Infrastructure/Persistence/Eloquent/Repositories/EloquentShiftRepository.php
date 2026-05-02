<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Shared\Money;
use App\Domain\Shared\ValueObjects\ShiftId;
use App\Domain\Shared\ValueObjects\UserId;
use App\Domain\Shared\ValueObjects\VenueId;
use App\Domain\Shifts\Shift;
use App\Domain\Shifts\ShiftRepository;
use App\Domain\Shifts\ShiftStatus;
use App\Infrastructure\Persistence\Eloquent\Models\ShiftModel;
use DateTimeImmutable;
use RuntimeException;

final readonly class EloquentShiftRepository implements ShiftRepository
{
    public function findOrFail(ShiftId $id): Shift
    {
        /** @var ShiftModel $model */
        $model = ShiftModel::findOrFail($id->value());
        return $this->toDomain($model);
    }

    public function findOpenByStaffAndVenue(UserId $staffId, VenueId $venueId): ?Shift
    {
        /** @var ShiftModel|null $model */
        $model = ShiftModel::where('staff_id', $staffId->value())
            ->where('venue_id', $venueId->value())
            ->where('status', ShiftStatus::Open->value)
            ->first();

        return $model ? $this->toDomain($model) : null;
    }

    public function save(Shift $shift): void
    {
        $data = [
            'venue_id'      => $shift->venueId->value(),
            'staff_id'      => $shift->staffId->value(),
            'opened_at'     => $shift->openedAt->format('Y-m-d H:i:s'),
            'closed_at'     => $shift->closedAt()?->format('Y-m-d H:i:s'),
            'cash_expected' => $shift->cashExpected()->toDecimal(),
            'cash_delivered'=> $shift->cashDelivered()?->toDecimal(),
            'cash_variance' => $shift->cashVariance()?->toDecimal(),
            'closing_notes' => $shift->closingNotes(),
            'status'        => $shift->status()->value,
        ];

        if ($shift->id->value() === 0) {
            ShiftModel::create($data);
        } else {
            ShiftModel::where('id', $shift->id->value())->update($data + ['updated_at' => now()]);
        }
    }

    private function toDomain(ShiftModel $model): Shift
    {
        /** @var int $id */
        $id = $model->getKey();
        return Shift::reconstitute(
            id: ShiftId::from($id),
            venueId: VenueId::from((int) $model->getAttribute('venue_id')),
            staffId: UserId::from((int) $model->getAttribute('staff_id')),
            openedAt: new DateTimeImmutable($model->getAttribute('opened_at')->toDateTimeString()),
            status: ShiftStatus::from((string) $model->getAttribute('status')),
            closedAt: $model->getAttribute('closed_at')
                ? new DateTimeImmutable($model->getAttribute('closed_at')->toDateTimeString()) : null,
            cashExpected: Money::fromDecimal((string) $model->getAttribute('cash_expected'), 'PEN'),
            cashDelivered: $model->getAttribute('cash_delivered')
                ? Money::fromDecimal((string) $model->getAttribute('cash_delivered'), 'PEN') : null,
            cashVariance: $model->getAttribute('cash_variance')
                ? Money::fromDecimal((string) $model->getAttribute('cash_variance'), 'PEN') : null,
            closingNotes: $model->getAttribute('closing_notes'),
        );
    }
}
