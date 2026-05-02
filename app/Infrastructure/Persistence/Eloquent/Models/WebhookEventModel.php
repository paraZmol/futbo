<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookEventModel extends Model
{
    protected $table = 'webhook_events';

    protected $fillable = [
        'gateway', 'event_id', 'event_type', 'payload',
        'signature_valid', 'processed', 'processing_error',
    ];

    protected function casts(): array
    {
        return [
            'payload'         => 'array',
            'signature_valid' => 'boolean',
            'processed'       => 'boolean',
        ];
    }
}
