<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SlotModel extends Model
{
    protected $table = 'slots';

    protected $fillable = [
        'field_id', 'starts_at', 'ends_at', 'unit_price', 'deposit_amount',
        'currency', 'state', 'lock_expires_at', 'version',
    ];

    protected function casts(): array
    {
        return [
            'starts_at'       => 'datetime',
            'ends_at'         => 'datetime',
            'lock_expires_at' => 'datetime',
            'unit_price'      => 'decimal:2',
            'deposit_amount'  => 'decimal:2',
            'version'         => 'integer',
        ];
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(FieldModel::class, 'field_id');
    }
}
