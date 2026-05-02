<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedule_templates', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('field_id')->constrained()->restrictOnDelete();
            $table->unsignedTinyInteger('day_of_week'); // 0=Domingo … 6=Sábado
            $table->time('opens_at');
            $table->time('closes_at');
            $table->unsignedTinyInteger('slot_duration_min')->default(60);
            $table->decimal('price', 10, 2);
            $table->char('currency', 3)->default('PEN');
            $table->decimal('deposit_ratio', 4, 2)->default(0.30);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['field_id', 'day_of_week', 'opens_at'], 'uniq_schedule_field_day_start');
            $table->index(['field_id', 'is_active'], 'idx_schedule_field_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_templates');
    }
};
