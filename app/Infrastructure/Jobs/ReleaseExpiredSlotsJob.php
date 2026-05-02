<?php

declare(strict_types=1);

namespace App\Infrastructure\Jobs;

use App\Application\Shared\Clock;
use App\Domain\Slots\Exceptions\SlotConcurrentlyModifiedException;
use App\Domain\Slots\SlotRepository;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

final class ReleaseExpiredSlotsJob implements ShouldQueue
{
    use Queueable;

    public function handle(SlotRepository $slots, Clock $clock): void
    {
        $expired = $slots->findExpiredLocksBefore($clock->now());

        foreach ($expired as $slot) {
            try {
                $slot->release();
                $slots->save($slot);
            } catch (SlotConcurrentlyModifiedException) {
                // Payment was confirmed in the same instant — nothing to do
                continue;
            }
        }
    }
}
