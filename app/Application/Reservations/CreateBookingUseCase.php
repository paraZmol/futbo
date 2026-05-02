<?php

declare(strict_types=1);

namespace App\Application\Reservations;

use App\Application\Shared\Clock;
use App\Application\Shared\IdGenerator;
use App\Application\Shared\LockManager;
use App\Application\Shared\TransactionManager;
use App\Domain\Reservations\Booking;
use App\Domain\Reservations\BookingRepository;
use App\Domain\Shared\Money;
use App\Domain\Shared\ValueObjects\BookingId;
use App\Domain\Slots\SlotRepository;
use App\Domain\Shared\ValueObjects\SlotId;

final readonly class CreateBookingUseCase
{
    // 10 minutes lock TTL — matches the business rule
    private const LOCK_TTL_MS = 600_000;

    public function __construct(
        private LockManager $locks,
        private TransactionManager $tx,
        private SlotRepository $slots,
        private BookingRepository $bookings,
        private Clock $clock,
        private IdGenerator $ids,
    ) {}

    public function execute(CreateBookingInput $input): BookingOutput
    {
        // Check idempotency before acquiring any lock
        $existing = $this->bookings->findByIdempotencyKey($input->idempotencyKey);
        if ($existing !== null) {
            return BookingOutput::fromDomain($existing);
        }

        // Sort slot IDs for deterministic lock order (prevents deadlocks)
        $sortedSlotIds = $input->slotIds;
        sort($sortedSlotIds);

        // 1st line of defense: distributed Redis lock on each slot
        return $this->acquireLocksAndBook($sortedSlotIds, $input);
    }

    /**
     * @param int[] $slotIds
     */
    private function acquireLocksAndBook(array $slotIds, CreateBookingInput $input): BookingOutput
    {
        if (empty($slotIds)) {
            return $this->createBookingInTransaction($input);
        }

        $slotId = array_shift($slotIds);
        $lockKey = "slot:{$slotId}";

        return $this->locks->withLock($lockKey, self::LOCK_TTL_MS, function () use ($slotIds, $input) {
            return $this->acquireLocksAndBook($slotIds, $input);
        });
    }

    private function createBookingInTransaction(CreateBookingInput $input): BookingOutput
    {
        return $this->tx->run(function () use ($input) {
            $now = $this->clock->now();
            $lockExpires = $now->modify('+10 minutes');

            $slotEntities = [];
            $totalCents = 0;
            $depositCents = 0;

            // 2nd line of defense: optimistic locking inside transaction
            foreach ($input->slotIds as $rawSlotId) {
                $slot = $this->slots->findOrFail(SlotId::from($rawSlotId));
                $slot->holdForPayment($lockExpires);
                $this->slots->save($slot); // throws SlotConcurrentlyModifiedException if version mismatch

                $slotEntities[] = $slot;
                $totalCents += $slot->unitPrice->amountCents();
                $depositCents += $slot->depositAmount->amountCents();
            }

            $priceTotal = Money::pen($totalCents);
            $depositAmount = Money::pen($depositCents);
            $balanceDue = $priceTotal->subtract($depositAmount);

            $firstSlot = $slotEntities[0];
            $lastSlot = $slotEntities[count($slotEntities) - 1];

            $booking = Booking::create(
                id: BookingId::from(0), // DB assigns real ID
                publicId: $this->ids->generate('bkg'),
                userId: $input->userId,
                venueId: $input->venueId,
                fieldId: $input->fieldId,
                idempotencyKey: $input->idempotencyKey,
                slotStartsAt: $firstSlot->startsAt,
                slotEndsAt: $lastSlot->endsAt,
                priceTotal: $priceTotal,
                depositAmount: $depositAmount,
                balanceDue: $balanceDue,
                source: $input->source,
                qrToken: $this->ids->generate('qr'),
            );

            // save() returns the real persisted ID (may differ from 0 on first insert)
            $persistedId = $this->bookings->save($booking);

            // 3rd line of defense: UNIQUE(slot_id) constraint on booking_slots
            foreach ($slotEntities as $slot) {
                $this->bookings->linkSlot(
                    $persistedId,
                    $slot->id->value(),
                    $slot->unitPrice->toDecimal(),
                );
            }

            // Re-fetch to get the booking with the real ID for the output
            $booking = $this->bookings->findOrFail($persistedId);

            return BookingOutput::fromDomain($booking);
        });
    }
}
