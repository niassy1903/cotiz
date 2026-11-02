<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request, Organization $organization): JsonResponse
    {
        $notifications = $organization->notifications()
            ->where(fn ($query) => $query->whereNull('target_user_id')->orWhere('target_user_id', $request->user()->id))
            ->latest()
            ->paginate(min($request->integer('per_page', 50), 100));

        return response()->json(['data' => $notifications]);
    }

    public function markRead(Request $request, Organization $organization, AppNotification $notification): JsonResponse
    {
        abort_unless($notification->organization_id === $organization->id, 404);
        abort_unless($notification->target_user_id === null || $notification->target_user_id === $request->user()->id, 404);
        $notification->update(['read_at' => now()]);

        return response()->json(['data' => $this->payload($notification->fresh())]);
    }

    public function markAllRead(Request $request, Organization $organization): JsonResponse
    {
        $organization->notifications()
            ->where(fn ($query) => $query->whereNull('target_user_id')->orWhere('target_user_id', $request->user()->id))
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'Notifications marquées comme lues.']);
    }

    private function payload(AppNotification $notification): array
    {
        return [
            'id' => (string) $notification->id,
            'org_id' => (string) $notification->organization_id,
            'target_user_id' => $notification->target_user_id ? (string) $notification->target_user_id : null,
            'title' => $notification->title,
            'message' => $notification->message,
            'type' => $notification->type,
            'read' => $notification->read_at !== null,
            'date' => $notification->created_at?->toISOString(),
            'link_action' => $notification->link_action,
        ];
    }
}
