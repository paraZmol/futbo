<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingSlotModel extends Model
{
    protected $table = 'booking_slots';

    protected $fillable = ['booking_id', 'slot_id', 'unit_price_snapshot'];

    protected function casts(): array
    {
        return ['unit_price_snapshot' => 'decimal:2'];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(BookingModel::class, 'booking_id');
    }

    public function slot(): BelongsTo
    {
        return $this->belongsTo(SlotModel::class, 'slot_id');
    }
}
