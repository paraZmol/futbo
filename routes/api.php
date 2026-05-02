<?php

declare(strict_types=1);

use App\Infrastructure\Http\Controllers\BookingController;
use App\Infrastructure\Http\Controllers\ShiftController;
use App\Infrastructure\Http\Controllers\WebhookController;
use App\Infrastructure\Http\Middleware\HandleDomainExceptions;
use App\Infrastructure\Http\Middleware\RequireIdempotencyKey;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware([HandleDomainExceptions::class])->group(function () {

    // ── Authenticated user endpoints ─────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {

        // Bookings
        Route::post('/bookings', [BookingController::class, 'store'])
            ->middleware(RequireIdempotencyKey::class)
            ->name('bookings.store');

        Route::post('/bookings/{id}/cancel', [BookingController::class, 'cancel'])
            ->name('bookings.cancel');
    });

    // ── Staff endpoints ───────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->prefix('staff')->group(function () {

        Route::post('/shifts', [ShiftController::class, 'open'])
            ->name('shifts.open');

        Route::post('/shifts/{id}/close', [ShiftController::class, 'close'])
            ->name('shifts.close');

        Route::post('/walk-ins', [ShiftController::class, 'walkIn'])
            ->middleware(RequireIdempotencyKey::class)
            ->name('walk-ins.store');

        Route::post('/check-in', [BookingController::class, 'checkIn'])
            ->name('checkin.validate');

        Route::post('/bookings/{id}/no-show', [BookingController::class, 'noShow'])
            ->name('bookings.no-show');
    });

    // ── Webhooks (no auth — verified by HMAC) ────────────────────────────
    Route::post('/webhooks/{gateway}', [WebhookController::class, 'handle'])
        ->name('webhooks.handle');
});
