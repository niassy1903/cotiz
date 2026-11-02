<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReferralProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReferralController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $profile = $this->profileFor($request);

        return response()->json(['data' => $this->payload($profile)]);
    }

    public function rotate(Request $request): JsonResponse
    {
        $profile = $this->profileFor($request);
        $profile->update(['code' => $this->newCode()]);

        return response()->json(['data' => $this->payload($profile->fresh())]);
    }

    private function profileFor(Request $request): ReferralProfile
    {
        return ReferralProfile::firstOrCreate(
            ['user_id' => $request->user()->id],
            ['code' => $this->newCode()],
        );
    }

    private function newCode(): string
    {
        do {
            $code = 'COTIZ-'.Str::upper(Str::random(8));
        } while (ReferralProfile::where('code', $code)->exists());

        return $code;
    }

    private function payload(ReferralProfile $profile): array
    {
        $profile->load('user', 'conversions.organization');

        return [
            'code' => $profile->code,
            'creator_name' => trim($profile->user->first_name.' '.$profile->user->last_name),
            'total_uses' => $profile->conversions->count(),
            'total_commission' => 0,
            'paid_commission' => 0,
            'pending_commission' => 0,
            'converted_orgs' => $profile->conversions->map(fn ($conversion) => [
                'org_name' => $conversion->organization->name,
                'date' => $conversion->created_at->toDateString(),
                'plan' => $conversion->organization->subscription_plan,
                'commission_amount' => 0,
            ])->values(),
            'payouts' => [],
        ];
    }
}
