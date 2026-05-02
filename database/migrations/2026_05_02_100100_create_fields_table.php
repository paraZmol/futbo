<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fields', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('public_id', 32)->unique();
            $table->foreignId('venue_id')->constrained()->restrictOnDelete();
            $table->string('name', 80);
            $table->enum('sport', ['futbol5', 'futbol7', 'futbol11', 'padel', 'basket', 'tenis', 'otro']);
            $table->enum('surface', ['grass_natural', 'grass_sintetico', 'cemento', 'parquet', 'otro']);
            $table->unsignedTinyInteger('capacity_players')->default(10);
            $table->boolean('is_indoor')->default(false);
            $table->boolean('is_active')->default(true);
            $table->json('photos')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['venue_id', 'sport', 'is_active'], 'idx_fields_venue_sport');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fields');
    }
};
