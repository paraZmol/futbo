<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

final class RatingSeeder extends Seeder
{
    public function run(): void
    {
        // Califica solo reservas completadas
        $completedBookings = DB::table('bookings')
            ->where('status', 'completed')
            ->get();

        if ($completedBookings->isEmpty()) return;

        $comments = [
            5 => [
                'Excelente cancha, el grass es de primera. Volvemos la próxima semana.',
                'Todo perfecto, staff muy amable y las instalaciones impecables.',
                'La mejor cancha de Miraflores, sin duda. Muy recomendada.',
                'Buena iluminación, vestuarios limpios. 100% recomendable.',
            ],
            4 => [
                'Muy buena cancha, el estacionamiento es un poco pequeño pero todo lo demás excelente.',
                'Buen estado del grass, llegamos puntual y todo estaba listo.',
                'Buena experiencia en general, el precio es justo.',
            ],
            3 => [
                'La cancha está bien pero los vestuarios necesitan mantenimiento.',
                'Aceptable, pero esperábamos algo mejor por el precio.',
            ],
        ];

        $created = 0;
        foreach ($completedBookings as $booking) {
            // No todas las reservas tienen rating (80% de tasa)
            if ($created % 5 === 4) continue;

            $score    = [5, 5, 5, 4, 4, 5, 3, 5, 4, 5][$created % 10];
            $comment  = $comments[$score][$created % count($comments[$score])];

            DB::table('ratings')->insertOrIgnore([
                'booking_id' => $booking->id,
                'user_id'    => $booking->user_id,
                'venue_id'   => $booking->venue_id,
                'score'      => $score,
                'comment'    => $comment,
                'is_public'  => true,
                'created_at' => now()->subDays(rand(1, 10)),
                'updated_at' => now(),
            ]);
            $created++;
        }

        $this->command->info("Ratings: {$created} calificaciones creadas");
    }
}
