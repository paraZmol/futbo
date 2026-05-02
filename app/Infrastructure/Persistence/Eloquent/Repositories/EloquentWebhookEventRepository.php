<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Payments\WebhookEvent;
use App\Domain\Payments\WebhookEventRepository;
use App\Infrastructure\Persistence\Eloquent\Models\WebhookEventModel;
use Illuminate\Database\UniqueConstraintViolationException;

final readonly class EloquentWebhookEventRepository implements WebhookEventRepository
{
    public function insertIfNotExists(WebhookEvent $event): bool
    {
        try {
            WebhookEventModel::create([
                'gateway'         => $event->gateway,
                'event_id'        => $event->eventId,
                'event_type'      => $event->eventType,
                'payload'         => json_decode($event->rawPayload, true),
                'signature_valid' => $event->signatureValid,
                'processed'       => false,
            ]);
            return true;
        } catch (UniqueConstraintViolationException) {
            return false; // duplicate — idempotent
        }
    }

    public function markProcessed(string $gateway, string $eventId): void
    {
        WebhookEventModel::where('gateway', $gateway)
            ->where('event_id', $eventId)
            ->update(['processed' => true, 'updated_at' => now()]);
    }

    public function markFailed(string $gateway, string $eventId, string $error): void
    {
        WebhookEventModel::where('gateway', $gateway)
            ->where('event_id', $eventId)
            ->update(['processing_error' => $error, 'updated_at' => now()]);
    }
}
