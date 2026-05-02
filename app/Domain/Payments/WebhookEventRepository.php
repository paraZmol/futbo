<?php

declare(strict_types=1);

namespace App\Domain\Payments;

interface WebhookEventRepository
{
    /**
     * Returns false if already exists (duplicate — idempotent).
     */
    public function insertIfNotExists(WebhookEvent $event): bool;

    public function markProcessed(string $gateway, string $eventId): void;

    public function markFailed(string $gateway, string $eventId, string $error): void;
}
