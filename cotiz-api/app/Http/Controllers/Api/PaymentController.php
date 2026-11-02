<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Contribution;
use App\Models\ContributionCycle;
use App\Models\Organization;
use App\Models\OrganizationMember;
use App\Models\Payment;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PaymentController extends Controller
{
    public function index(Request $request, Organization $organization): JsonResponse
    {
        $query = $organization->payments()->with('validator')->latest('payment_date');
        $membership = $request->attributes->get('organizationMembership');
        if ($request->user()->global_role !== 'superadmin' && $membership?->role !== 'admin' && ! $membership?->has_transaction_access) {
            $query->where('member_id', $membership?->id);
        }

        return response()->json(['data' => $query->limit(1000)->get()->map(fn (Payment $payment) => $this->payload($payment))]);
    }

    public function store(Request $request, Organization $organization): JsonResponse
    {
        $data = $request->validate([
            'contribution_id' => ['required', 'string', Rule::exists('contributions', 'id')->where('organization_id', $organization->id)],
            'cycle_id' => ['nullable', 'string', Rule::exists('contribution_cycles', 'id')->where('organization_id', $organization->id)],
            'member_id' => ['required', 'string', Rule::exists('organization_members', 'id')->where('organization_id', $organization->id)->where('status', 'active')],
            'amount' => ['required', 'numeric', 'gt:0', 'max:9999999999'],
            'method' => ['required', Rule::in(['wave', 'orange_money', 'cash'])],
            'transaction_id' => ['nullable', 'string', 'max:100', Rule::unique('payments', 'transaction_id')->where('organization_id', $organization->id)],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $membership = $request->attributes->get('organizationMembership');
        $isAdmin = $request->user()->global_role === 'superadmin' || $membership?->role === 'admin';
        $member = OrganizationMember::where('organization_id', $organization->id)->findOrFail($data['member_id']);
        abort_unless($isAdmin || $member->id === $membership?->id, 403, 'Vous ne pouvez déclarer un paiement que pour votre propre compte.');

        $contribution = Contribution::where('organization_id', $organization->id)->findOrFail($data['contribution_id']);
        $cycleId = $data['cycle_id'] ?? ContributionCycle::query()
            ->where('organization_id', $organization->id)
            ->where('contribution_id', $contribution->id)
            ->where('status', 'open')
            ->orderBy('cycle_number')
            ->value('id');
        if ($cycleId) {
            $cycle = ContributionCycle::where('organization_id', $organization->id)->findOrFail($cycleId);
            abort_unless($cycle->contribution_id === $contribution->id && $cycle->status === 'open', 422, 'Cette échéance ne peut pas recevoir de paiement.');
        }

        $payment = DB::transaction(function () use ($request, $organization, $member, $contribution, $data, $cycleId): Payment {
            $payment = $organization->payments()->create([
                ...$data,
                'cycle_id' => $cycleId,
                'created_by' => $request->user()->id,
                'contribution_title' => $contribution->title,
                'member_name' => trim($member->first_name.' '.$member->last_name),
                'member_phone' => $member->phone,
                'transaction_id' => $data['transaction_id'] ?? strtoupper(substr($data['method'], 0, 2)).'-'.str()->random(12),
                'status' => 'pending',
                'payment_date' => now(),
            ]);

            $organization->notifications()->create([
                'target_user_id' => $organization->members()->where('role', 'admin')->where('status', 'active')->value('user_id'),
                'title' => 'Nouveau paiement reçu',
                'message' => "{$payment->member_name} a soumis {$payment->amount} FCFA via {$payment->method}.",
                'type' => 'payment',
            ]);
            AuditLogger::record($organization, $request->user(), 'INITIATION_PAIEMENT', "Nouveau paiement de {$payment->amount} FCFA ({$payment->method}).", 'payment', $payment->id);

            return $payment;
        });

        return response()->json(['data' => $this->payload($payment)], 201);
    }

    public function validatePayment(Request $request, Organization $organization, Payment $payment): JsonResponse
    {
        abort_unless($payment->organization_id === $organization->id, 404);
        $data = $request->validate(['notes' => ['sometimes', 'nullable', 'string', 'max:2000']]);

        $payment = DB::transaction(function () use ($request, $organization, $payment, $data): Payment {
            $payment = Payment::whereKey($payment->id)->lockForUpdate()->firstOrFail();
            abort_unless($payment->status === 'pending', 422, 'Seul un paiement en attente peut être validé.');
            $payment->update([
                'status' => 'validated',
                'notes' => $data['notes'] ?? $payment->notes,
                'validated_at' => now(),
                'validated_by' => $request->user()->id,
            ]);
            if ($payment->cycle_id) {
                ContributionCycle::whereKey($payment->cycle_id)->lockForUpdate()->increment('total_collected', $payment->amount);
            }
            AuditLogger::record($organization, $request->user(), 'VALIDATION_PAIEMENT', "Validation du paiement de {$payment->amount} FCFA pour {$payment->member_name}.", 'payment', $payment->id);

            return $payment;
        });

        return response()->json(['data' => $this->payload($payment->fresh()->load('validator'))]);
    }

    public function reject(Request $request, Organization $organization, Payment $payment): JsonResponse
    {
        abort_unless($payment->organization_id === $organization->id, 404);
        $data = $request->validate(['reason' => ['required', 'string', 'min:2', 'max:1000']]);
        DB::transaction(function () use ($request, $organization, $payment, $data): void {
            $payment = Payment::whereKey($payment->id)->lockForUpdate()->firstOrFail();
            abort_unless($payment->status === 'pending', 422, 'Seul un paiement en attente peut être rejeté.');
            $payment->update(['status' => 'rejected', 'reject_reason' => $data['reason']]);
            AuditLogger::record($organization, $request->user(), 'REJET_PAIEMENT', 'Rejet du paiement : '.$data['reason'], 'payment', $payment->id);
        });

        return response()->json(['data' => $this->payload($payment->fresh())]);
    }

    public function cancel(Request $request, Organization $organization, Payment $payment): JsonResponse
    {
        abort_unless($payment->organization_id === $organization->id, 404);
        $membership = $request->attributes->get('organizationMembership');
        $isAdmin = $request->user()->global_role === 'superadmin' || $membership?->role === 'admin';
        abort_unless($isAdmin || ($payment->created_by === $request->user()->id && $payment->status === 'pending'), 403);
        abort_if(in_array($payment->status, ['cancelled', 'rejected'], true), 422, 'Ce paiement ne peut plus être annulé.');

        DB::transaction(function () use ($request, $organization, $payment): void {
            if ($payment->status === 'validated' && $payment->cycle_id) {
                $cycle = ContributionCycle::whereKey($payment->cycle_id)->lockForUpdate()->firstOrFail();
                $cycle->update(['total_collected' => max(0, $cycle->total_collected - $payment->amount)]);
            }
            $payment->update(['status' => 'cancelled']);
            AuditLogger::record($organization, $request->user(), 'ANNULATION_PAIEMENT', "Annulation du paiement de {$payment->amount} FCFA.", 'payment', $payment->id);
        });

        return response()->json(['data' => $this->payload($payment->fresh())]);
    }

    public function undo(Request $request, Organization $organization, AuditLog $auditLog): JsonResponse
    {
        abort_unless($auditLog->organization_id === $organization->id, 404);
        abort_if($auditLog->is_undone || ! $auditLog->can_undo_until || $auditLog->can_undo_until->isPast(), 422, 'Le délai d’annulation est dépassé ou cette action est déjà annulée.');
        abort_unless(in_array($auditLog->resource_type, ['payment', 'expense'], true), 422, 'Cette action ne peut pas être annulée.');

        DB::transaction(function () use ($request, $organization, $auditLog): void {
            if ($auditLog->resource_type === 'payment') {
                $payment = Payment::where('organization_id', $organization->id)->findOrFail($auditLog->resource_id);
                if ($payment->status !== 'cancelled' && $payment->status !== 'rejected') {
                    if ($payment->status === 'validated' && $payment->cycle_id) {
                        $cycle = ContributionCycle::whereKey($payment->cycle_id)->lockForUpdate()->firstOrFail();
                        $cycle->update(['total_collected' => max(0, $cycle->total_collected - $payment->amount)]);
                    }
                    $payment->update(['status' => 'cancelled']);
                }
            } else {
                $expense = $organization->expenses()->findOrFail($auditLog->resource_id);
                $expense->update(['status' => 'cancelled', 'cancelled_at' => now()]);
            }
            $auditLog->update(['is_undone' => true]);
            AuditLogger::record($organization, $request->user(), 'ANNULATION_ACTION', "Annulation de l’action {$auditLog->action}.", $auditLog->resource_type, $auditLog->resource_id);
        });

        return response()->json(['data' => $auditLog->fresh()]);
    }

    private function payload(Payment $payment): array
    {
        $payment->loadMissing('validator');
        $data = $payment->toArray();
        $data['validated_by'] = $payment->validator ? trim($payment->validator->first_name.' '.$payment->validator->last_name) : null;

        return $data;
    }
}
