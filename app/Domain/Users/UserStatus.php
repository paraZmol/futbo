<?php

declare(strict_types=1);

namespace App\Domain\Users;

enum UserStatus: string
{
    case Active    = 'active';
    case Suspended = 'suspended';
    case Deleted   = 'deleted';
}
