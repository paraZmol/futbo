<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

final class EventSeeder extends Seeder
{
    public function run(): void
    {
        $fields = DB::table('fields')->get();
        if ($fields->isEmpty()) return;

        $field1 = $fields[0];

        $events = [
            [
                'field_id'  => $field1->id,
                'title'     => 'Torneo Interbarrial Los Pinos',
                'type'      => 'tournament',
                'starts_at' => now()->addDays(5)->setTime(8, 0, 0),
                'ends_at'   => now()->addDays(5)->setTime(20, 0, 0),
                'notes'     => 'Torneo mensual. 8 equipos inscritos.',
                'created_at'=> now(),
                'updated_at'=> now(),
            ],
            [
                'field_id'  => $field1->id,
                'title'     => 'Mantenimiento de grass',
                'type'      => 'maintenance',
                'starts_at' => now()->addDays(10)->setTime(8, 0, 0),
                'ends_at'   => now()->addDays(10)->setTime(18, 0, 0),
                'notes'     => 'Cambio de grass sintetico programado.',
                'created_at'=> now(),
                'updated_at'=> now(),
            ],
        ];

        if (isset($fields[2])) {
            $events[] = [
                'field_id'  => $fields[2]->id,
                'title'     => 'Evento Privado - Empresa SAC',
                'type'      => 'private',
                'starts_at' => now()->addDays(3)->setTime(14, 0, 0),
                'ends_at'   => now()->addDays(3)->setTime(20, 0, 0),
                'notes'     => 'Reserva corporativa. Acceso restringido.',
                'created_at'=> now(),
                'updated_at'=> now(),
            ];
        }

        foreach ($events as $event) {
            DB::table('events')->insert($event);

            // Marcar slots del período como event_occupied
            DB::table('slots')
                ->where('field_id', $event['field_id'])
                ->where('starts_at', '>=', $event['starts_at'])
                ->where('ends_at', '<=', $event['ends_at'])
                ->where('state', 'available')
                ->update(['state' => 'event_occupied', 'version' => 1, 'updated_at' => now()]);
        }

        $this->command->info('Events: ' . count($events) . ' eventos/bloqueos creados');
    }
}
