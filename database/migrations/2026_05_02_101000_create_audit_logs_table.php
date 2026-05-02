<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 80);
            $table->string('subject_type', 80);
            $table->unsignedBigInteger('subject_id');
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            // Solo created_at: esta tabla es append-only, nunca se actualiza
            $table->dateTime('created_at');

            $table->index(['subject_type', 'subject_id'], 'idx_audit_subject');
            $table->index(['user_id', 'created_at'], 'idx_audit_user_created');
            $table->index(['action', 'created_at'], 'idx_audit_action_created');
        });
        // Sin softDeletes ni updated_at: la tabla es inmutable por diseño
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
