<?php

declare(strict_types=1);

namespace App\Application\Payments;

final readonly class ProcessWebhookInput
{
    public function __construct(
        public readonly string $gateway,
        public readonly string $eventId,
        public readonly string $eventType,
        public readonly string $rawPayload,
        public readonly string $signature,
        public readonly string $timestamp,
    ) {}
}
