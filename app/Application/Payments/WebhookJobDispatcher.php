<?php

declare(strict_types=1);

namespace App\Application\Payments;

interface WebhookJobDispatcher
{
    public function dispatch(string $gateway, string $eventId, string $eventType, string $rawPayload): void;
}
