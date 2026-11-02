<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;

class AuditLogController extends Controller
{
    public function index(Organization $organization): JsonResponse
    {
        return response()->json(['data' => $organization->auditLogs()->latest()->paginate(100)]);
    }
}
