<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\LoginOtpMail;
use App\Models\LoginOtp;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\ReferralProfile;
use App\Models\User;
use App\Support\AuditLogger;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:40'],
            'gender' => ['required', 'in:M,F'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'organization_name' => [Rule::requiredIf(! $request->filled('invite_token')), 'nullable', 'string', 'min:2', 'max:150'],
            'invite_token' => ['nullable', 'string', 'size:48'],
            'referral_code' => ['nullable', 'string', 'exists:referral_profiles,code'],
        ]);

        [$user, $organization] = DB::transaction(function () use ($data): array {
            $invitation = null;
            if (! empty($data['invite_token'])) {
                $invitation = OrganizationInvitation::query()
                    ->where('token_hash', hash('sha256', $data['invite_token']))
                    ->whereNull('used_at')
                    ->whereNull('revoked_at')
                    ->where('expires_at', '>', now())
                    ->lockForUpdate()
                    ->first();

                abort_unless($invitation, 422, 'Ce lien d’invitation est invalide ou expiré.');
                $invitation->load('organization');
                abort_unless($invitation->organization->status === 'active', 422, 'Cette organisation est suspendue.');
                abort_unless($invitation->organization->hasMemberCapacity(), 422, 'La capacité de l’abonnement de cette organisation est atteinte.');
            }

            $user = User::create([
                'name' => trim($data['first_name'].' '.$data['last_name']),
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => strtolower($data['email']),
                'phone' => $data['phone'],
                'gender' => $data['gender'],
                'password' => $data['password'],
            ]);

            $organization = $invitation?->organization ?? Organization::create([
                'created_by' => $user->id,
                'name' => $data['organization_name'],
                'type' => 'association',
                'location' => 'À renseigner',
                'member_estimate' => 1,
                'subscription_plan' => 'free',
                'subscription_renewal_date' => now()->addDays(14)->toDateString(),
            ]);

            $organization->members()->create([
                'user_id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'phone' => $user->phone,
                'email' => $user->email,
                'gender' => $user->gender,
                'role' => $invitation ? 'member' : 'admin',
                'status' => 'active',
                'is_ghost' => false,
                'has_transaction_access' => ! $invitation,
                'join_date' => now()->toDateString(),
            ]);

            if ($invitation) {
                $invitation->update(['used_at' => now()]);
                AuditLogger::record($organization, $user, 'ADHESION_PAR_INVITATION', 'Inscription via un lien d’invitation.', 'member', $user->memberships()->latest()->value('id'));
            } elseif (! empty($data['referral_code'])) {
                ReferralProfile::where('code', $data['referral_code'])
                    ->firstOrFail()
                    ->conversions()
                    ->create(['organization_id' => $organization->id]);
            }

            return [$user, $organization];
        });

        return response()->json([
            'data' => [
                'token' => $user->createToken('cotiz-web')->plainTextToken,
                'user' => $this->userPayload($user, $organization),
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', strtolower($data['email']))->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        $challenge = $this->issueLoginOtp($user);

        return response()->json([
            'data' => [
                'challenge' => $challenge['challenge'],
                'expires_at' => $challenge['expires_at'],
            ],
        ], 202);
    }

    public function verifyLoginOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'challenge' => ['required', 'string', 'regex:/^[a-f0-9]{64}$/'],
            'code' => ['required', 'digits:6'],
        ]);

        $otp = LoginOtp::where('challenge_hash', hash('sha256', $data['challenge']))->first();

        if (! $otp || $otp->expires_at->isPast()) {
            $otp?->delete();

            throw ValidationException::withMessages([
                'code' => ['Ce code est invalide ou a expiré. Recommencez votre connexion.'],
            ]);
        }

        if ($otp->attempts >= 5) {
            $otp->delete();

            throw ValidationException::withMessages([
                'code' => ['Trop de tentatives. Recommencez votre connexion.'],
            ]);
        }

        if (! Hash::check($data['code'], $otp->code_hash)) {
            $otp->increment('attempts');

            if ($otp->attempts >= 5) {
                $otp->delete();
            }

            throw ValidationException::withMessages([
                'code' => ['Le code saisi est incorrect.'],
            ]);
        }

        $deleted = LoginOtp::where('_id', $otp->getKey())
            ->where('code_hash', $otp->code_hash)
            ->where('expires_at', '>', now())
            ->delete();

        if ($deleted !== 1) {
            throw ValidationException::withMessages([
                'code' => ['Ce code est invalide ou a déjà été utilisé.'],
            ]);
        }

        $user = User::find($otp->user_id);

        if (! $user) {
            throw ValidationException::withMessages([
                'code' => ['Ce code est invalide ou a expiré. Recommencez votre connexion.'],
            ]);
        }

        $organization = $user->memberships()
            ->where('status', 'active')
            ->with('organization')
            ->first()?->organization;

        return response()->json([
            'data' => [
                'token' => $user->createToken('cotiz-web')->plainTextToken,
                'user' => $this->userPayload($user, $organization),
            ],
        ]);
    }

    public function resendLoginOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'challenge' => ['required', 'string', 'regex:/^[a-f0-9]{64}$/'],
        ]);

        $otp = LoginOtp::where('challenge_hash', hash('sha256', $data['challenge']))->first();

        if (! $otp || $otp->expires_at->isPast()) {
            $otp?->delete();

            throw ValidationException::withMessages([
                'challenge' => ['Cette demande a expiré. Recommencez votre connexion.'],
            ]);
        }

        $user = User::find($otp->user_id);

        if (! $user) {
            $otp->delete();

            throw ValidationException::withMessages([
                'challenge' => ['Cette demande est invalide. Recommencez votre connexion.'],
            ]);
        }

        $challenge = $this->issueLoginOtp($user, $data['challenge']);

        return response()->json([
            'data' => [
                'challenge' => $challenge['challenge'],
                'expires_at' => $challenge['expires_at'],
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $organization = $user->memberships()
            ->where('status', 'active')
            ->with('organization')
            ->first()?->organization;

        return response()->json(['data' => $this->userPayload($user, $organization)]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Déconnexion réussie.']);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'first_name' => ['sometimes', 'required', 'string', 'max:100'],
            'last_name' => ['sometimes', 'required', 'string', 'max:100'],
            'phone' => ['sometimes', 'required', 'string', 'max:40'],
            'gender' => ['sometimes', 'required', 'in:M,F'],
            'avatar' => ['sometimes', 'nullable', 'url', 'max:2048'],
        ]);

        if (isset($data['first_name']) || isset($data['last_name'])) {
            $data['name'] = trim(($data['first_name'] ?? $user->first_name).' '.($data['last_name'] ?? $user->last_name));
        }

        $user->update($data);

        $user->memberships()->where('status', 'active')->update(array_filter([
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'phone' => $user->phone,
            'gender' => $user->gender,
            'avatar' => $user->avatar,
        ], fn ($value) => $value !== null));

        return response()->json(['data' => $this->userPayload($user->fresh(), null)]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $status = Password::sendResetLink($request->only('email'));

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages(['email' => [__($status)]]);
        }

        return response()->json(['message' => __($status)]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $status = Password::reset($data, function (User $user, string $password): void {
            $user->forceFill([
                'password' => $password,
                'remember_token' => Str::random(60),
            ])->save();
            $user->tokens()->delete();
            event(new PasswordReset($user));
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => [__($status)]]);
        }

        return response()->json(['message' => __($status)]);
    }

    private function userPayload(User $user, ?Organization $organization): array
    {
        $memberships = $user->memberships()
            ->where('status', 'active')
            ->with('organization')
            ->get();
        $currentMembership = $organization
            ? $memberships->firstWhere('organization_id', $organization->id)
            : $memberships->first();

        return [
            'id' => (string) $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone ?? '',
            'gender' => $user->gender ?? 'M',
            'avatar' => $user->avatar,
            'role' => $user->global_role === 'superadmin' ? 'superadmin' : ($currentMembership?->role ?? 'member'),
            'current_org_id' => $currentMembership ? (string) $currentMembership->organization_id : '',
            'accessible_org_ids' => $memberships->pluck('organization_id')->map(fn ($id) => (string) $id)->all(),
            'created_at' => $user->created_at?->toISOString(),
        ];
    }

    private function issueLoginOtp(User $user, ?string $challenge = null): array
    {
        LoginOtp::where('user_id', (string) $user->id)->delete();
        LoginOtp::where('expires_at', '<=', now())->delete();

        $challenge ??= bin2hex(random_bytes(32));
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $otp = LoginOtp::create([
            'user_id' => (string) $user->id,
            'challenge_hash' => hash('sha256', $challenge),
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(15),
        ]);

        try {
            Mail::to($user->email)->send(new LoginOtpMail(
                $code,
                $user->first_name ?: $user->name,
            ));
        } catch (\Throwable $exception) {
            $otp->delete();

            throw $exception;
        }

        return [
            'challenge' => $challenge,
            'expires_at' => $otp->expires_at->toISOString(),
        ];
    }
}
