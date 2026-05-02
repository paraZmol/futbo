<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Infrastructure\Persistence\Eloquent\Models\FieldModel;
use App\Infrastructure\Persistence\Eloquent\Models\ScheduleTemplateModel;
use App\Infrastructure\Persistence\Eloquent\Models\SlotModel;
use App\Infrastructure\Persistence\Eloquent\Models\UserModel;
use App\Infrastructure\Persistence\Eloquent\Models\VenueModel;
use DateTimeImmutable;
use DateTimeZone;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

final class VenueSeeder extends Seeder
{
    public function run(): void
    {
        $partner = UserModel::where('role', 'partner')->firstOrFail();

        // Create venue with POINT location (lat/lng Lima, Peru)
        $venueId = DB::table('venues')->insertGetId([
            'public_id'    => 'vnu_lima000000000001',
            'partner_id'   => $partner->id,
            'name'         => 'Complejo Los Pinos',
            'slug'         => 'complejo-los-pinos',
            'address'      => 'Av. Los Pinos 123, San Miguel',
            'city'         => 'Lima',
            'country_code' => 'PE',
            'lat'          => -12.0776,
            'lng'          => -77.0839,
            'location'     => DB::raw("ST_GeomFromText('POINT(-77.0839 -12.0776)', 4326)"),
            'phone'        => '+51999000001',
            'status'       => 'active',
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        // Create two fields
        $field1Id = DB::table('fields')->insertGetId([
            'public_id'        => 'fld_cancha00000001',
            'venue_id'         => $venueId,
            'name'             => 'Cancha 1 - Grass Sintético',
            'sport'            => 'futbol5',
            'surface'          => 'grass_sintetico',
            'capacity_players' => 10,
            'is_indoor'        => false,
            'is_active'        => true,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        $field2Id = DB::table('fields')->insertGetId([
            'public_id'        => 'fld_cancha00000002',
            'venue_id'         => $venueId,
            'name'             => 'Cancha 2 - Cemento',
            'sport'            => 'futbol5',
            'surface'          => 'cemento',
            'capacity_players' => 10,
            'is_indoor'        => false,
            'is_active'        => true,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        // Generate slots for the next 7 days (08:00 - 22:00, hourly)
        $this->generateSlots($field1Id, 'PEN', 8000, 2400);
        $this->generateSlots($field2Id, 'PEN', 6000, 1800);
    }

    private function generateSlots(int $fieldId, string $currency, int $unitPriceCents, int $depositCents): void
    {
        $utc = new DateTimeZone('UTC');
        $slots = [];

        for ($day = 0; $day < 7; $day++) {
            $date = (new DateTimeImmutable('today', $utc))->modify("+{$day} days");

            for ($hour = 8; $hour < 22; $hour++) {
                $starts = $date->setTime($hour, 0, 0);
                $ends   = $date->setTime($hour + 1, 0, 0);

                $slots[] = [
                    'field_id'       => $fieldId,
                    'starts_at'      => $starts->format('Y-m-d H:i:s'),
                    'ends_at'        => $ends->format('Y-m-d H:i:s'),
                    'unit_price'     => number_format($unitPriceCents / 100, 2, '.', ''),
                    'deposit_amount' => number_format($depositCents / 100, 2, '.', ''),
                    'currency'       => $currency,
                    'state'          => 'available',
                    'version'        => 0,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ];
            }
        }

        // Insert in batches
        foreach (array_chunk($slots, 50) as $batch) {
            DB::table('slots')->insertOrIgnore($batch);
        }
    }
}
