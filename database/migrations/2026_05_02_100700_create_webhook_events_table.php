<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhook_events', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('gateway', 32);
            $table->string('event_id', 120);
            $table->string('event_type', 80);
            $table->json('payload');
            $table->boolean('signature_valid')->default(false);
            $table->boolean('processed')->default(false);
            $table->text('processing_error')->nullable();
            $table->timestamps();

            // Idempotencia: el mismo evento del mismo gateway no se procesa dos veces
            $table->unique(['gateway', 'event_id'], 'uniq_webhook_gateway_event');
            $table->index(['processed', 'created_at'], 'idx_webhooks_processed');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_events');
    }
};
