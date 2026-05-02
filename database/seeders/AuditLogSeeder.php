<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

final class AuditLogSeeder extends Seeder
{
    public function run(): void
    {
        $admin   = DB::table('users')->where('role', 'admin')->first();
        $partner = DB::table('users')->where('role', 'partner')->first();

        if (!$admin || !$partner) return;

        $venues   = DB::table('venues')->get();
        $bookings = DB::table('bookings')->limit(5)->get();

        $logs = [];

        // Aprobaciones de partners
        foreach ($venues as $venue) {
            $logs[] = [
                'user_id'      => $admin->id,
                'action'       => 'partner.approved',
                'subject_type' => 'Venue',
                'subject_id'   => $venue->id,
                'before'       => json_encode(['status' => 'pending']),
                'after'        => json_encode(['status' => 'active']),
                'ip_address'   => '192.168.1.1',
                'user_agent'   => 'Mozilla/5.0 CanchasApp Admin',
                'created_at'   => now()->subDays(rand(5, 15)),
            ];
        }

        // Cancelaciones de reservas
        foreach ($bookings->where('status', 'cancelled') as $booking) {
            $logs[] = [
                'user_id'      => $booking->user_id,
                'action'       => 'booking.cancelled',
                'subject_type' => 'Booking',
                'subject_id'   => $booking->id,
                'before'       => json_encode(['status' => 'reserved']),
                'after'        => json_encode(['status' => 'cancelled', 'reason' => 'user_request']),
                'ip_address'   => '190.237.1.' . rand(1, 250),
                'user_agent'   => 'Mozilla/5.0 CanchasApp',
                'created_at'   => now()->subDays(rand(1, 7)),
            ];
        }

        // Check-ins
        foreach ($bookings->where('status', 'completed')->take(3) as $booking) {
            $logs[] = [
                'user_id'      => DB::table('users')->where('role', 'staff')->first()?->id,
                'action'       => 'booking.checked_in',
                'subject_type' => 'Booking',
                'subject_id'   => $booking->id,
                'before'       => json_encode(['status' => 'reserved']),
                'after'        => json_encode(['status' => 'checked_in']),
                'ip_address'   => '192.168.0.10',
                'user_agent'   => 'Mozilla/5.0 PWA Staff',
                'created_at'   => now()->subDays(rand(1, 5)),
            ];
        }

        if (!empty($logs)) {
            DB::table('audit_logs')->insert($logs);
        }

        $this->command->info('Audit logs: ' . count($logs) . ' entradas creadas');
    }
}
