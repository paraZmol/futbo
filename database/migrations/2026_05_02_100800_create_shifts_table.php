<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shifts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('venue_id')->constrained()->restrictOnDelete();
            $table->foreignId('staff_id')->constrained('users')->restrictOnDelete();
            $table->dateTime('opened_at');
            $table->dateTime('closed_at')->nullable();
            $table->decimal('cash_expected', 10, 2)->default(0);
            $table->decimal('cash_delivered', 10, 2)->nullable();
            $table->decimal('cash_variance', 10, 2)->nullable();
            $table->text('closing_notes')->nullable();
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->timestamps();

            $table->index(['venue_id', 'status', 'opened_at'], 'idx_shifts_venue_status');
            $table->index(['staff_id', 'status'], 'idx_shifts_staff_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
