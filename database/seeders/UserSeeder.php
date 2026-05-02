<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Infrastructure\Persistence\Eloquent\Models\UserModel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

final class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            // Admin
            [
                'public_id' => 'usr_admin000000000001',
                'name'      => 'Ricardo Mendoza',
                'email'     => 'admin@canchasapp.pe',
                'password'  => Hash::make('Admin1234!'),
                'role'      => 'admin',
                'status'    => 'active',
                'phone'     => '+51987654321',
            ],
            // Partners
            [
                'public_id' => 'usr_partner000000001',
                'name'      => 'Carlos Quispe',
                'email'     => 'partner@canchasapp.pe',
                'password'  => Hash::make('Partner1234!'),
                'role'      => 'partner',
                'status'    => 'active',
                'phone'     => '+51999111001',
            ],
            [
                'public_id' => 'usr_partner000000002',
                'name'      => 'Lucia Vargas',
                'email'     => 'partner2@canchasapp.pe',
                'password'  => Hash::make('Partner1234!'),
                'role'      => 'partner',
                'status'    => 'active',
                'phone'     => '+51999111002',
            ],
            // Staff
            [
                'public_id' => 'usr_staff0000000001',
                'name'      => 'Juan Lopez',
                'email'     => 'staff@canchasapp.pe',
                'password'  => Hash::make('Staff1234!'),
                'role'      => 'staff',
                'status'    => 'active',
                'phone'     => '+51999222001',
            ],
            [
                'public_id' => 'usr_staff0000000002',
                'name'      => 'Ana Flores',
                'email'     => 'staff2@canchasapp.pe',
                'password'  => Hash::make('Staff1234!'),
                'role'      => 'staff',
                'status'    => 'active',
                'phone'     => '+51999222002',
            ],
            // Usuarios jugadores
            [
                'public_id' => 'usr_user00000000001',
                'name'      => 'Maria Torres',
                'email'     => 'user@canchasapp.pe',
                'password'  => Hash::make('User1234!'),
                'role'      => 'user',
                'status'    => 'active',
                'phone'     => '+51999333001',
            ],
            [
                'public_id' => 'usr_user00000000002',
                'name'      => 'Pedro Castillo',
                'email'     => 'pedro@canchasapp.pe',
                'password'  => Hash::make('User1234!'),
                'role'      => 'user',
                'status'    => 'active',
                'phone'     => '+51999333002',
            ],
            [
                'public_id' => 'usr_user00000000003',
                'name'      => 'Diego Ramirez',
                'email'     => 'diego@canchasapp.pe',
                'password'  => Hash::make('User1234!'),
                'role'      => 'user',
                'status'    => 'active',
                'phone'     => '+51999333003',
            ],
            [
                'public_id' => 'usr_user00000000004',
                'name'      => 'Sofia Mendoza',
                'email'     => 'sofia@canchasapp.pe',
                'password'  => Hash::make('User1234!'),
                'role'      => 'user',
                'status'    => 'active',
                'phone'     => '+51999333004',
            ],
            [
                'public_id' => 'usr_user00000000005',
                'name'      => 'Andres Paredes',
                'email'     => 'andres@canchasapp.pe',
                'password'  => Hash::make('User1234!'),
                'role'      => 'user',
                'status'    => 'active',
                'phone'     => '+51999333005',
            ],
        ];

        foreach ($users as $data) {
            UserModel::updateOrCreate(['email' => $data['email']], $data);
        }

        $this->command->info('Usuarios: ' . count($users) . ' creados');
    }
}
