<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

final class DatabaseSeeder extends Seeder
{
    /**
     * Orden obligatorio: usuarios → venues+slots → bookings → shifts → ratings → eventos → audit
     * Siempre usar: php artisan migrate:fresh --seed
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,    // 10 usuarios (admin, 2 partners, 2 staff, 5 jugadores)
            VenueSeeder::class,   // 3 venues, 10 canchas, 30 días de slots (~4800 slots)
            BookingSeeder::class, // ~45 reservas (14 pasadas + 7 hoy + 28 futuras)
            ShiftSeeder::class,   // 9 turnos (8 cerrados + 1 abierto ahora)
            RatingSeeder::class,  // ~11 calificaciones de reservas completadas
            EventSeeder::class,   // 3 bloqueos (torneo, mantenimiento, privado)
            AuditLogSeeder::class,// logs de acciones admin y staff
        ]);

        $this->command->newLine();
        $this->command->info('════════════════════════════════════════════');
        $this->command->info('  Base de datos lista para evaluacion');
        $this->command->info('════════════════════════════════════════════');
        $this->command->newLine();
        $this->command->table(
            ['Rol', 'Email', 'Contraseña'],
            [
                ['Admin',   'admin@canchasapp.pe',    'Admin1234!'],
                ['Partner', 'partner@canchasapp.pe',  'Partner1234!'],
                ['Staff',   'staff@canchasapp.pe',    'Staff1234!'],
                ['Usuario', 'user@canchasapp.pe',     'User1234!'],
            ]
        );
        $this->command->newLine();
        $this->command->info('  URLs para probar:');
        $this->command->info('  http://localhost:8000/          → App usuario');
        $this->command->info('  http://localhost:8000/partner   → Dashboard partner');
        $this->command->info('  http://localhost:8000/staff     → PWA staff');
        $this->command->info('  http://localhost:8000/admin     → Backoffice admin');
        $this->command->info('════════════════════════════════════════════');
    }
}
