<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('slots', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('field_id')->constrained()->restrictOnDelete();
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('deposit_amount', 10, 2);
            $table->char('currency', 3)->default('PEN');
            $table->enum('state', [
                'available',
                'pending_payment',
                'reserved',
                'event_occupied',
                'completed',
                'expired',
            ])->default('available');
            $table->dateTime('lock_expires_at')->nullable();
            $table->unsignedInteger('version')->default(0);
            $table->timestamps();

            $table->unique(['field_id', 'starts_at'], 'uniq_slots_field_start');
            $table->index(['field_id', 'starts_at', 'state'], 'idx_slots_field_starts_state');
            $table->index(['state', 'lock_expires_at'], 'idx_slots_state_lock');
            $table->index(['field_id', 'state'], 'idx_slots_field_state');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('slots');
    }
};
