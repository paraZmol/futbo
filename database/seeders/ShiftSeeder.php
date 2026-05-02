<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Infrastructure\Persistence\Eloquent\Models\UserModel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

final class ShiftSeeder extends Seeder
{
    public function run(): void
    {
        $staff1 = UserModel::where('email', 'staff@canchasapp.pe')->firstOrFail();
        $staff2 = UserModel::where('email', 'staff2@canchasapp.pe')->firstOrFail();
        $venues = DB::table('venues')->get();

        if ($venues->isEmpty()) return;

        $venue1 = $venues[0];
        $venue2 = $venues[1] ?? $venues[0];

        // Turnos pasados cerrados (últimos 5 días)
        for ($daysAgo = 5; $daysAgo >= 1; $daysAgo--) {
            $openedAt  = now()->subDays($daysAgo)->setTime(14, 0, 0);
            $closedAt  = now()->subDays($daysAgo)->setTime(22, 0, 0);
            $expected  = 320.00 + ($daysAgo * 15);   // variación realista
            $delivered = $daysAgo === 3 ? $expected - 20 : $expected; // día 3 tuvo varianza

            DB::table('shifts')->insert([
                'venue_id'       => $venue1->id,
                'staff_id'       => $staff1->id,
                'opened_at'      => $openedAt,
                'closed_at'      => $closedAt,
                'cash_expected'  => $expected,
                'cash_delivered' => $delivered,
                'cash_variance'  => abs($delivered - $expected),
                'closing_notes'  => $daysAgo === 3 ? 'Faltaron S/ 20, revisando tickets' : null,
                'status'         => 'closed',
                'created_at'     => $openedAt,
                'updated_at'     => $closedAt,
            ]);
        }

        // Turno de venue 2 también (staff2)
        for ($daysAgo = 3; $daysAgo >= 1; $daysAgo--) {
            $openedAt = now()->subDays($daysAgo)->setTime(8, 0, 0);
            $closedAt = now()->subDays($daysAgo)->setTime(16, 0, 0);
            DB::table('shifts')->insert([
                'venue_id'       => $venue2->id,
                'staff_id'       => $staff2->id,
                'opened_at'      => $openedAt,
                'closed_at'      => $closedAt,
                'cash_expected'  => 180.00,
                'cash_delivered' => 180.00,
                'cash_variance'  => 0,
                'status'         => 'closed',
                'created_at'     => $openedAt,
                'updated_at'     => $closedAt,
            ]);
        }

        // Turno ABIERTO ahora (para que el staff pueda operar)
        DB::table('shifts')->insert([
            'venue_id'      => $venue1->id,
            'staff_id'      => $staff1->id,
            'opened_at'     => now()->setTime(14, 0, 0),
            'closed_at'     => null,
            'cash_expected' => 0,
            'status'        => 'open',
            'created_at'    => now()->setTime(14, 0, 0),
            'updated_at'    => now(),
        ]);

        $this->command->info('Shifts: ' . DB::table('shifts')->count() . ' turnos creados (1 abierto ahora)');
    }
}
