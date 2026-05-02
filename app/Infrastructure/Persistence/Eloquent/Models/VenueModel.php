<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class VenueModel extends Model
{
    use SoftDeletes;

    protected $table = 'venues';

    protected $fillable = [
        'public_id', 'partner_id', 'name', 'slug', 'address', 'city',
        'country_code', 'lat', 'lng', 'location', 'phone', 'whatsapp',
        'amenities', 'photos', 'status',
    ];

    protected function casts(): array
    {
        return [
            'lat'       => 'float',
            'lng'       => 'float',
            'amenities' => 'array',
            'photos'    => 'array',
        ];
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(UserModel::class, 'partner_id');
    }

    public function fields(): HasMany
    {
        return $this->hasMany(FieldModel::class, 'venue_id');
    }
}
