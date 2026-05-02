<?php

declare(strict_types=1);

namespace App\Infrastructure\Payments;

use App\Application\Payments\WebhookJobDispatcher;
use App\Infrastructure\Jobs\ProcessPaymentWebhookJob;

final readonly class LaravelWebhookJobDispatcher implements WebhookJobDispatcher
{
    public function dispatch(string $gateway, string $eventId, string $eventType, string $rawPayload): void
    {
        ProcessPaymentWebhookJob::dispatch($gateway, $eventId, $eventType, $rawPayload);
    }
}
