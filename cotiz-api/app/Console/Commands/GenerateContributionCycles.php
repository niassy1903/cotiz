<?php

namespace App\Console\Commands;

use App\Models\Contribution;
use App\Models\ContributionCycle;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class GenerateContributionCycles extends Command
{
    protected $signature = 'cotiz:generate-cycles';

    protected $description = 'Génère les échéances récurrentes arrivées à terme.';

    public function handle(): int
    {
        $created = 0;

        Contribution::query()
            ->where('status', 'active')
            ->whereHas('organization', fn ($query) => $query->where('status', 'active'))
            ->chunkById(100, function ($contributions) use (&$created): void {
                foreach ($contributions as $contribution) {
                    $created += DB::transaction(function () use ($contribution): int {
                        $contribution = Contribution::whereKey($contribution->id)->lockForUpdate()->firstOrFail();
                        $lastCycle = $contribution->cycles()->orderByDesc('cycle_number')->first();

                        if (! $lastCycle) {
                            return 0;
                        }

                        $nextDate = $this->nextDate(Carbon::parse($lastCycle->due_date), $contribution->frequency);
                        $number = $lastCycle->cycle_number + 1;
                        $createdForContribution = 0;

                        while ($nextDate->lte(today()) && $createdForContribution < 120) {
                            $members = $contribution->organization->members()->where('status', 'active');
                            if ($contribution->target_type === 'custom') {
                                $members->whereIn('id', $contribution->target_member_ids ?? []);
                            }

                            $expectedAmount = $members->get(['gender'])->sum(
                                fn ($member) => $contribution->target_type === 'by_gender' && $member->gender === 'F'
                                    ? ($contribution->amount_female ?? $contribution->amount)
                                    : $contribution->amount,
                            );

                            ContributionCycle::create([
                                'organization_id' => $contribution->organization_id,
                                'contribution_id' => $contribution->id,
                                'contribution_title' => $contribution->title,
                                'cycle_number' => $number,
                                'period_label' => $nextDate->copy()->locale('fr')->translatedFormat('F Y'),
                                'due_date' => $nextDate->toDateString(),
                                'expected_amount' => $expectedAmount,
                                'total_collected' => 0,
                                'status' => 'open',
                            ]);

                            $nextDate = $this->nextDate($nextDate, $contribution->frequency);
                            $number++;
                            $createdForContribution++;
                        }

                        return $createdForContribution;
                    });
                }
            });

        $this->info("Échéances créées : {$created}");

        return self::SUCCESS;
    }

    private function nextDate(Carbon $date, string $frequency): Carbon
    {
        return match ($frequency) {
            'weekly' => $date->copy()->addWeek(),
            'biweekly' => $date->copy()->addWeeks(2),
            'monthly' => $date->copy()->addMonthNoOverflow(),
            'quarterly' => $date->copy()->addMonthsNoOverflow(3),
            'annual' => $date->copy()->addYearNoOverflow(),
            default => throw new \InvalidArgumentException("Fréquence non supportée : {$frequency}"),
        };
    }
}
