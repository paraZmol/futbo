<?php

declare(strict_types=1);

namespace App\Domain\Slots;

use App\Domain\Shared\ValueObjects\FieldId;
use App\Domain\Shared\ValueObjects\SlotId;
use DateTimeImmutable;

interface SlotRepository
{
    public function findOrFail(SlotId $id): Slot;

    /** @return Slot[] */
    public function findAvailableByField(FieldId $fieldId, DateTimeImmutable $from, DateTimeImmutable $to): array;

    /** @return Slot[] Slots in pending_payment state with lock_expires_at < $before */
    public function findExpiredLocksBefore(DateTimeImmutable $before): array;

    public function save(Slot $slot): void;

    /** @param Slot[] $slots */
    public function saveMany(array $slots): void;
}
