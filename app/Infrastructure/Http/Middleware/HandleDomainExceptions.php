<?php

declare(strict_types=1);

namespace App\Infrastructure\Http\Middleware;

use App\Application\Shared\LockNotAcquiredException;
use App\Domain\Reservations\Exceptions\BookingAlreadyCancelledException;
use App\Domain\Reservations\Exceptions\BookingCheckInException;
use App\Domain\Reservations\Exceptions\BookingNotCancellableException;
use App\Domain\Reservations\Exceptions\InvalidBookingPaymentStateException;
use App\Domain\Shifts\Exceptions\ShiftAlreadyOpenException;
use App\Domain\Slots\Exceptions\SlotConcurrentlyModifiedException;
use App\Domain\Slots\Exceptions\SlotNotAvailableException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

final class HandleDomainExceptions
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            return $next($request);
        } catch (SlotNotAvailableException | SlotConcurrentlyModifiedException | LockNotAcquiredException $e) {
            return response()->json([
                'error' => ['code' => 'SLOT_NOT_AVAILABLE', 'message' => 'El horario seleccionado ya no está disponible.'],
            ], 409);
        } catch (BookingAlreadyCancelledException | BookingNotCancellableException $e) {
            return response()->json([
                'error' => ['code' => 'BOOKING_NOT_CANCELLABLE', 'message' => $e->getMessage()],
            ], 409);
        } catch (BookingCheckInException $e) {
            return response()->json([
                'error' => ['code' => 'CHECKIN_INVALID', 'message' => $e->getMessage()],
            ], 422);
        } catch (InvalidBookingPaymentStateException $e) {
            return response()->json([
                'error' => ['code' => 'INVALID_PAYMENT_STATE', 'message' => $e->getMessage()],
            ], 409);
        } catch (ShiftAlreadyOpenException $e) {
            return response()->json([
                'error' => ['code' => 'SHIFT_ALREADY_OPEN', 'message' => $e->getMessage()],
            ], 409);
        }
    }
}
