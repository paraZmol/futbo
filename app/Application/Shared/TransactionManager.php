<?php

declare(strict_types=1);

namespace App\Application\Shared;

interface TransactionManager
{
    /**
     * Wraps the callable in a database transaction.
     * Rolls back on exception, commits on success.
     *
     * @template T
     * @param callable(): T $callable
     * @return T
     */
    public function run(callable $callable): mixed;
}
