<?php

declare(strict_types=1);

namespace App\Infrastructure\Providers;

use Illuminate\Support\ServiceProvider;

final class DomainServiceProvider extends ServiceProvider
{
    /**
     * Bindings between domain interfaces (ports) and infrastructure implementations (adapters).
     * Populated progressively as each domain module is implemented.
     *
     * @var array<class-string, class-string>
     */
    public array $bindings = [
        // Phase 3+ — bindings added here as use cases are implemented
        // Example:
        // \App\Domain\Reservations\BookingRepository::class =>
        //     \App\Infrastructure\Persistence\Eloquent\Repositories\EloquentBookingRepository::class,
    ];

    public function register(): void {}

    public function boot(): void {}
}
