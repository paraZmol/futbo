<?php

declare(strict_types=1);

namespace App\Infrastructure\Http\Controllers;

use App\Infrastructure\Persistence\Eloquent\Models\SlotModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final readonly class SlotController
{
    public function byField(Request $request, int $fieldId): JsonResponse
    {
        $date = $request->query('date', now()->format('Y-m-d'));

        $slots = SlotModel::where('field_id', $fieldId)
            ->whereDate('starts_at', $date)
            ->orderBy('starts_at')
            ->get()
            ->map(fn(SlotModel $m) => [
                'id'            => $m->id,
                'startsAt'      => $m->getAttribute('starts_at')?->format('Y-m-d\TH:i:s\Z'),
                'endsAt'        => $m->getAttribute('ends_at')?->format('Y-m-d\TH:i:s\Z'),
                'unitPrice'     => $m->getAttribute('unit_price'),
                'depositAmount' => $m->getAttribute('deposit_amount'),
                'currency'      => $m->getAttribute('currency'),
                'state'         => $m->getAttribute('state'),
            ]);

        return response()->json(['data' => $slots]);
    }
}
