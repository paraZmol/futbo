<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ratings', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('booking_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('venue_id')->constrained()->restrictOnDelete();
            $table->unsignedTinyInteger('score'); // 1-5
            $table->text('comment')->nullable();
            $table->boolean('is_public')->default(true);
            $table->timestamps();

            $table->unique('booking_id', 'uniq_ratings_booking'); // 1 rating por booking
            $table->index(['venue_id', 'is_public', 'created_at'], 'idx_ratings_venue_public');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ratings');
    }
};
