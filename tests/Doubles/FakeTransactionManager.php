<?php

declare(strict_types=1);

namespace Tests\Doubles;

use App\Application\Shared\TransactionManager;

final class FakeTransactionManager implements TransactionManager
{
    public function run(callable $callable): mixed
    {
        return $callable();
    }
}
