<?php

declare(strict_types=1);

namespace App\Domain\Payments;

final class WebhookEvent
{
    public function __construct(
        public readonly string $gateway,
        public readonly string $eventId,
        public readonly string $eventType,
        public readonly string $rawPayload,
        public readonly bool $signatureValid,
    ) {}
}
