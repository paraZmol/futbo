<?php

declare(strict_types=1);

namespace App\Application\Shifts;

use App\Application\Shared\Clock;
use App\Application\Shared\TransactionManager;
use App\Domain\Shared\Money;
use App\Domain\Shared\ValueObjects\ShiftId;
use App\Domain\Shifts\ShiftRepository;

final readonly class CloseShiftUseCase
{
    public function __construct(
        private ShiftRepository $shifts,
        private TransactionManager $tx,
        private Clock $clock,
    ) {}

    public function execute(ShiftId $shiftId, int $cashDeliveredCents, ?string $notes): ShiftOutput
    {
        return $this->tx->run(function () use ($shiftId, $cashDeliveredCents, $notes) {
            $shift = $this->shifts->findOrFail($shiftId);

            $shift->close(
                cashDelivered: Money::pen($cashDeliveredCents),
                cashExpected: $shift->cashExpected(),
                now: $this->clock->now(),
                notes: $notes,
            );

            $this->shifts->save($shift);

            return ShiftOutput::fromDomain($shift);
        });
    }
}
