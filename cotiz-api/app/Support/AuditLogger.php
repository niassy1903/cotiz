<?php

namespace App\Support;

use App\Models\AuditLog;
use App\Models\Organization;
use App\Models\User;

class AuditLogger
{
    public static function record(
        Organization $organization,
        ?User $user,
        string $action,
        string $details,
        string $resourceType,
        int|string $resourceId,
    ): AuditLog {
        return $organization->auditLogs()->create([
            'user_id' => $user?->id,
            'user_name' => $user ? trim($user->first_name.' '.$user->last_name) : 'Système',
            'action' => $action,
            'details' => $details,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'can_undo_until' => now()->addHour(),
        ]);
    }
}
