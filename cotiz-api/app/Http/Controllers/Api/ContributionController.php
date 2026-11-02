<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contribution;
use App\Models\ContributionCycle;
use App\Models\Organization;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ContributionController extends Controller
{
    public function index(Organization $organization): JsonResponse
    {
        return response()->json(['data' => $organization->contributions()->orderByDesc('created_at')->get()]);
    }

    public function cycles(Organization $organization): JsonResponse
    {
        return response()->json(['data' => $organization->contributions()
            ->with('cycles')
            ->get()
            ->flatMap(fn (Contribution $contribution) => $contribution->cycles)
            ->values()]);
    }

    public function store(Request $request, Organization $organization): JsonResponse
    {
        $data = $this->validated($request);
        $contribution = DB::transaction(function () use ($request, $organization, $data): Contribution {
            $contribution = $organization->contributions()->create([
                ...$data,
                'created_by' => $request->user()->id,
                'status' => $data['status'] ?? 'active',
            ]);
            $this->buildCycle($organization, $contribution, 1, $data['start_date']);
            AuditLogger::record($organization, $request->user(), 'CREATION_COTISATION', "Création de la cotisation : {$contribution->title}", 'contribution', $contribution->id);

            return $contribution;
        });

        return response()->json(['data' => $contribution], 201);
    }

    public function update(Request $request, Organization $organization, Contribution $contribution): JsonResponse
    {
        abort_unless($contribution->organization_id === $organization->id, 404);
        $data = $this->validated($request, true);
        $contribution->update($data);
        AuditLogger::record($organization, $request->user(), 'MODIFICATION_COTISATION', 'Mise à jour des paramètres de cotisation.', 'contribution', $contribution->id);

        return response()->json(['data' => $contribution->fresh()]);
    }

    public function createCycle(Request $request, Organization $organization, Contribution $contribution): JsonResponse
    {
        abort_unless($contribution->organization_id === $organization->id, 404);
        $data = $request->validate([
            'period_label' => ['required', 'string', 'max:100'],
            'due_date' => ['required', 'date'],
            'expected_amount' => ['sometimes', 'numeric', 'min:0'],
        ]);

        $cycle = DB::transaction(function () use ($request, $organization, $contribution, $data): ContributionCycle {
            $number = (int) $contribution->cycles()->max('cycle_number') + 1;
            $cycle = $this->buildCycle(
                $organization,
                $contribution,
                $number,
                $data['due_date'],
                $data['period_label'],
                $data['expected_amount'] ?? $this->expectedAmount($organization, $contribution),
            );
            AuditLogger::record($organization, $request->user(), 'CREATION_ECHEANCE', "Création de l’échéance {$cycle->period_label}.", 'contribution', $contribution->id);

            return $cycle;
        });

        return response()->json(['data' => $cycle], 201);
    }

    public function closeCycle(Request $request, Organization $organization, ContributionCycle $cycle): JsonResponse
    {
        abort_unless($cycle->organization_id === $organization->id, 404);
        abort_unless($cycle->status === 'open', 422, 'Cette échéance est déjà clôturée.');
        $cycle->update(['status' => 'closed']);
        AuditLogger::record($organization, $request->user(), 'CLOTURE_ECHEANCE', 'Clôture de l’échéance.', 'contribution', $cycle->id);

        return response()->json(['data' => $cycle->fresh()]);
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes|required' : 'required';

        return $request->validate([
            'title' => [$required, 'string', 'max:150'],
            'amount_type' => [$required, Rule::in(['fixed', 'minimum'])],
            'amount' => [$required, 'numeric', 'gt:0', 'max:9999999999'],
            'amount_female' => ['sometimes', 'nullable', 'numeric', 'gt:0', 'max:9999999999'],
            'frequency' => [$required, Rule::in(['weekly', 'biweekly', 'monthly', 'quarterly', 'annual'])],
            'day_of_month' => ['sometimes', 'nullable', 'integer', 'between:1,31'],
            'start_date' => [$required, 'date'],
            'target_type' => [$required, Rule::in(['all', 'custom', 'by_gender'])],
            'target_member_ids' => ['sometimes', 'array'],
            'target_member_ids.*' => [
                'string',
                Rule::exists('organization_members', 'id')
                    ->where('organization_id', $request->route('organization')->id),
            ],
            'status' => ['sometimes', Rule::in(['active', 'inactive', 'archived'])],
        ]);
    }

    private function expectedAmount(Organization $organization, Contribution $contribution): float
    {
        $members = $organization->members()->where('status', 'active');
        if ($contribution->target_type === 'custom') {
            $members->whereIn('id', $contribution->target_member_ids ?? []);
        } elseif ($contribution->target_type === 'by_gender') {
            $members->whereIn('gender', ['M', 'F']);
        }

        $amount = $members->get(['gender'])->sum(
            fn ($member) => $contribution->target_type === 'by_gender' && $member->gender === 'F'
                ? ($contribution->amount_female ?? $contribution->amount)
                : $contribution->amount,
        );

        return (float) max($contribution->amount, $amount);
    }

    private function buildCycle(
        Organization $organization,
        Contribution $contribution,
        int $number,
        string $dueDate,
        ?string $periodLabel = null,
        ?float $expectedAmount = null,
    ): ContributionCycle {
        $date = Carbon::parse($dueDate);

        return $contribution->cycles()->create([
            'organization_id' => $organization->id,
            'contribution_title' => $contribution->title,
            'cycle_number' => $number,
            'period_label' => $periodLabel ?? $date->locale('fr')->translatedFormat('F Y'),
            'due_date' => $date->toDateString(),
            'expected_amount' => $expectedAmount ?? $this->expectedAmount($organization, $contribution),
            'total_collected' => 0,
            'status' => 'open',
        ]);
    }
}
