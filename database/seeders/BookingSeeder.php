<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Infrastructure\Persistence\Eloquent\Models\UserModel;
use DateTimeImmutable;
use DateTimeZone;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class BookingSeeder extends Seeder
{
    public function run(): void
    {
        $utc = new DateTimeZone('UTC');

        // Obtener usuarios jugadores
        $users = UserModel::where('role', 'user')->get();
        if ($users->isEmpty()) {
            $this->command->warn('No hay usuarios. Ejecuta UserSeeder primero.');
            return;
        }

        // Obtener campos con sus venues — unit_price viene del primer slot de cada campo
        $fields = DB::table('fields')
            ->join('venues', 'fields.venue_id', '=', 'venues.id')
            ->select('fields.*', 'venues.id as venue_real_id')
            ->get()
            ->map(function ($field) {
                $sample = DB::table('slots')
                    ->where('field_id', $field->id)
                    ->select('unit_price', 'deposit_amount')
                    ->first();
                $field->unit_price     = $sample?->unit_price     ?? '80.00';
                $field->deposit_amount = $sample?->deposit_amount ?? '24.00';
                return $field;
            });

        if ($fields->isEmpty()) {
            $this->command->warn('No hay campos. Ejecuta VenueSeeder primero.');
            return;
        }

        $today    = new DateTimeImmutable('today', $utc);
        $created  = 0;

        // ── 1. Reservas PASADAS (últimos 14 días) — estados variados ────
        $pastScenarios = [
            ['daysAgo' => 13, 'hour' => 10, 'status' => 'completed',  'source' => 'app'],
            ['daysAgo' => 12, 'hour' => 16, 'status' => 'completed',  'source' => 'web'],
            ['daysAgo' => 11, 'hour' => 19, 'status' => 'no_show',    'source' => 'app'],
            ['daysAgo' => 10, 'hour' => 8,  'status' => 'completed',  'source' => 'walk_in'],
            ['daysAgo' => 9,  'hour' => 14, 'status' => 'cancelled',  'source' => 'app'],
            ['daysAgo' => 8,  'hour' => 20, 'status' => 'completed',  'source' => 'app'],
            ['daysAgo' => 7,  'hour' => 11, 'status' => 'completed',  'source' => 'web'],
            ['daysAgo' => 6,  'hour' => 17, 'status' => 'cancelled',  'source' => 'app'],
            ['daysAgo' => 5,  'hour' => 9,  'status' => 'completed',  'source' => 'walk_in'],
            ['daysAgo' => 4,  'hour' => 21, 'status' => 'no_show',    'source' => 'app'],
            ['daysAgo' => 3,  'hour' => 15, 'status' => 'completed',  'source' => 'app'],
            ['daysAgo' => 2,  'hour' => 18, 'status' => 'completed',  'source' => 'web'],
            ['daysAgo' => 1,  'hour' => 10, 'status' => 'completed',  'source' => 'app'],
            ['daysAgo' => 1,  'hour' => 20, 'status' => 'completed',  'source' => 'walk_in'],
        ];

        foreach ($pastScenarios as $i => $scenario) {
            $field  = $fields[$i % count($fields)];
            $user   = $users[$i % count($users)];
            $date   = $today->modify("-{$scenario['daysAgo']} days");
            $start  = $date->setTime((int) $scenario['hour'], 0, 0);
            $end    = $start->modify('+1 hour');

            // Verificar si el slot existe
            $slot = DB::table('slots')
                ->where('field_id', $field->id)
                ->where('starts_at', $start->format('Y-m-d H:i:s'))
                ->first();

            if (!$slot) continue;

            $priceTotal    = (float) $field->unit_price ?? 80.00;
            $depositAmount = (float) $field->deposit_amount ?? 24.00;
            $balanceDue    = round($priceTotal - $depositAmount, 2);
            $qrToken       = 'qr_' . strtolower(Str::random(20));
            $idKey         = 'idem_past_' . $i . '_' . time();
            $publicId      = 'bkg_past' . str_pad((string)$i, 8, '0', STR_PAD_LEFT);

            $now = $start->modify('+2 hours');

            $checkedInAt = null;
            $noShowAt    = null;
            $cancelledAt = null;

            if ($scenario['status'] === 'completed' || $scenario['status'] === 'checked_in') {
                $checkedInAt = $start->modify('+10 minutes')->format('Y-m-d H:i:s');
            }
            if ($scenario['status'] === 'no_show') {
                $noShowAt = $start->modify('+20 minutes')->format('Y-m-d H:i:s');
            }
            if ($scenario['status'] === 'cancelled') {
                $cancelledAt = $start->modify('-2 hours')->format('Y-m-d H:i:s');
            }

            $bookingId = DB::table('bookings')->insertGetId([
                'public_id'          => $publicId,
                'user_id'            => $user->id,
                'venue_id'           => $field->venue_real_id,
                'field_id'           => $field->id,
                'idempotency_key'    => $idKey,
                'slot_starts_at'     => $start->format('Y-m-d H:i:s'),
                'slot_ends_at'       => $end->format('Y-m-d H:i:s'),
                'price_total'        => $priceTotal,
                'deposit_amount'     => $depositAmount,
                'balance_due'        => $balanceDue,
                'platform_fee'       => 0,
                'currency'           => 'PEN',
                'status'             => $scenario['status'],
                'source'             => $scenario['source'],
                'qr_token'           => $qrToken,
                'checked_in_at'      => $checkedInAt,
                'no_show_at'         => $noShowAt,
                'cancelled_at'       => $cancelledAt,
                'cancellation_reason'=> $cancelledAt ? 'user_request' : null,
                'version'            => 1,
                'created_at'         => $start->modify('-1 day')->format('Y-m-d H:i:s'),
                'updated_at'         => $now->format('Y-m-d H:i:s'),
            ]);

            DB::table('booking_slots')->insertOrIgnore([
                'booking_id'          => $bookingId,
                'slot_id'             => $slot->id,
                'unit_price_snapshot' => $priceTotal,
                'created_at'          => now(),
                'updated_at'          => now(),
            ]);

            // Marcar slot según estado
            $slotState = match($scenario['status']) {
                'completed' => 'completed',
                'no_show'   => 'available',
                'cancelled' => 'available',
                default     => 'completed',
            };
            DB::table('slots')->where('id', $slot->id)->update([
                'state'      => $slotState,
                'version'    => 1,
                'updated_at' => now(),
            ]);

            $created++;
        }

        // ── 2. Reservas HOY — en diferentes estados ──────────────────────
        $todayScenarios = [
            ['hour' => 8,  'status' => 'completed',      'source' => 'app'],
            ['hour' => 10, 'status' => 'checked_in',     'source' => 'web'],
            ['hour' => 12, 'status' => 'reserved',       'source' => 'app'],
            ['hour' => 14, 'status' => 'reserved',       'source' => 'walk_in'],
            ['hour' => 16, 'status' => 'reserved',       'source' => 'app'],
            ['hour' => 18, 'status' => 'reserved',       'source' => 'web'],
            ['hour' => 20, 'status' => 'pending_payment','source' => 'app'],
        ];

        foreach ($todayScenarios as $i => $scenario) {
            $field  = $fields[$i % count($fields)];
            $user   = $users[$i % count($users)];
            $start  = $today->setTime((int) $scenario['hour'], 0, 0);
            $end    = $start->modify('+1 hour');

            $slot = DB::table('slots')
                ->where('field_id', $field->id)
                ->where('starts_at', $start->format('Y-m-d H:i:s'))
                ->where('state', 'available')
                ->first();

            if (!$slot) continue;

            $priceTotal    = (float) $field->unit_price ?? 80.00;
            $depositAmount = (float) $field->deposit_amount ?? 24.00;
            $balanceDue    = round($priceTotal - $depositAmount, 2);
            $qrToken       = 'qr_' . strtolower(Str::random(20));
            $idKey         = 'idem_today_' . $i . '_' . time();
            $publicId      = 'bkg_today' . str_pad((string)$i, 7, '0', STR_PAD_LEFT);

            $checkedInAt = $scenario['status'] === 'checked_in'
                ? $start->modify('+5 minutes')->format('Y-m-d H:i:s')
                : null;

            $bookingId = DB::table('bookings')->insertGetId([
                'public_id'       => $publicId,
                'user_id'         => $user->id,
                'venue_id'        => $field->venue_real_id,
                'field_id'        => $field->id,
                'idempotency_key' => $idKey,
                'slot_starts_at'  => $start->format('Y-m-d H:i:s'),
                'slot_ends_at'    => $end->format('Y-m-d H:i:s'),
                'price_total'     => $priceTotal,
                'deposit_amount'  => $depositAmount,
                'balance_due'     => $balanceDue,
                'platform_fee'    => 0,
                'currency'        => 'PEN',
                'status'          => $scenario['status'],
                'source'          => $scenario['source'],
                'qr_token'        => $qrToken,
                'checked_in_at'   => $checkedInAt,
                'version'         => 1,
                'created_at'      => $today->modify('-1 day')->format('Y-m-d H:i:s'),
                'updated_at'      => now(),
            ]);

            DB::table('booking_slots')->insertOrIgnore([
                'booking_id'          => $bookingId,
                'slot_id'             => $slot->id,
                'unit_price_snapshot' => $priceTotal,
                'created_at'          => now(),
                'updated_at'          => now(),
            ]);

            $slotState = match($scenario['status']) {
                'pending_payment' => 'pending_payment',
                default           => 'reserved',
            };

            DB::table('slots')->where('id', $slot->id)->update([
                'state'   => $slotState,
                'version' => 1,
                'updated_at' => now(),
            ]);

            $created++;
        }

        // ── 3. Reservas FUTURAS — próximos 7 días ────────────────────────
        for ($day = 1; $day <= 7; $day++) {
            $date = $today->modify("+{$day} days");

            foreach ([10, 14, 18, 20] as $idx => $hour) {
                $field  = $fields[$idx % count($fields)];
                $user   = $users[$idx % count($users)];
                $start  = $date->setTime($hour, 0, 0);
                $end    = $start->modify('+1 hour');

                $slot = DB::table('slots')
                    ->where('field_id', $field->id)
                    ->where('starts_at', $start->format('Y-m-d H:i:s'))
                    ->where('state', 'available')
                    ->first();

                if (!$slot) continue;

                $priceTotal    = (float) $field->unit_price ?? 80.00;
                $depositAmount = (float) $field->deposit_amount ?? 24.00;
                $balanceDue    = round($priceTotal - $depositAmount, 2);
                $qrToken       = 'qr_' . strtolower(Str::random(20));
                $idKey         = "idem_fut_{$day}_{$idx}_" . time();
                $publicId      = 'bkg_fut' . str_pad((string)($day * 10 + $idx), 7, '0', STR_PAD_LEFT);

                $bookingId = DB::table('bookings')->insertGetId([
                    'public_id'       => $publicId,
                    'user_id'         => $user->id,
                    'venue_id'        => $field->venue_real_id,
                    'field_id'        => $field->id,
                    'idempotency_key' => $idKey,
                    'slot_starts_at'  => $start->format('Y-m-d H:i:s'),
                    'slot_ends_at'    => $end->format('Y-m-d H:i:s'),
                    'price_total'     => $priceTotal,
                    'deposit_amount'  => $depositAmount,
                    'balance_due'     => $balanceDue,
                    'platform_fee'    => 0,
                    'currency'        => 'PEN',
                    'status'          => 'reserved',
                    'source'          => $idx % 2 === 0 ? 'app' : 'web',
                    'qr_token'        => $qrToken,
                    'version'         => 1,
                    'created_at'      => now()->subDays(2),
                    'updated_at'      => now(),
                ]);

                DB::table('booking_slots')->insertOrIgnore([
                    'booking_id'          => $bookingId,
                    'slot_id'             => $slot->id,
                    'unit_price_snapshot' => $priceTotal,
                    'created_at'          => now(),
                    'updated_at'          => now(),
                ]);

                DB::table('slots')->where('id', $slot->id)->update([
                    'state'      => 'reserved',
                    'version'    => 1,
                    'updated_at' => now(),
                ]);

                $created++;
            }
        }

        $this->command->info("Bookings: {$created} reservas creadas (pasadas + hoy + futuras)");
    }
}
