<?php

declare(strict_types=1);

namespace App\Application\Shifts;

use App\Domain\Shifts\Shift;

final readonly class ShiftOutput
{
    public function __construct(
        public readonly int $id,
        public readonly string $status,
        public readonly string $openedAt,
        public readonly ?string $closedAt,
        public readonly string $cashExpected,
        public readonly ?string $cashDelivered,
        public readonly ?string $cashVariance,
    ) {}

    public static function fromDomain(Shift $shift): self
    {
        return new self(
            id: $shift->id->value(),
            status: $shift->status()->value,
            openedAt: $shift->openedAt->format('Y-m-d\TH:i:s\Z'),
            closedAt: $shift->closedAt()?->format('Y-m-d\TH:i:s\Z'),
            cashExpected: $shift->cashExpected()->toDecimal(),
            cashDelivered: $shift->cashDelivered()?->toDecimal(),
            cashVariance: $shift->cashVariance()?->toDecimal(),
        );
    }
}
