<?php

namespace App\Console\Commands;

use App\Models\Organization;
use Illuminate\Console\Command;

class PurgeScheduledOrganizations extends Command
{
    protected $signature = 'cotiz:purge-organizations';

    protected $description = 'Supprime les organisations dont le délai de rétention est écoulé.';

    public function handle(): int
    {
        $organizations = Organization::query()
            ->where('status', 'pending_deletion')
            ->whereNotNull('deletion_scheduled_at')
            ->where('deletion_scheduled_at', '<=', now());
        $count = $organizations->count();
        $organizations->delete();

        $this->info("Organisations supprimées : {$count}");

        return self::SUCCESS;
    }
}
