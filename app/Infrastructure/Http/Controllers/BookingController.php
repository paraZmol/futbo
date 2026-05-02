<?php

declare(strict_types=1);

namespace App\Infrastructure\Http\Controllers;

use App\Application\CheckIn\MarkNoShowUseCase;
use App\Application\CheckIn\ValidateQRCheckInInput;
use App\Application\CheckIn\ValidateQRCheckInUseCase;
use App\Application\Reservations\CancelBookingUseCase;
use App\Application\Reservations\CreateBookingInput;
use App\Application\Reservations\CreateBookingUseCase;
use App\Domain\Reservations\BookingRepository;
use App\Domain\Reservations\BookingSource;
use App\Domain\Shared\ValueObjects\BookingId;
use App\Domain\Shared\ValueObjects\FieldId;
use App\Domain\Shared\ValueObjects\UserId;
use App\Domain\Shared\ValueObjects\VenueId;
use App\Infrastructure\Http\Requests\CreateBookingRequest;
use App\Infrastructure\Persistence\Eloquent\Models\BookingModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final readonly class BookingController
{
    public function __construct(
        private CreateBookingUseCase $createBooking,
        private CancelBookingUseCase $cancelBooking,
        private ValidateQRCheckInUseCase $checkIn,
        private MarkNoShowUseCase $markNoShow,
    ) {}

    public function store(CreateBookingRequest $request): JsonResponse
    {
        /** @var \App\Infrastructure\Persistence\Eloquent\Models\UserModel $user */
        $user = $request->user();

        $input = new CreateBookingInput(
            userId: UserId::from($user->id),
            venueId: VenueId::from((int) $request->validated('venue_id')),
            fieldId: FieldId::from((int) $request->validated('field_id')),
            slotIds: $request->validated('slot_ids'),
            idempotencyKey: (string) $request->header('Idempotency-Key'),
            source: BookingSource::App,
        );

        $output = $this->createBooking->execute($input);

        return response()->json(['data' => $output], 201);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $reason = (string) ($request->input('reason') ?? 'user_request');
        $this->cancelBooking->execute(BookingId::from($id), $reason);

        return response()->json(['data' => ['cancelled' => true]]);
    }

    public function checkIn(Request $request): JsonResponse
    {
        /** @var \App\Infrastructure\Persistence\Eloquent\Models\UserModel $user */
        $user = $request->user();

        $output = $this->checkIn->execute(new ValidateQRCheckInInput(
            qrToken: (string) $request->input('qr_token'),
            staffId: UserId::from($user->id),
        ));

        return response()->json(['data' => $output]);
    }

    public function index(Request $request): JsonResponse
    {
        /** @var \App\Infrastructure\Persistence\Eloquent\Models\UserModel $user */
        $user = $request->user();
        $status = $request->query('status');

        $query = BookingModel::where('user_id', $user->id)->orderByDesc('created_at');
        if ($status) {
            $query->where('status', $status);
        }

        $bookings = $query->get()->map(fn(BookingModel $m) => [
            'id'            => $m->id,
            'publicId'      => $m->getAttribute('public_id'),
            'status'        => $m->getAttribute('status'),
            'source'        => $m->getAttribute('source'),
            'priceTotal'    => $m->getAttribute('price_total'),
            'depositAmount' => $m->getAttribute('deposit_amount'),
            'balanceDue'    => $m->getAttribute('balance_due'),
            'currency'      => $m->getAttribute('currency'),
            'slotStartsAt'  => $m->getAttribute('slot_starts_at')?->format('Y-m-d\TH:i:s\Z'),
            'slotEndsAt'    => $m->getAttribute('slot_ends_at')?->format('Y-m-d\TH:i:s\Z'),
            'qrToken'       => $m->getAttribute('qr_token'),
        ]);

        return response()->json(['data' => $bookings]);
    }

    public function today(Request $request): JsonResponse
    {
        $venueId = (int) $request->query('venue_id');
        $today   = now()->format('Y-m-d');

        $bookings = BookingModel::where('venue_id', $venueId)
            ->whereDate('slot_starts_at', $today)
            ->whereNotIn('status', ['cancelled', 'refunded'])
            ->orderBy('slot_starts_at')
            ->get()
            ->map(fn(BookingModel $m) => [
                'id'           => $m->id,
                'publicId'     => $m->getAttribute('public_id'),
                'status'       => $m->getAttribute('status'),
                'slotStartsAt' => $m->getAttribute('slot_starts_at')?->format('Y-m-d\TH:i:s\Z'),
                'slotEndsAt'   => $m->getAttribute('slot_ends_at')?->format('Y-m-d\TH:i:s\Z'),
                'balanceDue'   => $m->getAttribute('balance_due'),
                'currency'     => $m->getAttribute('currency'),
                'qrToken'      => $m->getAttribute('qr_token'),
            ]);

        return response()->json(['data' => $bookings]);
    }

    public function noShow(Request $request, int $id): JsonResponse
    {
        $this->markNoShow->execute(BookingId::from($id));
        return response()->json(['data' => ['no_show' => true]]);
    }
}
