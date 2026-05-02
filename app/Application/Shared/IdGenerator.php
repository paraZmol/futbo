<?php

declare(strict_types=1);

namespace App\Application\Shared;

interface IdGenerator
{
    /** Returns a prefixed ULID string, e.g. "bkg_01HZXABC..." */
    public function generate(string $prefix): string;
}
