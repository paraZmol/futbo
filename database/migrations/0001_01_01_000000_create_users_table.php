<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('public_id', 32)->unique();
            $table->string('name', 120);
            $table->string('email', 191)->unique();
            $table->string('password')->nullable();
            $table->string('phone', 20)->nullable();
            $table->dateTime('phone_verified_at')->nullable();
            $table->enum('role', ['user', 'partner', 'staff', 'admin'])->default('user');
            $table->enum('status', ['active', 'suspended', 'deleted'])->default('active');
            $table->dateTime('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['email', 'status'], 'idx_users_email_status');
            $table->index(['role', 'status'], 'idx_users_role_status');
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
