<?php

declare(strict_types=1);

namespace Tests\Doubles;

use App\Application\Shared\IdGenerator;

final class FakeIdGenerator implements IdGenerator
{
    private int $counter = 1;

    public function generate(string $prefix): string
    {
        return "{$prefix}_test_" . $this->counter++;
    }
}
