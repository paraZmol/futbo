<?php

declare(strict_types=1);

namespace App\Infrastructure\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class RequireIdempotencyKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $key = $request->header('Idempotency-Key');

        if (empty($key)) {
            return response()->json([
                'error' => [
                    'code'    => 'IDEMPOTENCY_KEY_MISSING',
                    'message' => 'El header Idempotency-Key es obligatorio para esta operación.',
                ],
            ], 400);
        }

        return $next($request);
    }
}
