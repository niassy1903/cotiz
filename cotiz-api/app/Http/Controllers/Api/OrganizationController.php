<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrganizationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Organization::query()->with('creator')->withCount([
            'members as member_estimate' => fn ($members) => $members->where('status', 'active'),
        ]);

        if ($user->global_role !== 'superadmin') {
            $query->whereHas('members', fn ($members) => $members
                ->where('user_id', $user->id)
                ->where('status', 'active'));
        }

        return response()->json(['data' => $query->orderBy('name')->get()->map(fn (Organization $organization) => $this->payload($organization))]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:150'],
            'type' => ['required', 'in:dahira,tontine,association'],
            'description' => ['nullable', 'string', 'max:5000'],
            'logo_url' => ['nullable', 'url', 'max:2048'],
            'location' => ['required', 'string', 'max:255'],
            'member_estimate' => ['sometimes', 'integer', 'min:0', 'max:1000000'],
            'wave_number' => ['nullable', 'string', 'max:40'],
            'orange_money_number' => ['nullable', 'string', 'max:40'],
        ]);

        $organization = DB::transaction(function () use ($request, $data): Organization {
            $organization = Organization::create([
                ...$data,
                'created_by' => $request->user()->id,
                'subscription_plan' => 'free',
                'subscription_renewal_date' => now()->addDays(14)->toDateString(),
            ]);

            $user = $request->user();
            $organization->members()->create([
                'user_id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'phone' => $user->phone ?? '',
                'email' => $user->email,
                'gender' => $user->gender ?? 'M',
                'role' => 'admin',
                'status' => 'active',
                'is_ghost' => false,
                'has_transaction_access' => true,
                'join_date' => now()->toDateString(),
            ]);

            AuditLogger::record($organization, $user, 'CREATION_ORGANISATION', "Création de l'organisation {$organization->name}", 'organization', $organization->id);

            return $organization;
        });

        return response()->json(['data' => $this->payload($organization->load('creator'))], 201);
    }

    public function show(Organization $organization): JsonResponse
    {
        return response()->json(['data' => $this->payload($organization->load('creator')->loadCount([
            'members as member_estimate' => fn ($members) => $members->where('status', 'active'),
        ]))]);
    }

    public function update(Request $request, Organization $organization): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'min:2', 'max:150'],
            'type' => ['sometimes', 'required', 'in:dahira,tontine,association'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'logo_url' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'location' => ['sometimes', 'required', 'string', 'max:255'],
            'member_estimate' => ['sometimes', 'integer', 'min:0', 'max:1000000'],
            'wave_number' => ['sometimes', 'nullable', 'string', 'max:40'],
            'orange_money_number' => ['sometimes', 'nullable', 'string', 'max:40'],
        ]);

        $organization->update($data);
        AuditLogger::record($organization, $request->user(), 'MODIFICATION_ORGANISATION', 'Mise à jour des paramètres de l’organisation.', 'organization', $organization->id);

        return response()->json(['data' => $this->payload($organization->fresh()->load('creator'))]);
    }

    public function scheduleDeletion(Request $request, Organization $organization): JsonResponse
    {
        $organization->update([
            'status' => 'pending_deletion',
            'deletion_scheduled_at' => now()->addDays(30),
        ]);
        AuditLogger::record($organization, $request->user(), 'SUPPRESSION_ORGANISATION', 'Suppression programmée avec 30 jours de rétention.', 'organization', $organization->id);

        return response()->json(['data' => $this->payload($organization->fresh()->load('creator'))]);
    }

    public function restoreDeletion(Request $request, Organization $organization): JsonResponse
    {
        abort_unless($organization->status === 'pending_deletion', 422, 'Aucune suppression différée à annuler.');
        $organization->update(['status' => 'active', 'deletion_scheduled_at' => null]);
        AuditLogger::record($organization, $request->user(), 'RESTAURATION_ORGANISATION', 'Annulation de la suppression différée.', 'organization', $organization->id);

        return response()->json(['data' => $this->payload($organization->fresh()->load('creator'))]);
    }

    public function updatePlan(Request $request, Organization $organization): JsonResponse
    {
        $data = $request->validate(['subscription_plan' => ['required', 'in:free,basic,premium']]);
        $limit = match ($data['subscription_plan']) {
            'free' => 10,
            'basic' => 75,
            'premium' => null,
        };
        abort_if(
            $limit !== null && $organization->members()->where('status', 'active')->count() > $limit,
            422,
            'Le nombre de membres actifs dépasse la capacité de ce forfait.',
        );
        $organization->update($data);
        AuditLogger::record($organization, $request->user(), 'CHANGEMENT_ABONNEMENT', 'Passage au plan '.strtoupper($data['subscription_plan']), 'organization', $organization->id);

        return response()->json(['data' => $this->payload($organization->fresh()->load('creator'))]);
    }

    public function updateStatus(Request $request, Organization $organization): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'in:active,suspended']]);
        $organization->update($data);

        return response()->json(['data' => $this->payload($organization->fresh()->load('creator'))]);
    }

    private function payload(Organization $organization): array
    {
        $organization->loadMissing('creator');
        $admin = $organization->members()->where('role', 'admin')->where('status', 'active')->first();

        return [
            'id' => (string) $organization->id,
            'name' => $organization->name,
            'type' => $organization->type,
            'description' => $organization->description,
            'logo_url' => $organization->logo_url,
            'location' => $organization->location,
            'member_estimate' => $organization->members()->where('status', 'active')->count(),
            'admin_id' => (string) ($admin?->user_id ?? $admin?->id ?? ''),
            'admin_name' => $admin ? trim($admin->first_name.' '.$admin->last_name) : '',
            'wave_number' => $organization->wave_number ?? '',
            'orange_money_number' => $organization->orange_money_number ?? '',
            'subscription_plan' => $organization->subscription_plan,
            'subscription_renewal_date' => $organization->subscription_renewal_date?->format('Y-m-d') ?? '',
            'status' => $organization->status,
            'deletion_scheduled_at' => $organization->deletion_scheduled_at?->toISOString(),
            'created_at' => $organization->created_at?->toISOString(),
        ];
    }
}
