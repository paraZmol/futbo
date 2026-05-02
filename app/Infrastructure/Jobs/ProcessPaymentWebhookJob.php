<?php

declare(strict_types=1);

namespace App\Infrastructure\Jobs;

use App\Application\Reservations\ConfirmBookingPaymentUseCase;
use App\Domain\Payments\WebhookEventRepository;
use App\Domain\Shared\ValueObjects\BookingId;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

final class ProcessPaymentWebhookJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        private readonly string $gateway,
        private readonly string $eventId,
        private readonly string $eventType,
        private readonly string $rawPayload,
    ) {}

    public function handle(
        ConfirmBookingPaymentUseCase $confirmPayment,
        WebhookEventRepository $webhookEvents,
    ): void {
        try {
            $payload = json_decode($this->rawPayload, true);

            match ($this->eventType) {
                'charge.succeeded' => $this->handleSuccess($payload, $confirmPayment),
                default => logger()->info('webhook.unhandled_type', [
                    'gateway' => $this->gateway,
                    'type'    => $this->eventType,
                ]),
            };

            $webhookEvents->markProcessed($this->gateway, $this->eventId);
        } catch (\Throwable $e) {
            $webhookEvents->markFailed($this->gateway, $this->eventId, $e->getMessage());
            throw $e;
        }
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function handleSuccess(array $payload, ConfirmBookingPaymentUseCase $useCase): void
    {
        $bookingId = $payload['metadata']['booking_id'] ?? null;

        if ($bookingId === null) {
            logger()->warning('webhook.missing_booking_id', ['payload' => $payload]);
            return;
        }

        $useCase->execute(BookingId::from((int) $bookingId));
    }
}
