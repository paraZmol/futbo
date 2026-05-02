<?php

declare(strict_types=1);

namespace App\Domain\Shifts;

enum ShiftStatus: string
{
    case Open   = 'open';
    case Closed = 'closed';
}
