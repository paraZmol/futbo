<?php

declare(strict_types=1);

namespace Tests\Doubles;

use App\Domain\Shared\ValueObjects\FieldId;
use App\Domain\Shared\ValueObjects\SlotId;
use App\Domain\Slots\Exceptions\SlotConcurrentlyModifiedException;
use App\Domain\Slots\Slot;
use App\Domain\Slots\SlotRepository;
use DateTimeImmutable;
use RuntimeException;

final class InMemorySlotRepository implements SlotRepository
{
    /** @var array<int, Slot> */
    private array $slots = [];

    /** @var array<int, int> version snapshots to simulate optimistic locking */
    private array $versions = [];

    public function add(Slot $slot): void
    {
        $this->slots[$slot->id->value()] = $slot;
        $this->versions[$slot->id->value()] = $slot->version();
    }

    public function findOrFail(SlotId $id): Slot
    {
        return $this->slots[$id->value()] ?? throw new RuntimeException("Slot {$id->value()} not found");
    }

    public function findAvailableByField(FieldId $fieldId, DateTimeImmutable $from, DateTimeImmutable $to): array
    {
        return array_values(array_filter(
            $this->slots,
            fn(Slot $s) => $s->fieldId->equals($fieldId) && $s->status()->isAvailable()
        ));
    }

    public function findExpiredLocksBefore(DateTimeImmutable $before): array
    {
        return array_values(array_filter(
            $this->slots,
            fn(Slot $s) => $s->isExpiredLock($before)
        ));
    }

    public function save(Slot $slot): void
    {
        $id = $slot->id->value();

        // Simulate optimistic locking: version must match stored version
        if (isset($this->versions[$id]) && $this->versions[$id] !== $slot->version() - 1) {
            throw new SlotConcurrentlyModifiedException($slot->id);
        }

        $this->slots[$id] = $slot;
        $this->versions[$id] = $slot->version();
    }

    public function saveMany(array $slots): void
    {
        foreach ($slots as $slot) {
            $this->save($slot);
        }
    }
}
