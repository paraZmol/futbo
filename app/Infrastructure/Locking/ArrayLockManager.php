<?php

declare(strict_types=1);

namespace App\Infrastructure\Locking;

use App\Application\Shared\LockManager;
use App\Application\Shared\LockNotAcquiredException;

/**
 * In-process lock manager for local development without Redis.
 * NOT safe for concurrent processes — only for single-process dev/testing.
 */
final class ArrayLockManager implements LockManager
{
    /** @var array<string, bool> */
    private array $locks = [];

    public function withLock(string $key, int $ttlMs, callable $callable): mixed
    {
        if (isset($this->locks[$key])) {
            throw new LockNotAcquiredException($key);
        }

        $this->locks[$key] = true;

        try {
            return $callable();
        } finally {
            unset($this->locks[$key]);
        }
    }
}
