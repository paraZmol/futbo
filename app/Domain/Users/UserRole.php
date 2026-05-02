<?php

declare(strict_types=1);

namespace App\Domain\Users;

enum UserRole: string
{
    case User    = 'user';
    case Partner = 'partner';
    case Staff   = 'staff';
    case Admin   = 'admin';
}
