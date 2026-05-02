<?php

declare(strict_types=1);

namespace App\Application\Shifts;

use App\Application\Shared\Clock;
use App\Application\Shared\TransactionManager;
use App\Domain\Shared\ValueObjects\ShiftId;
use App\Domain\Shared\ValueObjects\UserId;
use App\Domain\Shared\ValueObjects\VenueId;
use App\Domain\Shifts\Exceptions\ShiftAlreadyOpenException;
use App\Domain\Shifts\Shift;
use App\Domain\Shifts\ShiftRepository;

final readonly class OpenShiftUseCase
{
    public function __construct(
        private ShiftRepository $shifts,
        private TransactionManager $tx,
        private Clock $clock,
    ) {}

    public function execute(UserId $staffId, VenueId $venueId): ShiftOutput
    {
        return $this->tx->run(function () use ($staffId, $venueId) {
            $existing = $this->shifts->findOpenByStaffAndVenue($staffId, $venueId);

            if ($existing !== null) {
                throw new ShiftAlreadyOpenException($staffId, $venueId);
            }

            $shift = Shift::open(
                id: ShiftId::from(0), // DB assigns
                venueId: $venueId,
                staffId: $staffId,
                now: $this->clock->now(),
            );

            $this->shifts->save($shift);

            return ShiftOutput::fromDomain($shift);
        });
    }
}
