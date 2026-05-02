<?php

declare(strict_types=1);

namespace App\Application\Shared;

use RuntimeException;

final class LockNotAcquiredException extends RuntimeException
{
    public function __construct(string $key)
    {
        parent::__construct("Could not acquire distributed lock for key: {$key}");
    }
}
