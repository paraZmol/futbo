<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('idempotency_keys', function (Blueprint $table) {
            $table->string('key_value', 64)->primary();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->char('request_hash', 64); // SHA-256 del body
            $table->unsignedSmallInteger('response_status');
            $table->json('response_body');
            $table->dateTime('created_at');
            $table->dateTime('expires_at'); // 24h después de created_at

            $table->index('expires_at', 'idx_idempotency_expires');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('idempotency_keys');
    }
};
