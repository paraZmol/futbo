<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FieldModel extends Model
{
    use SoftDeletes;

    protected $table = 'fields';

    protected $fillable = [
        'public_id', 'venue_id', 'name', 'sport', 'surface',
        'capacity_players', 'is_indoor', 'is_active', 'photos', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_indoor' => 'boolean',
            'is_active' => 'boolean',
            'photos'    => 'array',
        ];
    }

    public function venue(): BelongsTo
    {
        return $this->belongsTo(VenueModel::class, 'venue_id');
    }

    public function slots(): HasMany
    {
        return $this->hasMany(SlotModel::class, 'field_id');
    }
}
