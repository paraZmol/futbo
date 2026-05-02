<?php

declare(strict_types=1);

namespace App\Application\Shared;

interface LockManager
{
    /**
     * Acquires a distributed lock with TTL, executes the callable, then releases.
     * Throws LockNotAcquiredException if the lock cannot be acquired.
     *
     * @template T
     * @param callable(): T $callable
     * @return T
     */
    public function withLock(string $key, int $ttlMs, callable $callable): mixed;
}
