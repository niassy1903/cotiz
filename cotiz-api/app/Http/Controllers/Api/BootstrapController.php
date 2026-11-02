<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BootstrapController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $organizationsQuery = Organization::query()->with('creator');
        if ($user->global_role !== 'superadmin') {
            $organizationsQuery->whereHas('members', fn ($query) => $query
                ->where('user_id', $user->id)
                ->where('status', 'active'));
        }
        $organizations = $organizationsQuery->orderBy('name')->get();
        $requestedOrganizationId = $request->query('organization_id');
        $organization = $organizations->first(
            fn (Organization $item) => (string) $item->id === (string) $requestedOrganizationId,
        ) ?? $organizations->first();

        if (! $organization) {
            return response()->json([
                'data' => [
                    'user' => $this->userPayload($user, null, $organizations),
                    'organizations' => $organizations->map(fn (Organization $item) => $this->organizationPayload($item)),
                    'current_org_id' => '',
                    'members' => [],
                    'contributions' => [],
                    'cycles' => [],
                    'payments' => [],
                    'expenses' => [],
                    'notifications' => [],
                    'audit_logs' => [],
                ],
            ]);
        }

        $membership = $organization->members()->where('user_id', $user->id)->where('status', 'active')->first();
        $isAdmin = $user->global_role === 'superadmin' || $membership?->role === 'admin';
        $hasFinancialAccess = $isAdmin || $membership?->has_transaction_access;

        $members = $organization->members()->where('status', 'active')->orderBy('last_name')->get();
        if (! $isAdmin) {
            $members = $members->where('id', $membership?->id)->values();
        }

        $payments = $organization->payments()->with('validator')->latest('payment_date')->limit(1000)->get();
        if (! $hasFinancialAccess) {
            $payments = $payments->where('member_id', $membership?->id)->values();
        }

        return response()->json([
            'data' => [
                'user' => $this->userPayload($user, $membership, $organizations),
                'organizations' => $organizations->map(fn (Organization $item) => $this->organizationPayload($item)),
                'current_org_id' => (string) $organization->id,
                'members' => $members,
                'contributions' => $organization->contributions()->latest()->limit(500)->get(),
                'cycles' => $organization->contributions()->with('cycles')->get()->flatMap->cycles->values(),
                'payments' => $payments->map(fn ($payment) => [
                    ...$payment->toArray(),
                    'member_id' => (string) $payment->member_id,
                    'validated_by' => $payment->validator?->first_name
                        ? trim($payment->validator->first_name.' '.$payment->validator->last_name)
                        : null,
                ]),
                'expenses' => $hasFinancialAccess
                    ? $organization->expenses()->latest('date')->limit(500)->get()->map(fn ($expense) => [
                        ...$expense->toArray(),
                        'created_by_admin_id' => (string) $expense->created_by,
                    ])
                    : [],
                'notifications' => $organization->notifications()
                    ->where(fn ($query) => $query->whereNull('target_user_id')->orWhere('target_user_id', $user->id))
                    ->latest()
                    ->limit(100)
                    ->get()
                    ->map(fn ($notification) => [
                        'id' => (string) $notification->id,
                        'org_id' => (string) $notification->organization_id,
                        'target_user_id' => $notification->target_user_id ? (string) $notification->target_user_id : null,
                        'title' => $notification->title,
                        'message' => $notification->message,
                        'type' => $notification->type,
                        'read' => $notification->read_at !== null,
                        'date' => $notification->created_at?->toISOString(),
                        'link_action' => $notification->link_action,
                    ]),
                'audit_logs' => $isAdmin
                    ? $organization->auditLogs()->latest()->limit(500)->get()
                    : [],
            ],
        ]);
    }

    private function userPayload(User $user, $membership, $organizations): array
    {
        $activeMemberships = $user->memberships()->where('status', 'active')->get();

        return [
            'id' => (string) $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone ?? '',
            'gender' => $user->gender ?? 'M',
            'avatar' => $user->avatar,
            'role' => $user->global_role === 'superadmin' ? 'superadmin' : ($membership?->role ?? 'member'),
            'current_org_id' => $membership ? (string) $membership->organization_id : (string) ($organizations->first()?->id ?? ''),
            'accessible_org_ids' => $user->global_role === 'superadmin'
                ? $organizations->pluck('id')->map(fn ($id) => (string) $id)->all()
                : $activeMemberships->pluck('organization_id')->map(fn ($id) => (string) $id)->all(),
            'created_at' => $user->created_at?->toISOString(),
        ];
    }

    private function organizationPayload(Organization $organization): array
    {
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
