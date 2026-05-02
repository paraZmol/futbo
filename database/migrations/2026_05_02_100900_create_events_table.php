<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('field_id')->constrained()->restrictOnDelete();
            $table->string('title', 120);
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->enum('type', ['maintenance', 'tournament', 'private', 'other'])->default('other');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['field_id', 'starts_at', 'ends_at'], 'idx_events_field_range');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
