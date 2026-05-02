<?php

declare(strict_types=1);

namespace App\Infrastructure\Http\Controllers;

use App\Application\Payments\ProcessWebhookInput;
use App\Application\Payments\ProcessWebhookUseCase;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

final readonly class WebhookController
{
    private const MAX_TIMESTAMP_AGE_SECONDS = 300;

    public function __construct(
        private ProcessWebhookUseCase $processWebhook,
        private string $webhookSecret,
    ) {}

    public function handle(Request $request, string $gateway): Response
    {
        $signature = (string) $request->header('X-Signature');
        $timestamp = (string) $request->header('X-Timestamp');
        $rawBody = $request->getContent();

        if (!$this->verifySignature($rawBody, $timestamp, $signature)) {
            logger()->warning('webhook.signature_invalid', ['gateway' => $gateway, 'ip' => $request->ip()]);
            return response('', 401);
        }

        if (!$this->verifyTimestamp($timestamp)) {
            logger()->warning('webhook.timestamp_stale', ['gateway' => $gateway]);
            return response('', 401);
        }

        $payload = json_decode($rawBody, true);
        $eventId = (string) ($payload['id'] ?? uniqid($gateway, true));
        $eventType = (string) ($payload['type'] ?? 'unknown');

        $this->processWebhook->execute(new ProcessWebhookInput(
            gateway: $gateway,
            eventId: $eventId,
            eventType: $eventType,
            rawPayload: $rawBody,
            signature: $signature,
            timestamp: $timestamp,
        ));

        return response('', 200);
    }

    private function verifySignature(string $body, string $timestamp, string $sig): bool
    {
        $expected = hash_hmac('sha256', $timestamp . '.' . $body, $this->webhookSecret);
        return hash_equals($expected, $sig);
    }

    private function verifyTimestamp(string $timestamp): bool
    {
        $age = time() - (int) $timestamp;
        return $age >= 0 && $age <= self::MAX_TIMESTAMP_AGE_SECONDS;
    }
}
