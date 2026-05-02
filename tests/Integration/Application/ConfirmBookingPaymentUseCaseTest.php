<?php

declare(strict_types=1);

namespace Tests\Integration\Application;

use App\Application\Reservations\ConfirmBookingPaymentUseCase;
use App\Domain\Reservations\Booking;
use App\Domain\Reservations\BookingSource;
use App\Domain\Reservations\BookingStatus;
use App\Domain\Shared\Money;
use App\Domain\Shared\ValueObjects\BookingId;
use App\Domain\Shared\ValueObjects\FieldId;
use App\Domain\Shared\ValueObjects\UserId;
use App\Domain\Shared\ValueObjects\VenueId;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;
use Tests\Doubles\FakeTransactionManager;
use Tests\Doubles\InMemoryBookingRepository;
use Tests\Doubles\InMemorySlotRepository;

final class ConfirmBookingPaymentUseCaseTest extends TestCase
{
    public function test_confirms_pending_booking(): void
    {
        $bookings = new InMemoryBookingRepository();
        $booking = $this->makeBooking(BookingId::from(1));
        $bookings->save($booking);

        $useCase = new ConfirmBookingPaymentUseCase(
            bookings: $bookings,
            slots: new InMemorySlotRepository(),
            tx: new FakeTransactionManager(),
        );

        $useCase->execute(BookingId::from(1));

        $updated = $bookings->findOrFail(BookingId::from(1));
        $this->assertSame(BookingStatus::Reserved, $updated->status());
    }

    public function test_is_idempotent_when_already_reserved(): void
    {
        $bookings = new InMemoryBookingRepository();
        $booking = $this->makeBooking(BookingId::from(1));
        $booking->confirmPayment();
        $bookings->save($booking);

        $useCase = new ConfirmBookingPaymentUseCase(
            bookings: $bookings,
            slots: new InMemorySlotRepository(),
            tx: new FakeTransactionManager(),
        );

        // Should not throw
        $useCase->execute(BookingId::from(1));
        $this->assertSame(BookingStatus::Reserved, $bookings->findOrFail(BookingId::from(1))->status());
    }

    private function makeBooking(BookingId $id): Booking
    {
        return Booking::create(
            id: $id,
            publicId: 'bkg_test',
            userId: UserId::from(1),
            venueId: VenueId::from(1),
            fieldId: FieldId::from(1),
            idempotencyKey: 'idem-' . $id->value(),
            slotStartsAt: new DateTimeImmutable('2026-06-01 10:00:00'),
            slotEndsAt: new DateTimeImmutable('2026-06-01 11:00:00'),
            priceTotal: Money::pen(8000),
            depositAmount: Money::pen(2400),
            balanceDue: Money::pen(5600),
            source: BookingSource::App,
            qrToken: 'qr-' . $id->value(),
        );
    }
}
