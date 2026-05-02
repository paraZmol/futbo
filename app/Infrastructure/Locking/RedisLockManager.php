<?php

declare(strict_types=1);

namespace App\Infrastructure\Locking;

use App\Application\Shared\LockManager;
use App\Application\Shared\LockNotAcquiredException;
use Illuminate\Support\Str;
use Predis\Client as Redis;

final readonly class RedisLockManager implements LockManager
{
    public function __construct(private Redis $redis) {}

    public function withLock(string $key, int $ttlMs, callable $callable): mixed
    {
        $token = Str::uuid()->toString();
        $acquired = $this->redis->set($key, $token, 'NX', 'PX', $ttlMs);

        if ($acquired === null) {
            throw new LockNotAcquiredException($key);
        }

        try {
            return $callable();
        } finally {
            // Atomic release: only delete if our token still owns the lock
            $script = <<<'LUA'
                if redis.call("get", KEYS[1]) == ARGV[1] then
                    return redis.call("del", KEYS[1])
                else
                    return 0
                end
            LUA;
            $this->redis->eval($script, 1, $key, $token);
        }
    }
}
