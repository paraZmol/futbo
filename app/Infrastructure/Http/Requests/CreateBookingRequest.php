<?php

declare(strict_types=1);

namespace App\Infrastructure\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class CreateBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'venue_id'  => ['required', 'integer', 'min:1'],
            'field_id'  => ['required', 'integer', 'min:1'],
            'slot_ids'  => ['required', 'array', 'min:1', 'max:4'],
            'slot_ids.*'=> ['required', 'integer', 'min:1'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Idempotency-Key header is validated by middleware, not here
    }
}
