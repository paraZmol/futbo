<?php

declare(strict_types=1);

namespace App\Infrastructure\Http\Controllers;

use App\Infrastructure\Persistence\Eloquent\Models\UserModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

final readonly class AuthController
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        /** @var UserModel|null $user */
        $user = UserModel::where('email', $request->string('email'))->first();

        if (!$user || !Hash::check($request->string('password')->toString(), (string) $user->getAttribute('password'))) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales no son correctas.'],
            ]);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'user'  => [
                    'id'       => $user->id,
                    'publicId' => $user->getAttribute('public_id'),
                    'name'     => $user->getAttribute('name'),
                    'email'    => $user->getAttribute('email'),
                    'role'     => $user->getAttribute('role'),
                ],
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();
        return response()->json(null, 204);
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:120'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'phone'    => ['nullable', 'string', 'max:20'],
        ]);

        $user = UserModel::create([
            'public_id' => 'usr_' . strtolower(substr(bin2hex(random_bytes(12)), 0, 20)),
            'name'      => $data['name'],
            'email'     => $data['email'],
            'password'  => Hash::make($data['password']),
            'phone'     => $data['phone'] ?? null,
            'role'      => 'user',
            'status'    => 'active',
        ]);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'user'  => [
                    'id'       => $user->id,
                    'publicId' => $user->getAttribute('public_id'),
                    'name'     => $user->getAttribute('name'),
                    'email'    => $user->getAttribute('email'),
                    'role'     => $user->getAttribute('role'),
                ],
            ],
        ], 201);
    }
}
