<?php

declare(strict_types=1);

namespace App\Domain\Users;

use App\Domain\Shared\ValueObjects\UserId;

final class User
{
    private function __construct(
        public readonly UserId $id,
        public readonly string $publicId,
        public readonly string $name,
        public readonly string $email,
        public readonly ?string $phone,
        public readonly UserRole $role,
        private UserStatus $status,
        private int $version,
    ) {}

    public static function reconstitute(
        UserId $id,
        string $publicId,
        string $name,
        string $email,
        ?string $phone,
        UserRole $role,
        UserStatus $status,
        int $version,
    ): self {
        return new self($id, $publicId, $name, $email, $phone, $role, $status, $version);
    }

    public function isActive(): bool
    {
        return $this->status === UserStatus::Active;
    }

    public function isStaff(): bool
    {
        return $this->role === UserRole::Staff;
    }

    public function isPartner(): bool
    {
        return $this->role === UserRole::Partner;
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    public function status(): UserStatus
    {
        return $this->status;
    }

    public function version(): int
    {
        return $this->version;
    }
}
