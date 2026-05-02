<?php

declare(strict_types=1);

namespace Tests\Integration\Application;

use App\Application\Reservations\CreateBookingInput;
use App\Application\Reservations\CreateBookingUseCase;
use App\Application\Shared\LockNotAcquiredException;
use App\Domain\Reservations\BookingSource;
use App\Domain\Reservations\BookingStatus;
use App\Domain\Shared\Money;
use App\Domain\Shared\ValueObjects\FieldId;
use App\Domain\Shared\ValueObjects\SlotId;
use App\Domain\Shared\ValueObjects\UserId;
use App\Domain\Shared\ValueObjects\VenueId;
use App\Domain\Slots\Slot;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;
use Tests\Doubles\FakeClock;
use Tests\Doubles\FakeIdGenerator;
use Tests\Doubles\FakeLockManager;
use Tests\Doubles\FakeTransactionManager;
use Tests\Doubles\InMemoryBookingRepository;
use Tests\Doubles\InMemorySlotRepository;

final class CreateBookingUseCaseTest extends TestCase
{
    private InMemorySlotRepository $slots;
    private InMemoryBookingRepository $bookings;
    private FakeLockManager $locks;
    private FakeClock $clock;
    private CreateBookingUseCase $useCase;

    protected function setUp(): void
    {
        $this->slots    = new InMemorySlotRepository();
        $this->bookings = new InMemoryBookingRepository();
        $this->locks    = new FakeLockManager();
        $this->clock    = FakeClock::at('2026-06-01 09:00:00');

        $this->useCase = new CreateBookingUseCase(
            locks: $this->locks,
            tx: new FakeTransactionManager(),
            slots: $this->slots,
            bookings: $this->bookings,
            clock: $this->clock,
            ids: new FakeIdGenerator(),
        );
    }

    public function test_creates_booking_and_holds_slots(): void
    {
        $this->slots->add($this->makeSlot(1));

        $output = $this->useCase->execute($this->makeInput([1]));

        $this->assertSame('pending_payment', $output->status);
        $this->assertSame('80.00', $output->priceTotal);
        $this->assertSame('24.00', $output->depositAmount);
        $this->assertSame('56.00', $output->balanceDue);
        $this->assertTrue($this->locks->wasAcquired('slot:1'));
        $this->assertTrue($this->locks->wasReleased('slot:1'));
    }

    public function test_acquires_lock_for_each_slot(): void
    {
        $this->slots->add($this->makeSlot(1));
        $this->slots->add($this->makeSlot(2));

        $this->useCase->execute($this->makeInput([1, 2]));

        $this->assertTrue($this->locks->wasAcquired('slot:1'));
        $this->assertTrue($this->locks->wasAcquired('slot:2'));
    }

    public function test_returns_existing_booking_on_duplicate_idempotency_key(): void
    {
        $this->slots->add($this->makeSlot(1));

        $first = $this->useCase->execute($this->makeInput([1], 'idem-key-abc'));
        // Slot is now pending_payment — add a new slot for the second call to not fail on slot state
        $second = $this->useCase->execute($this->makeInput([1], 'idem-key-abc'));

        $this->assertSame($first->publicId, $second->publicId);
    }

    public function test_fails_when_lock_cannot_be_acquired(): void
    {
        $this->slots->add($this->makeSlot(1));
        $this->locks->makeFailFor('slot:1');

        $this->expectException(LockNotAcquiredException::class);
        $this->useCase->execute($this->makeInput([1]));
    }

    public function test_lock_is_released_even_when_slot_not_available(): void
    {
        $slot = $this->makeSlot(1);
        $slot->holdForPayment(new DateTimeImmutable('+10 minutes')); // already taken
        $this->slots->add($slot);

        try {
            $this->useCase->execute($this->makeInput([1]));
        } catch (\Throwable) {
            // expected
        }

        $this->assertTrue($this->locks->wasReleased('slot:1'));
    }

    public function test_multiple_slots_sum_price_correctly(): void
    {
        $this->slots->add($this->makeSlot(1)); // 80.00
        $this->slots->add($this->makeSlot(2)); // 80.00

        $output = $this->useCase->execute($this->makeInput([1, 2]));

        $this->assertSame('160.00', $output->priceTotal);
        $this->assertSame('48.00', $output->depositAmount);
    }

    // ─── helpers ────────────────────────────────────────────────────────────

    private function makeSlot(int $id): Slot
    {
        return Slot::create(
            id: SlotId::from($id),
            fieldId: FieldId::from(1),
            startsAt: new DateTimeImmutable('2026-06-01 10:00:00'),
            endsAt: new DateTimeImmutable('2026-06-01 11:00:00'),
            unitPrice: Money::pen(8000),
            depositAmount: Money::pen(2400),
        );
    }

    /**
     * @param int[] $slotIds
     */
    private function makeInput(array $slotIds, string $idempotencyKey = 'test-idem-key'): CreateBookingInput
    {
        return new CreateBookingInput(
            userId: UserId::from(1),
            venueId: VenueId::from(1),
            fieldId: FieldId::from(1),
            slotIds: $slotIds,
            idempotencyKey: $idempotencyKey,
            source: BookingSource::App,
        );
    }
}
