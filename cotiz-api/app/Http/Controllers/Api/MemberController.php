<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationMember;
use App\Models\User;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MemberController extends Controller
{
    public function index(Organization $organization): JsonResponse
    {
        return response()->json([
            'data' => $organization->members()->orderBy('last_name')->orderBy('first_name')->get(),
        ]);
    }

    public function store(Request $request, Organization $organization): JsonResponse
    {
        abort_unless($organization->hasMemberCapacity(), 422, 'La capacité de votre abonnement est atteinte.');
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'phone' => ['required', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:255'],
            'gender' => ['required', 'in:M,F'],
            'role' => ['required', 'in:admin,member'],
            'is_ghost' => ['required', 'boolean'],
        ]);

        $linkedUser = isset($data['email']) ? User::where('email', strtolower($data['email']))->first() : null;

        if ($linkedUser && $organization->members()->where('user_id', $linkedUser->id)->exists()) {
            return response()->json(['message' => 'Ce compte est déjà membre de cette organisation.'], 422);
        }

        $member = DB::transaction(function () use ($request, $organization, $data, $linkedUser): OrganizationMember {
            $member = $organization->members()->create([
                ...$data,
                'email' => isset($data['email']) ? strtolower($data['email']) : null,
                'user_id' => $linkedUser?->id,
                'status' => 'active',
                'has_transaction_access' => $data['role'] === 'admin',
                'join_date' => now()->toDateString(),
            ]);

            AuditLogger::record($organization, $request->user(), 'AJOUT_MEMBRE', "Ajout de {$member->first_name} {$member->last_name}.", 'member', $member->id);

            return $member;
        });

        return response()->json(['data' => $member], 201);
    }

    public function join(Request $request, Organization $organization): JsonResponse
    {
        abort_unless($organization->status === 'active', 403, 'Cette organisation est suspendue.');
        $user = $request->user();
        $member = $organization->members()->where('user_id', $user->id)->first();

        if ($member && $member->status !== 'archived') {
            return response()->json(['message' => 'Une demande ou adhésion existe déjà.'], 409);
        }

        $data = [
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'phone' => $user->phone ?? '',
            'email' => $user->email,
            'gender' => $user->gender ?? 'M',
            'role' => 'member',
            'status' => 'pending',
            'is_ghost' => false,
            'has_transaction_access' => false,
            'join_date' => now()->toDateString(),
        ];

        if ($member) {
            $member->update($data);
        } else {
            $member = $organization->members()->create([...$data, 'user_id' => $user->id]);
        }

        return response()->json(['data' => $member], 201);
    }

    public function update(Request $request, Organization $organization, OrganizationMember $member): JsonResponse
    {
        abort_unless($member->organization_id === $organization->id, 404);
        $data = $request->validate([
            'first_name' => ['sometimes', 'required', 'string', 'max:100'],
            'last_name' => ['sometimes', 'required', 'string', 'max:100'],
            'phone' => ['sometimes', 'required', 'string', 'max:40'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'gender' => ['sometimes', 'required', 'in:M,F'],
            'is_ghost' => ['sometimes', 'boolean'],
        ]);
        if (array_key_exists('email', $data) && $data['email']) {
            $data['email'] = strtolower($data['email']);
        }
        $member->update($data);
        AuditLogger::record($organization, $request->user(), 'MODIFICATION_MEMBRE', 'Mise à jour de la fiche membre.', 'member', $member->id);

        return response()->json(['data' => $member->fresh()]);
    }

    public function archive(Request $request, Organization $organization, OrganizationMember $member): JsonResponse
    {
        abort_unless($member->organization_id === $organization->id, 404);
        abort_if($member->role === 'admin' && $organization->members()->where('role', 'admin')->where('status', 'active')->count() <= 1, 422, 'Transférez le rôle administrateur avant de retirer ce membre.');

        $member->update(['status' => 'archived']);
        AuditLogger::record($organization, $request->user(), 'RETRAIT_MEMBRE', 'Archivage logique du membre.', 'member', $member->id);

        return response()->json(['data' => $member->fresh()]);
    }

    public function accept(Request $request, Organization $organization, OrganizationMember $member): JsonResponse
    {
        abort_unless($member->organization_id === $organization->id, 404);
        abort_unless($member->status === 'pending', 422, 'Cette demande n’est plus en attente.');
        abort_unless($organization->hasMemberCapacity(), 422, 'La capacité de votre abonnement est atteinte.');
        $member->update(['status' => 'active']);
        AuditLogger::record($organization, $request->user(), 'ACCEPTATION_MEMBRE', 'Demande d’adhésion acceptée.', 'member', $member->id);

        return response()->json(['data' => $member->fresh()]);
    }

    public function reject(Request $request, Organization $organization, OrganizationMember $member): JsonResponse
    {
        abort_unless($member->organization_id === $organization->id, 404);
        abort_unless($member->status === 'pending', 422, 'Cette demande n’est plus en attente.');
        $member->delete();
        AuditLogger::record($organization, $request->user(), 'REFUS_MEMBRE', 'Demande d’adhésion refusée.', 'member', $member->id);

        return response()->json(['message' => 'Demande refusée.']);
    }

    public function toggleTransactionAccess(Request $request, Organization $organization, OrganizationMember $member): JsonResponse
    {
        abort_unless($member->organization_id === $organization->id, 404);
        $member->update(['has_transaction_access' => ! $member->has_transaction_access]);
        AuditLogger::record($organization, $request->user(), 'ACCES_TRANSACTIONS', 'Modification de l’accès aux transactions financières.', 'member', $member->id);

        return response()->json(['data' => $member->fresh()]);
    }

    public function transferAdmin(Request $request, Organization $organization, OrganizationMember $member): JsonResponse
    {
        abort_unless($member->organization_id === $organization->id && $member->status === 'active', 404);
        DB::transaction(function () use ($request, $organization, $member): void {
            $organization->members()->where('role', 'admin')->update(['role' => 'member', 'has_transaction_access' => false]);
            $member->update(['role' => 'admin', 'has_transaction_access' => true]);
            AuditLogger::record($organization, $request->user(), 'TRANSFERT_ROLE_ADMIN', "Rôle administrateur transféré à {$member->first_name} {$member->last_name}.", 'organization', $organization->id);
        });

        return response()->json(['data' => $member->fresh()]);
    }
}
