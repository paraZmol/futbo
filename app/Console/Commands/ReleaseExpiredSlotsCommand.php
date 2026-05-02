<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Application\Shared\Clock;
use App\Domain\Slots\Exceptions\SlotConcurrentlyModifiedException;
use App\Domain\Slots\SlotRepository;
use Illuminate\Console\Command;

final class ReleaseExpiredSlotsCommand extends Command
{
    protected $signature   = 'app:release-expired-slots';
    protected $description = 'Release slots whose payment lock TTL has expired';

    public function handle(SlotRepository $slots, Clock $clock): int
    {
        $expired = $slots->findExpiredLocksBefore($clock->now());
        $released = 0;

        foreach ($expired as $slot) {
            try {
                $slot->release();
                $slots->save($slot);
                $released++;
            } catch (SlotConcurrentlyModifiedException) {
                continue;
            }
        }

        $this->info("Released {$released} expired slot(s).");
        return self::SUCCESS;
    }
}
