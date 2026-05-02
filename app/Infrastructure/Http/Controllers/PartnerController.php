<?php

declare(strict_types=1);

namespace App\Infrastructure\Http\Controllers;

use App\Infrastructure\Persistence\Eloquent\Models\BookingModel;
use App\Infrastructure\Persistence\Eloquent\Models\FieldModel;
use App\Infrastructure\Persistence\Eloquent\Models\VenueModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final readonly class PartnerController
{
    public function venues(Request $request): JsonResponse
    {
        /** @var \App\Infrastructure\Persistence\Eloquent\Models\UserModel $user */
        $user   = $request->user();
        $venues = VenueModel::where('partner_id', $user->id)->get();

        return response()->json([
            'data' => $venues->map(fn(VenueModel $v) => [
                'id'     => $v->id,
                'publicId'=> $v->getAttribute('public_id'),
                'name'   => $v->getAttribute('name'),
                'city'   => $v->getAttribute('city'),
                'status' => $v->getAttribute('status'),
            ]),
        ]);
    }

    public function bookings(Request $request): JsonResponse
    {
        /** @var \App\Infrastructure\Persistence\Eloquent\Models\UserModel $user */
        $user    = $request->user();
        $date    = $request->query('date', now()->format('Y-m-d'));
        $status  = $request->query('status');

        $venueIds = VenueModel::where('partner_id', $user->id)->pluck('id');

        $query = BookingModel::whereIn('venue_id', $venueIds)
            ->whereDate('slot_starts_at', $date)
            ->orderBy('slot_starts_at');

        if ($status) {
            $query->where('status', $status);
        }

        $bookings = $query->get()->map(fn(BookingModel $b) => [
            'id'           => $b->id,
            'publicId'     => $b->getAttribute('public_id'),
            'status'       => $b->getAttribute('status'),
            'source'       => $b->getAttribute('source'),
            'slotStartsAt' => $b->getAttribute('slot_starts_at')?->format('Y-m-d\TH:i:s\Z'),
            'slotEndsAt'   => $b->getAttribute('slot_ends_at')?->format('Y-m-d\TH:i:s\Z'),
            'priceTotal'   => $b->getAttribute('price_total'),
            'depositAmount'=> $b->getAttribute('deposit_amount'),
            'balanceDue'   => $b->getAttribute('balance_due'),
            'currency'     => $b->getAttribute('currency'),
        ]);

        return response()->json(['data' => $bookings]);
    }

    public function schedule(Request $request, int $venueId): JsonResponse
    {
        $date   = $request->query('date', now()->format('Y-m-d'));
        $fields = FieldModel::where('venue_id', $venueId)->where('is_active', true)->get();

        $slots = DB::table('slots')
            ->join('fields', 'slots.field_id', '=', 'fields.id')
            ->leftJoin('bookings', function ($join) {
                $join->on('booking_slots.booking_id', '=', 'bookings.id');
            })
            ->leftJoin('booking_slots', 'booking_slots.slot_id', '=', 'slots.id')
            ->whereIn('slots.field_id', $fields->pluck('id'))
            ->whereDate('slots.starts_at', $date)
            ->select(
                'slots.id as slotId',
                'slots.field_id as fieldId',
                'fields.name as fieldName',
                'slots.starts_at as startsAt',
                'slots.ends_at as endsAt',
                'slots.state',
                'bookings.id as bookingId',
                'bookings.status as bookingStatus',
                'bookings.source as bookingSource',
            )
            ->orderBy('slots.starts_at')
            ->get()
            ->map(fn($s) => [
                'fieldId'       => $s->fieldId,
                'fieldName'     => $s->fieldName,
                'slotId'        => $s->slotId,
                'startsAt'      => $s->startsAt,
                'endsAt'        => $s->endsAt,
                'state'         => $s->state,
                'bookingId'     => $s->bookingId,
                'bookingStatus' => $s->bookingStatus,
                'guestName'     => null,
            ]);

        return response()->json(['data' => $slots]);
    }

    public function analytics(Request $request, int $venueId): JsonResponse
    {
        $dateFrom = $request->query('date_from', now()->format('Y-m-d'));
        $dateTo   = $request->query('date_to',   now()->format('Y-m-d'));

        $bookings = BookingModel::where('venue_id', $venueId)
            ->whereBetween(DB::raw('DATE(slot_starts_at)'), [$dateFrom, $dateTo])
            ->whereNotIn('status', ['cancelled', 'refunded'])
            ->get();

        $totalSlots = DB::table('slots')
            ->whereIn('field_id', FieldModel::where('venue_id', $venueId)->pluck('id'))
            ->whereBetween(DB::raw('DATE(starts_at)'), [$dateFrom, $dateTo])
            ->count();

        $reservedSlots = $bookings->count();
        $occupancy = $totalSlots > 0 ? round(($reservedSlots / $totalSlots) * 100, 1) : 0;

        $totalRevenue  = $bookings->sum(fn($b) => (float) $b->getAttribute('deposit_amount'));
        $pendingBalance= $bookings
            ->whereIn('status', ['reserved', 'checked_in'])
            ->sum(fn($b) => (float) $b->getAttribute('balance_due'));

        return response()->json([
            'data' => [
                'totalBookings'    => $bookings->count(),
                'occupancyPercent' => $occupancy,
                'totalRevenue'     => number_format($totalRevenue, 2, '.', ''),
                'pendingBalance'   => number_format($pendingBalance, 2, '.', ''),
                'currency'         => 'PEN',
            ],
        ]);
    }

    public function fields(Request $request): JsonResponse
    {
        /** @var \App\Infrastructure\Persistence\Eloquent\Models\UserModel $user */
        $user     = $request->user();
        $venueIds = VenueModel::where('partner_id', $user->id)->pluck('id');
        $fields   = FieldModel::whereIn('venue_id', $venueIds)->get();

        return response()->json([
            'data' => $fields->map(fn(FieldModel $f) => [
                'id'              => $f->id,
                'publicId'        => $f->getAttribute('public_id'),
                'name'            => $f->getAttribute('name'),
                'sport'           => $f->getAttribute('sport'),
                'surface'         => $f->getAttribute('surface'),
                'capacityPlayers' => $f->getAttribute('capacity_players'),
                'isIndoor'        => (bool) $f->getAttribute('is_indoor'),
                'isActive'        => (bool) $f->getAttribute('is_active'),
            ]),
        ]);
    }

    public function storeField(Request $request): JsonResponse
    {
        /** @var \App\Infrastructure\Persistence\Eloquent\Models\UserModel $user */
        $user    = $request->user();
        $venue   = VenueModel::where('partner_id', $user->id)->firstOrFail();
        $data    = $request->validate([
            'name'             => ['required', 'string', 'max:80'],
            'sport'            => ['required', 'in:futbol5,futbol7,futbol11,padel,basket,tenis,otro'],
            'surface'          => ['required', 'in:grass_natural,grass_sintetico,cemento,parquet,otro'],
            'capacity_players' => ['required', 'integer', 'min:2', 'max:30'],
            'is_indoor'        => ['boolean'],
        ]);

        $field = FieldModel::create([
            'public_id'        => 'fld_' . strtolower(substr(bin2hex(random_bytes(12)), 0, 20)),
            'venue_id'         => $venue->id,
            'name'             => $data['name'],
            'sport'            => $data['sport'],
            'surface'          => $data['surface'],
            'capacity_players' => $data['capacity_players'],
            'is_indoor'        => $data['is_indoor'] ?? false,
            'is_active'        => true,
        ]);

        return response()->json(['data' => ['id' => $field->id, 'name' => $field->getAttribute('name')]], 201);
    }

    public function updateField(Request $request, int $id): JsonResponse
    {
        $field = FieldModel::findOrFail($id);
        $data  = $request->validate([
            'name'             => ['sometimes', 'string', 'max:80'],
            'sport'            => ['sometimes', 'in:futbol5,futbol7,futbol11,padel,basket,tenis,otro'],
            'surface'          => ['sometimes', 'in:grass_natural,grass_sintetico,cemento,parquet,otro'],
            'capacity_players' => ['sometimes', 'integer', 'min:2', 'max:30'],
            'is_indoor'        => ['sometimes', 'boolean'],
            'is_active'        => ['sometimes', 'boolean'],
        ]);
        $field->update($data);
        return response()->json(['data' => ['updated' => true]]);
    }

    public function events(Request $request): JsonResponse
    {
        /** @var \App\Infrastructure\Persistence\Eloquent\Models\UserModel $user */
        $user     = $request->user();
        $venueIds = VenueModel::where('partner_id', $user->id)->pluck('id');
        $fieldIds = FieldModel::whereIn('venue_id', $venueIds)->pluck('id');

        $events = DB::table('events')
            ->join('fields', 'events.field_id', '=', 'fields.id')
            ->whereIn('events.field_id', $fieldIds)
            ->whereNull('events.deleted_at')
            ->where('events.ends_at', '>=', now())
            ->orderBy('events.starts_at')
            ->select('events.*', 'fields.name as fieldName')
            ->get()
            ->map(fn($e) => [
                'id'        => $e->id,
                'title'     => $e->title,
                'type'      => $e->type,
                'startsAt'  => $e->starts_at,
                'endsAt'    => $e->ends_at,
                'fieldName' => $e->fieldName,
            ]);

        return response()->json(['data' => $events]);
    }

    public function storeEvent(Request $request): JsonResponse
    {
        $data = $request->validate([
            'field_id'  => ['required', 'integer'],
            'title'     => ['required', 'string', 'max:120'],
            'type'      => ['required', 'in:maintenance,tournament,private,other'],
            'starts_at' => ['required', 'date'],
            'ends_at'   => ['required', 'date', 'after:starts_at'],
            'notes'     => ['nullable', 'string'],
        ]);

        $eventId = DB::table('events')->insertGetId([
            'field_id'   => $data['field_id'],
            'title'      => $data['title'],
            'type'       => $data['type'],
            'starts_at'  => $data['starts_at'],
            'ends_at'    => $data['ends_at'],
            'notes'      => $data['notes'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Bloquear slots del período
        DB::table('slots')
            ->where('field_id', $data['field_id'])
            ->where('starts_at', '>=', $data['starts_at'])
            ->where('ends_at', '<=', $data['ends_at'])
            ->where('state', 'available')
            ->update(['state' => 'event_occupied', 'version' => 1, 'updated_at' => now()]);

        return response()->json(['data' => ['id' => $eventId]], 201);
    }

    public function destroyEvent(int $id): JsonResponse
    {
        DB::table('events')->where('id', $id)->update(['deleted_at' => now()]);
        return response()->json(['data' => ['deleted' => true]]);
    }

    public function staff(Request $request): JsonResponse
    {
        // Devuelve usuarios con rol staff asignados a venues del partner
        /** @var \App\Infrastructure\Persistence\Eloquent\Models\UserModel $user */
        $u = $request->user();
        $staff = DB::table('users')
            ->where('role', 'staff')
            ->where('status', '!=', 'deleted')
            ->get()
            ->map(fn($s) => [
                'id'        => $s->id,
                'name'      => $s->name,
                'email'     => $s->email,
                'status'    => $s->status,
                'createdAt' => $s->created_at,
            ]);

        return response()->json(['data' => $staff]);
    }

    public function storeStaff(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:120'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = DB::table('users')->insertGetId([
            'public_id' => 'usr_' . strtolower(substr(bin2hex(random_bytes(10)), 0, 20)),
            'name'      => $data['name'],
            'email'     => $data['email'],
            'password'  => \Illuminate\Support\Facades\Hash::make($data['password']),
            'role'      => 'staff',
            'status'    => 'active',
            'created_at'=> now(),
            'updated_at'=> now(),
        ]);

        return response()->json(['data' => ['id' => $user]], 201);
    }

    public function updateStaff(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'in:active,suspended']]);
        DB::table('users')->where('id', $id)->update(['status' => $data['status'], 'updated_at' => now()]);
        return response()->json(['data' => ['updated' => true]]);
    }
}
