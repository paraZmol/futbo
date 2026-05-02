<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShiftModel extends Model
{
    protected $table = 'shifts';

    protected $fillable = [
        'venue_id', 'staff_id', 'opened_at', 'closed_at',
        'cash_expected', 'cash_delivered', 'cash_variance',
        'closing_notes', 'status',
    ];

    protected function casts(): array
    {
        return [
            'opened_at'      => 'datetime',
            'closed_at'      => 'datetime',
            'cash_expected'  => 'decimal:2',
            'cash_delivered' => 'decimal:2',
            'cash_variance'  => 'decimal:2',
        ];
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(UserModel::class, 'staff_id');
    }

    public function venue(): BelongsTo
    {
        return $this->belongsTo(VenueModel::class, 'venue_id');
    }
}
