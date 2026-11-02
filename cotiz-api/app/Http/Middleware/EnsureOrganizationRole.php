<?php

namespace App\Http\Middleware;

use App\Models\Organization;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOrganizationRole
{
    public function handle(Request $request, Closure $next, string $minimumRole = 'member'): Response
    {
        $organization = $request->route('organization');
        $organization = $organization instanceof Organization
            ? $organization
            : Organization::find($organization);

        if (! $organization) {
            abort(404);
        }

        $user = $request->user();
        $membership = $organization->members()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        if ($user->global_role === 'superadmin') {
            $request->attributes->set('organizationMembership', $membership);

            return $next($request);
        }

        abort_unless(
            $organization->status === 'active' || ($minimumRole === 'admin' && $organization->status === 'pending_deletion'),
            403,
            'Cette organisation est suspendue.',
        );

        if (! $membership) {
            abort(403, 'Vous ne faites pas partie de cette organisation.');
        }

        if ($minimumRole === 'admin' && $membership->role !== 'admin') {
            abort(403, 'Cette action est réservée aux administrateurs de l’organisation.');
        }

        $request->attributes->set('organizationMembership', $membership);

        return $next($request);
    }
}
