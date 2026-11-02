<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Organization;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request, Organization $organization): JsonResponse
    {
        $membership = $request->attributes->get('organizationMembership');
        abort_unless(
            $request->user()->global_role === 'superadmin' || $membership?->role === 'admin' || $membership?->has_transaction_access,
            403,
            'Accès financier non autorisé.',
        );

        return response()->json(['data' => $organization->expenses()->latest('date')->limit(1000)->get()->map(fn (Expense $expense) => [
            ...$expense->toArray(),
            'created_by_admin_id' => (string) $expense->created_by,
        ])]);
    }

    public function store(Request $request, Organization $organization): JsonResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'gt:0', 'max:9999999999'],
            'description' => ['required', 'string', 'max:2000'],
            'date' => ['required', 'date'],
            'category' => ['required', 'in:Nourriture,Transport,Santé,Autres'],
        ]);
        $user = $request->user();
        $expense = $organization->expenses()->create([
            ...$data,
            'created_by' => $user->id,
            'created_by_admin_name' => trim($user->first_name.' '.$user->last_name),
            'status' => 'active',
        ]);
        AuditLogger::record($organization, $user, 'CREATION_DEPENSE', "Dépense de {$expense->amount} FCFA : {$expense->description}", 'expense', $expense->id);

        return response()->json(['data' => [...$expense->toArray(), 'created_by_admin_id' => (string) $expense->created_by]], 201);
    }

    public function cancel(Request $request, Organization $organization, Expense $expense): JsonResponse
    {
        abort_unless($expense->organization_id === $organization->id, 404);
        abort_unless($expense->status === 'active', 422, 'Cette dépense est déjà annulée.');
        $expense->update(['status' => 'cancelled', 'cancelled_at' => now()]);
        AuditLogger::record($organization, $request->user(), 'ANNULATION_DEPENSE', "Annulation de la dépense de {$expense->amount} FCFA.", 'expense', $expense->id);

        return response()->json(['data' => [...$expense->fresh()->toArray(), 'created_by_admin_id' => (string) $expense->created_by]]);
    }
}
