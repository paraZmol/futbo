<?php

declare(strict_types=1);

namespace App\Infrastructure\Http\Controllers;

use App\Application\Shifts\CloseShiftUseCase;
use App\Application\Shifts\OpenShiftUseCase;
use App\Application\WalkIn\CreateWalkInInput;
use App\Application\WalkIn\CreateWalkInUseCase;
use App\Domain\Shared\ValueObjects\FieldId;
use App\Domain\Shared\ValueObjects\ShiftId;
use App\Domain\Shared\ValueObjects\UserId;
use App\Domain\Shared\ValueObjects\VenueId;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final readonly class ShiftController
{
    public function __construct(
        private OpenShiftUseCase $openShift,
        private CloseShiftUseCase $closeShift,
        private CreateWalkInUseCase $createWalkIn,
    ) {}

    public function open(Request $request): JsonResponse
    {
        /** @var \App\Infrastructure\Persistence\Eloquent\Models\UserModel $user */
        $user = $request->user();

        $output = $this->openShift->execute(
            staffId: UserId::from($user->id),
            venueId: VenueId::from((int) $request->input('venue_id')),
        );

        return response()->json(['data' => $output], 201);
    }

    public function close(Request $request, int $id): JsonResponse
    {
        $output = $this->closeShift->execute(
            shiftId: ShiftId::from($id),
            cashDeliveredCents: (int) round((float) $request->input('cash_delivered') * 100),
            notes: $request->input('notes'),
        );

        return response()->json(['data' => $output]);
    }

    public function walkIn(Request $request): JsonResponse
    {
        /** @var \App\Infrastructure\Persistence\Eloquent\Models\UserModel $user */
        $user = $request->user();

        $output = $this->createWalkIn->execute(new CreateWalkInInput(
            venueId: VenueId::from((int) $request->input('venue_id')),
            fieldId: FieldId::from((int) $request->input('field_id')),
            slotIds: (array) $request->input('slot_ids'),
            idempotencyKey: (string) $request->header('Idempotency-Key'),
            staffId: UserId::from($user->id),
        ));

        return response()->json(['data' => $output], 201);
    }
}
