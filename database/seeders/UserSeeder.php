<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Infrastructure\Persistence\Eloquent\Models\UserModel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

final class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'public_id' => 'usr_admin000000000001',
                'name'      => 'Admin Principal',
                'email'     => 'admin@canchasapp.pe',
                'password'  => Hash::make('Admin1234!'),
                'role'      => 'admin',
                'status'    => 'active',
            ],
            [
                'public_id' => 'usr_partner000000001',
                'name'      => 'Carlos Quispe (Partner)',
                'email'     => 'partner@canchasapp.pe',
                'password'  => Hash::make('Partner1234!'),
                'role'      => 'partner',
                'status'    => 'active',
            ],
            [
                'public_id' => 'usr_staff0000000001',
                'name'      => 'Juan López (Staff)',
                'email'     => 'staff@canchasapp.pe',
                'password'  => Hash::make('Staff1234!'),
                'role'      => 'staff',
                'status'    => 'active',
            ],
            [
                'public_id' => 'usr_user00000000001',
                'name'      => 'María Torres (Usuario)',
                'email'     => 'user@canchasapp.pe',
                'password'  => Hash::make('User1234!'),
                'role'      => 'user',
                'status'    => 'active',
            ],
        ];

        foreach ($users as $data) {
            UserModel::updateOrCreate(['email' => $data['email']], $data);
        }
    }
}
