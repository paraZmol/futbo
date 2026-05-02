<?php

declare(strict_types=1);

namespace App\Domain\Users;

use App\Domain\Shared\ValueObjects\UserId;

interface UserRepository
{
    public function findOrFail(UserId $id): User;

    public function findByEmail(string $email): ?User;
}
