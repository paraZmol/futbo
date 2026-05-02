<?php

declare(strict_types=1);

namespace App\Infrastructure\Transaction;

use App\Application\Shared\TransactionManager;
use Illuminate\Support\Facades\DB;

final readonly class LaravelTransactionManager implements TransactionManager
{
    public function run(callable $callable): mixed
    {
        return DB::transaction($callable);
    }
}
