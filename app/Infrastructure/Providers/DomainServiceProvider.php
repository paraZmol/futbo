<?php

declare(strict_types=1);

namespace App\Infrastructure\Providers;

use App\Application\Payments\WebhookJobDispatcher;
use App\Application\Shared\Clock;
use App\Application\Shared\IdGenerator;
use App\Application\Shared\LockManager;
use App\Application\Shared\TransactionManager;
use App\Domain\Payments\WebhookEventRepository;
use App\Domain\Reservations\BookingRepository;
use App\Domain\Shifts\ShiftRepository;
use App\Domain\Slots\SlotRepository;
use App\Infrastructure\Identity\UlidGenerator;
use App\Infrastructure\Locking\RedisLockManager;
use App\Infrastructure\Payments\LaravelWebhookJobDispatcher;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentBookingRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentShiftRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentSlotRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentWebhookEventRepository;
use App\Infrastructure\Time\SystemClock;
use App\Infrastructure\Transaction\LaravelTransactionManager;
use Illuminate\Support\ServiceProvider;
use Predis\Client as Redis;

final class DomainServiceProvider extends ServiceProvider
{
    /** @var array<class-string, class-string> */
    public array $bindings = [
        Clock::class               => SystemClock::class,
        TransactionManager::class  => LaravelTransactionManager::class,
        IdGenerator::class         => UlidGenerator::class,
        BookingRepository::class   => EloquentBookingRepository::class,
        SlotRepository::class      => EloquentSlotRepository::class,
        ShiftRepository::class     => EloquentShiftRepository::class,
        WebhookEventRepository::class => EloquentWebhookEventRepository::class,
        WebhookJobDispatcher::class   => LaravelWebhookJobDispatcher::class,
    ];

    public function register(): void
    {
        // Redis lock manager needs a Predis client instance
        $this->app->singleton(LockManager::class, function () {
            $redis = new Redis([
                'scheme' => 'tcp',
                'host'   => config('database.redis.default.host', '127.0.0.1'),
                'port'   => (int) config('database.redis.default.port', 6379),
            ]);
            return new RedisLockManager($redis);
        });

        // Webhook controller needs the secret from config
        $this->app->when(\App\Infrastructure\Http\Controllers\WebhookController::class)
            ->needs('$webhookSecret')
            ->give(fn() => (string) config('services.webhook.secret', ''));
    }

    public function boot(): void {}
}
