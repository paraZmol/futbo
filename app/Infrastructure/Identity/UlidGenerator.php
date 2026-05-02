<?php

declare(strict_types=1);

namespace App\Infrastructure\Identity;

use App\Application\Shared\IdGenerator;
use Symfony\Component\Uid\Ulid;

final readonly class UlidGenerator implements IdGenerator
{
    public function generate(string $prefix): string
    {
        return $prefix . '_' . strtolower((new Ulid())->toBase32());
    }
}
