<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class BookingModel extends Model
{
    use SoftDeletes;

    protected $table = 'bookings';

    protected $fillable = [
        'public_id', 'user_id', 'venue_id', 'field_id', 'idempotency_key',
        'slot_starts_at', 'slot_ends_at', 'price_total', 'deposit_amount',
        'balance_due', 'platform_fee', 'currency', 'status', 'source',
        'qr_token', 'staff_id', 'cancellation_reason',
        'checked_in_at', 'no_show_at', 'cancelled_at', 'version',
    ];

    protected function casts(): array
    {
        return [
            'slot_starts_at' => 'datetime',
            'slot_ends_at'   => 'datetime',
            'checked_in_at'  => 'datetime',
            'no_show_at'     => 'datetime',
            'cancelled_at'   => 'datetime',
            'price_total'    => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'balance_due'    => 'decimal:2',
            'platform_fee'   => 'decimal:2',
            'version'        => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(UserModel::class, 'user_id');
    }

    public function bookingSlots(): HasMany
    {
        return $this->hasMany(BookingSlotModel::class, 'booking_id');
    }
}
