<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InvitationController extends Controller
{
    public function create(Request $request, Organization $organization): JsonResponse
    {
        abort_unless($organization->status === 'active', 403, 'Cette organisation est suspendue.');
        $token = Str::random(48);

        DB::transaction(function () use ($request, $organization, $token): void {
            $organization->invitations()
                ->whereNull('used_at')
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);

            $organization->invitations()->create([
                'created_by' => $request->user()->id,
                'token_hash' => hash('sha256', $token),
                'expires_at' => now()->addHours(72),
            ]);
            AuditLogger::record($organization, $request->user(), 'CREATION_INVITATION', 'Création d’un lien d’adhésion valable 72 heures.', 'organization', $organization->id);
        });

        $frontendUrl = rtrim((string) config('app.frontend_url', 'http://localhost:3000'), '/');

        return response()->json([
            'data' => [
                'url' => $frontendUrl.'/?invite='.urlencode($token),
                'expires_at' => now()->addHours(72)->toISOString(),
            ],
        ], 201);
    }

    public function preview(string $token): JsonResponse
    {
        $invitation = OrganizationInvitation::query()
            ->where('token_hash', hash('sha256', $token))
            ->whereNull('used_at')
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->with('organization:id,name,type,status')
            ->first();

        abort_unless($invitation && $invitation->organization->status === 'active', 404, 'Ce lien d’invitation est invalide ou expiré.');

        return response()->json([
            'data' => [
                'organization' => [
                    'id' => (string) $invitation->organization->id,
                    'name' => $invitation->organization->name,
                    'type' => $invitation->organization->type,
                ],
                'expires_at' => $invitation->expires_at->toISOString(),
            ],
        ]);
    }
}
