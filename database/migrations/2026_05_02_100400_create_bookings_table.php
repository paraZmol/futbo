<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('public_id', 32)->unique();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('venue_id')->constrained()->restrictOnDelete();
            $table->foreignId('field_id')->constrained()->restrictOnDelete();
            $table->string('idempotency_key', 64)->unique();
            $table->dateTime('slot_starts_at');
            $table->dateTime('slot_ends_at');
            $table->decimal('price_total', 10, 2);
            $table->decimal('deposit_amount', 10, 2);
            $table->decimal('balance_due', 10, 2);
            $table->decimal('platform_fee', 10, 2)->default(0);
            $table->char('currency', 3)->default('PEN');
            $table->enum('status', [
                'pending_payment',
                'reserved',
                'checked_in',
                'completed',
                'no_show',
                'cancelled',
                'refunded',
            ])->default('pending_payment');
            $table->enum('source', ['app', 'web', 'walk_in'])->default('app');
            $table->string('qr_token', 64)->unique()->nullable();
            $table->foreignId('staff_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('cancellation_reason')->nullable();
            $table->dateTime('checked_in_at')->nullable();
            $table->dateTime('no_show_at')->nullable();
            $table->dateTime('cancelled_at')->nullable();
            $table->unsignedInteger('version')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'status'], 'idx_bookings_user_status');
            $table->index(['venue_id', 'status', 'slot_starts_at'], 'idx_bookings_venue_status_start');
            $table->index(['status', 'slot_starts_at'], 'idx_bookings_status_start');
            $table->index('qr_token', 'idx_bookings_qr');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
