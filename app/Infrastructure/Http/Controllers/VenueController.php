<?php

declare(strict_types=1);

namespace App\Infrastructure\Http\Controllers;

use App\Infrastructure\Persistence\Eloquent\Models\FieldModel;
use App\Infrastructure\Persistence\Eloquent\Models\VenueModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final readonly class VenueController
{
    public function index(Request $request): JsonResponse
    {
        $lat      = (float) ($request->query('lat', -12.0464));
        $lng      = (float) ($request->query('lng', -77.0428));
        $sport    = $request->query('sport');
        $radiusKm = (int) ($request->query('radiusKm', 20));
        $page     = max(1, (int) ($request->query('page', 1)));
        $perPage  = 20;

        $query = VenueModel::where('status', 'active')
            ->with(['fields' => function ($q) use ($sport) {
                if ($sport) {
                    $q->where('sport', $sport)->where('is_active', true);
                } else {
                    $q->where('is_active', true);
                }
            }]);

        if ($sport) {
            $query->whereHas('fields', fn($q) => $q->where('sport', $sport)->where('is_active', true));
        }

        $venues = $query->get();

        // Calcular distancia en PHP (MySQL spatial requiere SRID correcto configurado)
        $results = $venues->map(function (VenueModel $v) use ($lat, $lng) {
            $vLat = (float) $v->getAttribute('lat');
            $vLng = (float) $v->getAttribute('lng');
            $distanceM = $this->haversineMeters($lat, $lng, $vLat, $vLng);
            return ['venue' => $v, 'distanceM' => $distanceM];
        })
        ->filter(fn($r) => $r['distanceM'] <= $radiusKm * 1000)
        ->sortBy('distanceM')
        ->values();

        $total      = $results->count();
        $paginated  = $results->slice(($page - 1) * $perPage, $perPage)->values();

        $data = $paginated->map(function ($r) {
            /** @var VenueModel $v */
            $v = $r['venue'];

            // Precio mínimo entre todos los fields
            $fieldIds = $v->fields->pluck('id');
            $minPrice = DB::table('slots')
                ->whereIn('field_id', $fieldIds)
                ->where('state', 'available')
                ->min('unit_price') ?? '80.00';

            // Próximo slot disponible
            $nextSlot = DB::table('slots')
                ->whereIn('field_id', $fieldIds)
                ->where('state', 'available')
                ->where('starts_at', '>=', now())
                ->orderBy('starts_at')
                ->value('starts_at');

            // photos/amenities already cast to array by Eloquent — no need to re-decode
            $photos    = $v->getAttribute('photos') ?? [];
            $amenities = $v->getAttribute('amenities') ?? [];
            if (!is_array($photos))    $photos    = [];
            if (!is_array($amenities)) $amenities = [];

            return [
                'id'               => $v->getAttribute('public_id'),
                'name'             => $v->getAttribute('name'),
                'address'          => $v->getAttribute('address'),
                'city'             => $v->getAttribute('city'),
                'lat'              => (float) $v->getAttribute('lat'),
                'lng'              => (float) $v->getAttribute('lng'),
                'distanceM'        => (int) $r['distanceM'],
                'minPrice'         => $minPrice !== null ? number_format((float) $minPrice, 2, '.', '') : '80.00',
                'currency'         => 'PEN',
                'nextAvailableSlot'=> $nextSlot,
                'photos'           => is_array($photos) ? $photos : [],
                'amenities'        => is_array($amenities) ? $amenities : [],
                'status'           => $v->getAttribute('status'),
            ];
        });

        return response()->json([
            'data' => $data,
            'meta' => [
                'page'       => $page,
                'perPage'    => $perPage,
                'total'      => $total,
                'totalPages' => (int) ceil($total / $perPage),
            ],
        ]);
    }

    public function show(int|string $id): JsonResponse
    {
        $venue = VenueModel::where('public_id', $id)
            ->orWhere('id', $id)
            ->firstOrFail();

        $photos    = $venue->getAttribute('photos') ?? [];
        $amenities = $venue->getAttribute('amenities') ?? [];
        if (!is_array($photos))    $photos    = [];
        if (!is_array($amenities)) $amenities = [];

        $fieldIds = FieldModel::where('venue_id', $venue->id)->pluck('id');
        $minPrice = DB::table('slots')->whereIn('field_id', $fieldIds)->min('unit_price') ?? '80.00';

        return response()->json([
            'data' => [
                'id'        => $venue->getAttribute('public_id'),
                'dbId'      => $venue->id,
                'name'      => $venue->getAttribute('name'),
                'address'   => $venue->getAttribute('address'),
                'city'      => $venue->getAttribute('city'),
                'lat'       => (float) $venue->getAttribute('lat'),
                'lng'       => (float) $venue->getAttribute('lng'),
                'phone'     => $venue->getAttribute('phone'),
                'whatsapp'  => $venue->getAttribute('whatsapp'),
                'minPrice'  => number_format((float) $minPrice, 2, '.', ''),
                'currency'  => 'PEN',
                'photos'    => is_array($photos) ? $photos : [],
                'amenities' => is_array($amenities) ? $amenities : [],
                'status'    => $venue->getAttribute('status'),
            ],
        ]);
    }

    public function fields(int|string $venueId): JsonResponse
    {
        $venue = VenueModel::where('public_id', $venueId)
            ->orWhere('id', $venueId)
            ->firstOrFail();

        $fields = FieldModel::where('venue_id', $venue->id)
            ->where('is_active', true)
            ->get()
            ->map(fn(FieldModel $f) => [
                'id'        => $f->id,
                'publicId'  => $f->getAttribute('public_id'),
                'name'      => $f->getAttribute('name'),
                'sport'     => $f->getAttribute('sport'),
                'surface'   => $f->getAttribute('surface'),
                'isIndoor'  => (bool) $f->getAttribute('is_indoor'),
                'isActive'  => (bool) $f->getAttribute('is_active'),
            ]);

        return response()->json(['data' => $fields]);
    }

    private function haversineMeters(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
