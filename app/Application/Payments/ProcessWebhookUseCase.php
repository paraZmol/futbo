<?php

declare(strict_types=1);

namespace App\Application\Payments;

use App\Domain\Payments\WebhookEvent;
use App\Domain\Payments\WebhookEventRepository;

final readonly class ProcessWebhookUseCase
{
    public function __construct(
        private WebhookEventRepository $webhookEvents,
        private WebhookJobDispatcher $dispatcher,
    ) {}

    /**
     * Stores the webhook for deduplication and dispatches async processing.
     * Returns false if duplicate (already processed) — caller should return 200 OK silently.
     */
    public function execute(ProcessWebhookInput $input): bool
    {
        $event = new WebhookEvent(
            gateway: $input->gateway,
            eventId: $input->eventId,
            eventType: $input->eventType,
            rawPayload: $input->rawPayload,
            signatureValid: true, // controller already validated
        );

        $inserted = $this->webhookEvents->insertIfNotExists($event);

        if (!$inserted) {
            return false; // duplicate — idempotent response
        }

        $this->dispatcher->dispatch($input->gateway, $input->eventId, $input->eventType, $input->rawPayload);

        return true;
    }
}
