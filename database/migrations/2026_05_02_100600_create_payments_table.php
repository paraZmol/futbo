<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('public_id', 32)->unique();
            $table->foreignId('booking_id')->constrained()->restrictOnDelete();
            $table->string('gateway', 32);
            $table->string('gateway_payment_id', 120)->nullable();
            $table->string('idempotency_key', 64)->unique();
            $table->decimal('amount', 10, 2);
            $table->char('currency', 3)->default('PEN');
            $table->enum('type', ['deposit', 'balance', 'refund', 'platform_fee']);
            $table->enum('status', ['pending', 'approved', 'rejected', 'refunded', 'cancelled']);
            $table->json('gateway_response')->nullable();
            $table->timestamps();

            $table->index(['booking_id', 'type'], 'idx_payments_booking_type');
            $table->index(['gateway', 'gateway_payment_id'], 'idx_payments_gateway_ext');
            $table->index(['status', 'created_at'], 'idx_payments_status_created');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
