<?php

declare(strict_types=1);

use App\Infrastructure\Http\Controllers\AdminController;
use App\Infrastructure\Http\Controllers\AuthController;
use App\Infrastructure\Http\Controllers\BookingController;
use App\Infrastructure\Http\Controllers\PartnerController;
use App\Infrastructure\Http\Controllers\ShiftController;
use App\Infrastructure\Http\Controllers\SlotController;
use App\Infrastructure\Http\Controllers\VenueController;
use App\Infrastructure\Http\Controllers\WebhookController;
use App\Infrastructure\Http\Middleware\HandleDomainExceptions;
use App\Infrastructure\Http\Middleware\RequireIdempotencyKey;
use App\Infrastructure\Persistence\Eloquent\Models\BookingModel;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware([HandleDomainExceptions::class])->group(function () {

    // ── Auth (público) ─────────────────────────────────────────────────────
    Route::post('/auth/register', [AuthController::class, 'register'])->name('auth.register');
    Route::post('/auth/login',    [AuthController::class, 'login'])->name('auth.login');
    Route::post('/auth/logout',   [AuthController::class, 'logout'])->middleware('auth:sanctum')->name('auth.logout');

    // ── Venues (público) ──────────────────────────────────────────────────
    Route::get('/venues',                   [VenueController::class, 'index'])->name('venues.index');
    Route::get('/venues/{venueId}',         [VenueController::class, 'show'])->name('venues.show');
    Route::get('/venues/{venueId}/fields',  [VenueController::class, 'fields'])->name('venues.fields');

    // ── Slots (público) ───────────────────────────────────────────────────
    Route::get('/fields/{fieldId}/slots', [SlotController::class, 'byField'])->name('slots.by-field');

    // ── Usuario autenticado ────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/bookings',              [BookingController::class, 'index'])->name('bookings.index');
        Route::post('/bookings',             [BookingController::class, 'store'])
            ->middleware(RequireIdempotencyKey::class)->name('bookings.store');
        Route::post('/bookings/{id}/cancel', [BookingController::class, 'cancel'])->name('bookings.cancel');
    });

    // ── Staff ──────────────────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->prefix('staff')->group(function () {
        Route::post('/shifts',            [ShiftController::class, 'open'])->name('shifts.open');
        Route::post('/shifts/{id}/close', [ShiftController::class, 'close'])->name('shifts.close');
        Route::post('/walk-ins',          [ShiftController::class, 'walkIn'])
            ->middleware(RequireIdempotencyKey::class)->name('walk-ins.store');
        Route::post('/check-in',              [BookingController::class, 'checkIn'])->name('checkin.validate');
        Route::post('/bookings/{id}/no-show', [BookingController::class, 'noShow'])->name('bookings.no-show');
        Route::get('/bookings/today',         [BookingController::class, 'today'])->name('bookings.today');
    });

    // ── Partner ────────────────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->prefix('partner')->group(function () {
        Route::get('/venues',                          [PartnerController::class, 'venues'])->name('partner.venues');
        Route::get('/bookings',                        [PartnerController::class, 'bookings'])->name('partner.bookings');
        Route::get('/venues/{venueId}/schedule',       [PartnerController::class, 'schedule'])->name('partner.schedule');
        Route::get('/venues/{venueId}/analytics',      [PartnerController::class, 'analytics'])->name('partner.analytics');
        Route::get('/fields',                          [PartnerController::class, 'fields'])->name('partner.fields');
        Route::post('/fields',                         [PartnerController::class, 'storeField'])->name('partner.fields.store');
        Route::put('/fields/{id}',                     [PartnerController::class, 'updateField'])->name('partner.fields.update');
        Route::patch('/fields/{id}',                   [PartnerController::class, 'updateField'])->name('partner.fields.patch');
        Route::get('/events',                          [PartnerController::class, 'events'])->name('partner.events');
        Route::post('/events',                         [PartnerController::class, 'storeEvent'])->name('partner.events.store');
        Route::delete('/events/{id}',                  [PartnerController::class, 'destroyEvent'])->name('partner.events.destroy');
        Route::get('/staff',                           [PartnerController::class, 'staff'])->name('partner.staff');
        Route::post('/staff',                          [PartnerController::class, 'storeStaff'])->name('partner.staff.store');
        Route::patch('/staff/{id}',                    [PartnerController::class, 'updateStaff'])->name('partner.staff.patch');
    });

    // ── Admin ──────────────────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
        Route::get('/partners',                [AdminController::class, 'partners'])->name('admin.partners');
        Route::post('/partners/{userId}/approve', [AdminController::class, 'approvePartner'])->name('admin.partners.approve');
        Route::post('/partners/{userId}/suspend', [AdminController::class, 'suspendPartner'])->name('admin.partners.suspend');
        Route::get('/audit-logs',              [AdminController::class, 'auditLogs'])->name('admin.audit-logs');
    });

    // ── Webhooks (sin auth — validado por HMAC) ────────────────────────────
    Route::post('/webhooks/{gateway}', [WebhookController::class, 'handle'])->name('webhooks.handle');

    // ── Test-only: simula confirmación de pago ─────────────────────────────
    if (app()->environment(['local', 'testing'])) {
        Route::post('/test/confirm-booking/{id}', function (int $id) {
            $booking = BookingModel::findOrFail($id);
            $booking->update(['status' => 'reserved', 'version' => $booking->getAttribute('version') + 1]);
            return response()->json(['data' => ['confirmed' => true]]);
        })->name('test.confirm-booking');
    }
});
