<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('venues', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('public_id', 32)->unique();
            $table->foreignId('partner_id')->constrained('users')->restrictOnDelete();
            $table->string('name', 120);
            $table->string('slug', 140)->unique();
            $table->text('address');
            $table->string('city', 80);
            $table->string('country_code', 2)->default('PE');
            $table->decimal('lat', 10, 7);
            $table->decimal('lng', 10, 7);
            // location es calculado desde lat/lng al guardar. NOT NULL requerido por SPATIAL INDEX en MySQL 8.
            // Se inicializa con ST_GeomFromText al crear el venue vía repositorio.
            $table->geometry('location', 'point', 4326);
            $table->string('phone', 20)->nullable();
            $table->string('whatsapp', 20)->nullable();
            $table->json('amenities')->nullable();
            $table->json('photos')->nullable();
            $table->enum('status', ['pending', 'active', 'suspended'])->default('pending');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'city'], 'idx_venues_status_city');
            $table->index('partner_id', 'idx_venues_partner');
        });

        // SPATIAL index must be created separately; Blueprint inline doesn't support it with SRID in MySQL 8
        DB::statement('ALTER TABLE venues ADD SPATIAL INDEX idx_venues_location (location)');
    }

    public function down(): void
    {
        Schema::dropIfExists('venues');
    }
};
