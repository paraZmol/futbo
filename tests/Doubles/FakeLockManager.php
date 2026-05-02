<?php

declare(strict_types=1);

namespace Tests\Doubles;

use App\Application\Shared\LockManager;
use App\Application\Shared\LockNotAcquiredException;

final class FakeLockManager implements LockManager
{
    /** @var string[] */
    private array $acquiredKeys = [];

    /** @var string[] */
    private array $releasedKeys = [];

    /** @var string[] Keys that will fail to acquire */
    private array $failKeys = [];

    public function withLock(string $key, int $ttlMs, callable $callable): mixed
    {
        if (in_array($key, $this->failKeys, true)) {
            throw new LockNotAcquiredException($key);
        }

        $this->acquiredKeys[] = $key;

        try {
            $result = $callable();
        } finally {
            $this->releasedKeys[] = $key;
        }

        return $result;
    }

    public function makeFailFor(string $key): void
    {
        $this->failKeys[] = $key;
    }

    public function wasAcquired(string $key): bool
    {
        return in_array($key, $this->acquiredKeys, true);
    }

    public function wasReleased(string $key): bool
    {
        return in_array($key, $this->releasedKeys, true);
    }
}
