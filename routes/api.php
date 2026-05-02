<?php

declare(strict_types=1);

use App\Infrastructure\Http\Controllers\AuthController;
use App\Infrastructure\Http\Controllers\BookingController;
use App\Infrastructure\Http\Controllers\ShiftController;
use App\Infrastructure\Http\Controllers\SlotController;
use App\Infrastructure\Http\Controllers\WebhookController;
use App\Infrastructure\Http\Middleware\HandleDomainExceptions;
use App\Infrastructure\Http\Middleware\RequireIdempotencyKey;
use App\Infrastructure\Persistence\Eloquent\Models\BookingModel;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware([HandleDomainExceptions::class])->group(function () {

    // ── Auth (public) ──────────────────────────────────────────────────────
    Route::post('/auth/register', [AuthController::class, 'register'])->name('auth.register');
    Route::post('/auth/login',    [AuthController::class, 'login'])->name('auth.login');
    Route::post('/auth/logout',   [AuthController::class, 'logout'])->middleware('auth:sanctum')->name('auth.logout');

    // ── Slots (public) ─────────────────────────────────────────────────────
    Route::get('/fields/{fieldId}/slots', [SlotController::class, 'byField'])->name('slots.by-field');

    // ── Authenticated user endpoints ───────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/bookings',              [BookingController::class, 'index'])->name('bookings.index');
        Route::post('/bookings',             [BookingController::class, 'store'])
            ->middleware(RequireIdempotencyKey::class)->name('bookings.store');
        Route::post('/bookings/{id}/cancel', [BookingController::class, 'cancel'])->name('bookings.cancel');
    });

    // ── Staff endpoints ────────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->prefix('staff')->group(function () {

        Route::post('/shifts',            [ShiftController::class, 'open'])->name('shifts.open');
        Route::post('/shifts/{id}/close', [ShiftController::class, 'close'])->name('shifts.close');

        Route::post('/walk-ins', [ShiftController::class, 'walkIn'])
            ->middleware(RequireIdempotencyKey::class)->name('walk-ins.store');

        Route::post('/check-in',              [BookingController::class, 'checkIn'])->name('checkin.validate');
        Route::post('/bookings/{id}/no-show', [BookingController::class, 'noShow'])->name('bookings.no-show');
        Route::get('/bookings/today',         [BookingController::class, 'today'])->name('bookings.today');
    });

    // ── Webhooks (no auth — verified by HMAC) ─────────────────────────────
    Route::post('/webhooks/{gateway}', [WebhookController::class, 'handle'])->name('webhooks.handle');

    // ── Test-only endpoint: simula confirmación de pago sin HMAC ──────────
    // Solo disponible en APP_ENV=local o testing. Nunca en producción.
    if (app()->environment(['local', 'testing'])) {
        Route::post('/test/confirm-booking/{id}', function (int $id) {
            $booking = BookingModel::findOrFail($id);
            $booking->update(['status' => 'reserved', 'version' => $booking->version + 1]);
            return response()->json(['data' => ['confirmed' => true]]);
        })->name('test.confirm-booking');
    }
});
