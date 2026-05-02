<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Infrastructure\Persistence\Eloquent\Models\UserModel;
use DateTimeImmutable;
use DateTimeZone;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

final class VenueSeeder extends Seeder
{
    public function run(): void
    {
        $partner1 = UserModel::where('email', 'partner@canchasapp.pe')->firstOrFail();
        $partner2 = UserModel::where('email', 'partner2@canchasapp.pe')->firstOrFail();

        // ── Venue 1: Complejo Los Pinos (Miraflores) ────────────────────
        $venue1 = DB::table('venues')->insertGetId([
            'public_id'    => 'vnu_lima000000000001',
            'partner_id'   => $partner1->id,
            'name'         => 'Complejo Los Pinos',
            'slug'         => 'complejo-los-pinos',
            'address'      => 'Av. Reducto 1535, Miraflores',
            'city'         => 'Lima',
            'country_code' => 'PE',
            'lat'          => -12.1186,
            'lng'          => -77.0337,
            'location'     => DB::raw("ST_GeomFromText('POINT(-77.0337 -12.1186)', 4326)"),
            'phone'        => '+51999000001',
            'whatsapp'     => '+51999000001',
            'amenities'    => json_encode(['estacionamiento', 'vestuarios', 'duchas', 'cafeteria', 'iluminacion']),
            'photos'       => json_encode([
                'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80',
                'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80',
                'https://images.unsplash.com/photo-1521731978332-9e9e714bdd20?w=800&q=80',
            ]),
            'status'       => 'active',
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        $f1a = $this->createField($venue1, 'fld_pinos00000001', 'Cancha 1 - Grass Sintético', 'futbol5', 'grass_sintetico', 10, false);
        $f1b = $this->createField($venue1, 'fld_pinos00000002', 'Cancha 2 - Grass Sintético', 'futbol5', 'grass_sintetico', 10, false);
        $f1c = $this->createField($venue1, 'fld_pinos00000003', 'Cancha 3 - Fútbol 7',        'futbol7', 'grass_sintetico', 14, false);
        $f1d = $this->createField($venue1, 'fld_pinos00000004', 'Cancha Pádel 1',             'padel',   'cemento',         4,  true);

        $this->generateSlots($f1a, 8000, 2400);   // S/ 80 / hora, anticipo S/ 24
        $this->generateSlots($f1b, 8000, 2400);
        $this->generateSlots($f1c, 12000, 3600);  // S/ 120 / hora, anticipo S/ 36
        $this->generateSlots($f1d, 5000, 1500);   // S/ 50 / hora (pádel), anticipo S/ 15

        // ── Venue 2: Sport Center El Estadio (San Borja) ────────────────
        $venue2 = DB::table('venues')->insertGetId([
            'public_id'    => 'vnu_lima000000000002',
            'partner_id'   => $partner1->id,
            'name'         => 'Sport Center El Estadio',
            'slug'         => 'sport-center-el-estadio',
            'address'      => 'Av. San Luis 2345, San Borja',
            'city'         => 'Lima',
            'country_code' => 'PE',
            'lat'          => -12.0924,
            'lng'          => -76.9975,
            'location'     => DB::raw("ST_GeomFromText('POINT(-76.9975 -12.0924)', 4326)"),
            'phone'        => '+51999000002',
            'whatsapp'     => '+51999000002',
            'amenities'    => json_encode(['estacionamiento', 'vestuarios', 'iluminacion', 'gradas']),
            'photos'       => json_encode([
                'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80',
                'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80',
            ]),
            'status'       => 'active',
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        $f2a = $this->createField($venue2, 'fld_estadio0000001', 'Cancha Principal - Grass Natural', 'futbol7',  'grass_natural',  14, false);
        $f2b = $this->createField($venue2, 'fld_estadio0000002', 'Cancha Basket Techada',            'basket',   'parquet',         10, true);
        $f2c = $this->createField($venue2, 'fld_estadio0000003', 'Cancha Fútbol 5 - Cemento',        'futbol5',  'cemento',         10, false);

        $this->generateSlots($f2a, 15000, 4500);  // S/ 150 / hora fútbol 7
        $this->generateSlots($f2b, 6000, 1800);   // S/ 60 / hora basket
        $this->generateSlots($f2c, 7000, 2100);   // S/ 70 / hora fútbol 5

        // ── Venue 3: Academia Tenis Los Olivos (Los Olivos) ─────────────
        $venue3 = DB::table('venues')->insertGetId([
            'public_id'    => 'vnu_lima000000000003',
            'partner_id'   => $partner2->id,
            'name'         => 'Academia Los Olivos',
            'slug'         => 'academia-los-olivos',
            'address'      => 'Av. Universitaria 3456, Los Olivos',
            'city'         => 'Lima',
            'country_code' => 'PE',
            'lat'          => -11.9921,
            'lng'          => -77.0688,
            'location'     => DB::raw("ST_GeomFromText('POINT(-77.0688 -11.9921)', 4326)"),
            'phone'        => '+51999000003',
            'whatsapp'     => '+51999000003',
            'amenities'    => json_encode(['vestuarios', 'duchas', 'iluminacion', 'instructor']),
            'photos'       => json_encode([
                'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80',
                'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80',
            ]),
            'status'       => 'active',
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        $f3a = $this->createField($venue3, 'fld_olivos000000001', 'Cancha Tenis 1 - Clay',   'tenis', 'cemento', 2, false);
        $f3b = $this->createField($venue3, 'fld_olivos000000002', 'Cancha Tenis 2 - Dura',   'tenis', 'cemento', 2, false);
        $f3c = $this->createField($venue3, 'fld_olivos000000003', 'Cancha Padel Techada',     'padel', 'cemento', 4, true);

        $this->generateSlots($f3a, 4500, 1350);  // S/ 45 tenis
        $this->generateSlots($f3b, 4500, 1350);
        $this->generateSlots($f3c, 5500, 1650);  // S/ 55 padel

        $this->command->info('Venues: 3 creados con ' . DB::table('fields')->count() . ' canchas');
        $this->command->info('Slots: ' . DB::table('slots')->count() . ' slots generados (30 dias)');
    }

    private function createField(int $venueId, string $publicId, string $name, string $sport, string $surface, int $capacity, bool $isIndoor): int
    {
        return DB::table('fields')->insertGetId([
            'public_id'        => $publicId,
            'venue_id'         => $venueId,
            'name'             => $name,
            'sport'            => $sport,
            'surface'          => $surface,
            'capacity_players' => $capacity,
            'is_indoor'        => $isIndoor,
            'is_active'        => true,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);
    }

    private function generateSlots(int $fieldId, int $unitPriceCents, int $depositCents): void
    {
        $utc   = new DateTimeZone('UTC');
        $slots = [];

        // 30 dias hacia adelante
        for ($day = 0; $day < 30; $day++) {
            $date = (new DateTimeImmutable('today', $utc))->modify("+{$day} days");

            for ($hour = 7; $hour < 23; $hour++) {
                $slots[] = [
                    'field_id'       => $fieldId,
                    'starts_at'      => $date->setTime($hour, 0, 0)->format('Y-m-d H:i:s'),
                    'ends_at'        => $date->setTime($hour + 1, 0, 0)->format('Y-m-d H:i:s'),
                    'unit_price'     => number_format($unitPriceCents / 100, 2, '.', ''),
                    'deposit_amount' => number_format($depositCents / 100, 2, '.', ''),
                    'currency'       => 'PEN',
                    'state'          => 'available',
                    'version'        => 0,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ];
            }
        }

        foreach (array_chunk($slots, 100) as $batch) {
            DB::table('slots')->insertOrIgnore($batch);
        }
    }
}
