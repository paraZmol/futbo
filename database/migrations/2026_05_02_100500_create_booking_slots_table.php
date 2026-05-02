<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_slots', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('booking_id')->constrained()->restrictOnDelete();
            $table->foreignId('slot_id')->constrained()->restrictOnDelete();
            $table->decimal('unit_price_snapshot', 10, 2);
            $table->timestamps();

            // Tercera línea de defensa: un slot solo puede pertenecer a UN booking activo
            $table->unique('slot_id', 'uniq_booking_slots_slot_id');
            $table->index('booking_id', 'idx_booking_slots_booking');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_slots');
    }
};
