<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class GlobalAdminController extends Controller
{
    public function users(): JsonResponse
    {
        return response()->json(['data' => User::query()->orderBy('last_name')->orderBy('first_name')->limit(1000)->get([
            'id', 'first_name', 'last_name', 'email', 'phone', 'gender', 'avatar', 'global_role', 'created_at',
        ])]);
    }

    public function updateRole(Request $request, User $user): JsonResponse
    {
        abort_if($request->user()->id === $user->id, 422, 'Vous ne pouvez pas modifier votre propre rôle.');
        $data = $request->validate(['global_role' => ['required', Rule::in(['member', 'superadmin'])]]);
        $user->update($data);

        $user->refresh();

        return response()->json(['data' => $user->only([
            'id', 'first_name', 'last_name', 'email', 'phone', 'gender', 'avatar', 'global_role', 'created_at',
        ])]);
    }

    public function organizations(): JsonResponse
    {
        return response()->json(['data' => Organization::with('creator')->withCount('members')->latest()->paginate(100)]);
    }
}
