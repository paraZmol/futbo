<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleTemplateModel extends Model
{
    protected $table = 'schedule_templates';

    protected $fillable = [
        'field_id', 'day_of_week', 'opens_at', 'closes_at',
        'slot_duration_min', 'price', 'currency', 'deposit_ratio', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price'        => 'decimal:2',
            'deposit_ratio'=> 'decimal:2',
            'is_active'    => 'boolean',
        ];
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(FieldModel::class, 'field_id');
    }
}
