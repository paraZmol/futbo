<?php

declare(strict_types=1);

namespace App\Application\WalkIn;

use App\Application\Reservations\BookingOutput;
use App\Application\Reservations\CreateBookingInput;
use App\Application\Reservations\CreateBookingUseCase;
use App\Domain\Reservations\BookingRepository;
use App\Domain\Reservations\BookingSource;
use App\Domain\Shared\ValueObjects\BookingId;
use App\Domain\Shared\ValueObjects\FieldId;
use App\Domain\Shared\ValueObjects\VenueId;
use App\Application\Shared\TransactionManager;

final readonly class CreateWalkInUseCase
{
    public function __construct(
        private CreateBookingUseCase $createBooking,
        private BookingRepository $bookings,
        private TransactionManager $tx,
    ) {}

    public function execute(CreateWalkInInput $input): BookingOutput
    {
        $bookingInput = new CreateBookingInput(
            userId: null, // walk-ins have no registered user
            venueId: $input->venueId,
            fieldId: $input->fieldId,
            slotIds: $input->slotIds,
            idempotencyKey: $input->idempotencyKey,
            source: BookingSource::WalkIn,
        );

        $output = $this->createBooking->execute($bookingInput);

        // Walk-ins go directly to reserved (no payment gateway)
        $this->tx->run(function () use ($output) {
            $booking = $this->bookings->findOrFail(BookingId::from($output->id));
            $booking->confirmPayment();
            $this->bookings->save($booking);
        });

        return $output;
    }
}
