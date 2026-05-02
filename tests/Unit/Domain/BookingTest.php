<?php

declare(strict_types=1);

namespace Tests\Unit\Domain;

use App\Domain\Reservations\Booking;
use App\Domain\Reservations\BookingSource;
use App\Domain\Reservations\BookingStatus;
use App\Domain\Reservations\Exceptions\BookingAlreadyCancelledException;
use App\Domain\Reservations\Exceptions\BookingCheckInException;
use App\Domain\Reservations\Exceptions\BookingNotCancellableException;
use App\Domain\Reservations\Exceptions\InvalidBookingPaymentStateException;
use App\Domain\Shared\Money;
use App\Domain\Shared\ValueObjects\BookingId;
use App\Domain\Shared\ValueObjects\FieldId;
use App\Domain\Shared\ValueObjects\UserId;
use App\Domain\Shared\ValueObjects\VenueId;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

final class BookingTest extends TestCase
{
    public function test_new_booking_is_pending_payment(): void
    {
        $booking = $this->makeBooking();
        $this->assertSame(BookingStatus::PendingPayment, $booking->status());
    }

    public function test_confirm_payment_transitions_to_reserved(): void
    {
        $booking = $this->makeBooking();
        $booking->confirmPayment();
        $this->assertSame(BookingStatus::Reserved, $booking->status());
        $this->assertSame(1, $booking->version());
    }

    public function test_confirm_payment_is_idempotent(): void
    {
        $booking = $this->makeBooking();
        $booking->confirmPayment();
        $booking->confirmPayment(); // segunda llamada no lanza excepción
        $this->assertSame(BookingStatus::Reserved, $booking->status());
        $this->assertSame(1, $booking->version()); // version solo sube una vez
    }

    public function test_cannot_confirm_payment_on_cancelled_booking(): void
    {
        $booking = $this->makeBooking();
        $booking->cancel(new DateTimeImmutable(), 'test');

        $this->expectException(InvalidBookingPaymentStateException::class);
        $booking->confirmPayment();
    }

    public function test_pending_booking_can_be_cancelled(): void
    {
        $booking = $this->makeBooking();
        $booking->cancel(new DateTimeImmutable(), 'user request');

        $this->assertSame(BookingStatus::Cancelled, $booking->status());
        $this->assertNotNull($booking->cancelledAt());
        $this->assertSame('user request', $booking->cancellationReason());
    }

    public function test_reserved_booking_can_be_cancelled(): void
    {
        $booking = $this->makeBooking();
        $booking->confirmPayment();
        $booking->cancel(new DateTimeImmutable(), 'partner cancelled');

        $this->assertSame(BookingStatus::Cancelled, $booking->status());
    }

    public function test_cannot_cancel_twice(): void
    {
        $booking = $this->makeBooking();
        $booking->cancel(new DateTimeImmutable(), 'first');

        $this->expectException(BookingAlreadyCancelledException::class);
        $booking->cancel(new DateTimeImmutable(), 'second');
    }

    public function test_cannot_cancel_completed_booking(): void
    {
        $booking = $this->makeBooking();
        $booking->confirmPayment();
        $booking->complete();

        $this->expectException(BookingNotCancellableException::class);
        $booking->cancel(new DateTimeImmutable(), 'too late');
    }

    public function test_check_in_transitions_to_checked_in(): void
    {
        $booking = $this->makeBooking();
        $booking->confirmPayment();
        $now = new DateTimeImmutable('2026-06-01 10:00:00'); // exactly at slot start

        $booking->checkIn($now);

        $this->assertSame(BookingStatus::CheckedIn, $booking->status());
        $this->assertNotNull($booking->checkedInAt());
    }

    public function test_cannot_check_in_too_early(): void
    {
        $booking = $this->makeBooking();
        $booking->confirmPayment();
        $tooEarly = new DateTimeImmutable('2026-06-01 09:44:00'); // 16 min before slot

        $this->expectException(BookingCheckInException::class);
        $booking->checkIn($tooEarly);
    }

    public function test_no_show_requires_15_min_after_start(): void
    {
        $booking = $this->makeBooking();
        $booking->confirmPayment();
        $afterWindow = new DateTimeImmutable('2026-06-01 10:16:00');

        $booking->markNoShow($afterWindow);

        $this->assertSame(BookingStatus::NoShow, $booking->status());
    }

    public function test_cannot_mark_no_show_before_window(): void
    {
        $booking = $this->makeBooking();
        $booking->confirmPayment();
        $beforeWindow = new DateTimeImmutable('2026-06-01 10:10:00');

        $this->expectException(BookingCheckInException::class);
        $booking->markNoShow($beforeWindow);
    }

    private function makeBooking(): Booking
    {
        return Booking::create(
            id: BookingId::from(1),
            publicId: 'bkg_01test',
            userId: UserId::from(1),
            venueId: VenueId::from(1),
            fieldId: FieldId::from(1),
            idempotencyKey: 'test-idem-key',
            slotStartsAt: new DateTimeImmutable('2026-06-01 10:00:00'),
            slotEndsAt: new DateTimeImmutable('2026-06-01 11:00:00'),
            priceTotal: Money::pen(8000),
            depositAmount: Money::pen(2400),
            balanceDue: Money::pen(5600),
            source: BookingSource::App,
            qrToken: 'test-qr-token',
        );
    }
}
