<?php

namespace Tests\Feature;

use App\Mail\LoginOtpMail;
use App\Models\LoginOtp;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiTest extends TestCase
{
    use DatabaseMigrations;

    protected function setUp(): void
    {
        parent::setUp();

        DB::purge('mongodb');
    }

    public function test_registration_creates_an_admin_and_organization(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Aminata',
            'last_name' => 'Fall',
            'email' => 'aminata@example.test',
            'phone' => '+221770000000',
            'gender' => 'F',
            'password' => 'Aa1!bcde',
            'password_confirmation' => 'Aa1!bcde',
            'organization_name' => 'Association Test',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.user.role', 'admin')
            ->assertJsonStructure(['data' => ['token', 'user' => ['id', 'accessible_org_ids']]]);
        $this->assertNotEmpty($response->json('data.user.current_org_id'));
        $this->assertDatabaseHas('organizations', ['name' => 'Association Test']);
        $this->assertDatabaseHas('organization_members', ['role' => 'admin', 'status' => 'active']);
    }

    public function test_registration_rejects_passwords_shorter_than_eight_characters(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Aminata',
            'last_name' => 'Fall',
            'email' => 'aminata@example.test',
            'phone' => '+221770000000',
            'gender' => 'F',
            'password' => 'Aa1!xyz',
            'password_confirmation' => 'Aa1!xyz',
            'organization_name' => 'Association Test',
        ])->assertUnprocessable()->assertJsonValidationErrors(['password']);
    }

    public function test_registration_rejects_duplicate_email_and_phone(): void
    {
        User::factory()->create([
            'email' => 'duplicate@example.test',
            'phone' => '+221770000001',
            'password' => 'StrongPass123!',
        ]);

        $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Moussa',
            'last_name' => 'Diop',
            'email' => 'duplicate@example.test',
            'phone' => '+221770000099',
            'gender' => 'M',
            'password' => 'StrongPass123!',
            'password_confirmation' => 'StrongPass123!',
            'organization_name' => 'Association Test',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email']);

        $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Awa',
            'last_name' => 'Ndiaye',
            'email' => 'awa@example.test',
            'phone' => '+221770000001',
            'gender' => 'F',
            'password' => 'StrongPass123!',
            'password_confirmation' => 'StrongPass123!',
            'organization_name' => 'Association Deux',
        ])->assertUnprocessable()->assertJsonValidationErrors(['phone']);
    }

    public function test_private_api_requires_a_sanctum_token(): void
    {
        $this->getJson('/api/v1/bootstrap')->assertUnauthorized();
    }

    public function test_login_requires_an_email_otp_before_issuing_an_access_token(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $code = null;

        $challenge = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertAccepted()
            ->assertJsonStructure(['data' => ['challenge', 'expires_at']])
            ->assertJsonMissingPath('data.token');

        Mail::assertSent(LoginOtpMail::class, function (LoginOtpMail $mail) use ($user, &$code): bool {
            $code = $mail->code;

            return $mail->hasTo($user->email)
                && str_contains($mail->render(), $code)
                && str_contains($mail->render(), '15 minutes');
        });

        $this->assertDatabaseCount('login_otps', 1);
        $this->postJson('/api/v1/auth/login/verify', [
            'challenge' => $challenge->json('data.challenge'),
            'code' => $code,
        ])->assertOk()->assertJsonStructure(['data' => ['token', 'user' => ['id', 'email']]]);

        $this->assertDatabaseCount('login_otps', 0);
        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    public function test_login_otp_expires_and_cannot_be_used_after_expiration(): void
    {
        Mail::fake();
        $user = User::factory()->create();

        $challenge = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertAccepted();

        $otp = LoginOtp::where('challenge_hash', hash('sha256', $challenge->json('data.challenge')))->firstOrFail();
        $otp->update(['expires_at' => now()->subMinute()]);

        $this->postJson('/api/v1/auth/login/verify', [
            'challenge' => $challenge->json('data.challenge'),
            'code' => '123456',
        ])->assertUnprocessable();

        $this->assertDatabaseCount('login_otps', 0);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_login_otp_is_invalidated_after_five_incorrect_attempts(): void
    {
        Mail::fake();
        $user = User::factory()->create();

        $challenge = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertAccepted();

        $actualCode = Mail::sent(LoginOtpMail::class)->first()->code;
        $wrongCode = $actualCode === '000000' ? '000001' : '000000';

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/v1/auth/login/verify', [
                'challenge' => $challenge->json('data.challenge'),
                'code' => $wrongCode,
            ])->assertUnprocessable();
        }

        $this->assertDatabaseCount('login_otps', 0);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_resending_a_login_otp_invalidates_the_previous_code(): void
    {
        Mail::fake();
        $user = User::factory()->create();

        $challenge = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertAccepted();
        Mail::assertSent(LoginOtpMail::class);

        $this->postJson('/api/v1/auth/login/resend', [
            'challenge' => $challenge->json('data.challenge'),
        ])->assertOk();
        Mail::assertSent(LoginOtpMail::class, 2);
        $sentMails = Mail::sent(LoginOtpMail::class);
        $codes = [$sentMails[0]->code, $sentMails[1]->code];

        $this->postJson('/api/v1/auth/login/verify', [
            'challenge' => $challenge->json('data.challenge'),
            'code' => $codes[0],
        ])->assertUnprocessable();
        $this->assertDatabaseCount('personal_access_tokens', 0);

        $this->postJson('/api/v1/auth/login/verify', [
            'challenge' => $challenge->json('data.challenge'),
            'code' => $codes[1],
        ])->assertOk();
    }

    public function test_members_cannot_create_contributions_or_read_other_members_contacts(): void
    {
        [$organization] = $this->organizationWithAdmin();
        $member = User::factory()->create();
        $organization->members()->create([
            'user_id' => $member->id,
            'first_name' => $member->first_name,
            'last_name' => $member->last_name,
            'phone' => $member->phone,
            'email' => $member->email,
            'gender' => $member->gender,
            'role' => 'member',
            'status' => 'active',
            'is_ghost' => false,
            'has_transaction_access' => false,
            'join_date' => now()->toDateString(),
        ]);
        Sanctum::actingAs($member);

        $this->postJson("/api/v1/organizations/{$organization->id}/contributions", [
            'title' => 'Cotisation test',
            'amount_type' => 'fixed',
            'amount' => 5000,
            'frequency' => 'monthly',
            'start_date' => now()->toDateString(),
            'target_type' => 'all',
        ])->assertForbidden();

        $this->getJson("/api/v1/bootstrap?organization_id={$organization->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.members')
            ->assertJsonPath('data.members.0.email', $member->email);
    }

    public function test_members_can_submit_payments_with_mongodb_document_ids(): void
    {
        [$organization, $admin] = $this->organizationWithAdmin();
        $memberUser = User::factory()->create();
        $member = $organization->members()->create([
            'user_id' => $memberUser->id,
            'first_name' => $memberUser->first_name,
            'last_name' => $memberUser->last_name,
            'phone' => $memberUser->phone,
            'email' => $memberUser->email,
            'gender' => $memberUser->gender,
            'role' => 'member',
            'status' => 'active',
        ]);
        $contribution = $organization->contributions()->create([
            'created_by' => $admin->id,
            'title' => 'Cotisation MongoDB',
            'amount' => 1000,
            'frequency' => 'monthly',
            'start_date' => now()->toDateString(),
        ]);
        $cycle = $contribution->cycles()->create([
            'organization_id' => $organization->id,
            'contribution_title' => $contribution->title,
            'cycle_number' => 1,
            'period_label' => now()->format('F Y'),
            'due_date' => now()->toDateString(),
            'expected_amount' => 1000,
            'status' => 'open',
        ]);
        Sanctum::actingAs($memberUser);

        $this->postJson("/api/v1/organizations/{$organization->id}/payments", [
            'contribution_id' => (string) $contribution->id,
            'cycle_id' => (string) $cycle->id,
            'member_id' => (string) $member->id,
            'amount' => 1000,
            'method' => 'cash',
        ])->assertCreated()
            ->assertJsonPath('data.status', 'pending');
    }

    public function test_user_cannot_access_another_organization(): void
    {
        [$organization] = $this->organizationWithAdmin();
        $outsider = User::factory()->create();
        Sanctum::actingAs($outsider);

        $this->getJson("/api/v1/organizations/{$organization->id}")
            ->assertForbidden();
    }

    public function test_invitation_links_are_single_use_and_join_the_existing_organization(): void
    {
        [$organization, $admin] = $this->organizationWithAdmin();
        Sanctum::actingAs($admin);

        $invite = $this->postJson("/api/v1/organizations/{$organization->id}/invitations")
            ->assertCreated()
            ->json('data.url');
        parse_str((string) parse_url($invite, PHP_URL_QUERY), $query);
        $token = $query['invite'];

        $this->getJson("/api/v1/invitations/{$token}")
            ->assertOk()
            ->assertJsonPath('data.organization.name', $organization->name);

        $registration = [
            'first_name' => 'Ndeye',
            'last_name' => 'Ba',
            'email' => 'ndeeye@example.test',
            'phone' => '+221770000099',
            'gender' => 'F',
            'password' => 'StrongPass123!',
            'password_confirmation' => 'StrongPass123!',
            'invite_token' => $token,
        ];
        $this->postJson('/api/v1/auth/register', $registration)
            ->assertCreated()
            ->assertJsonPath('data.user.role', 'member')
            ->assertJsonPath('data.user.current_org_id', (string) $organization->id);

        $this->postJson('/api/v1/auth/register', [...$registration, 'email' => 'second@example.test'])
            ->assertUnprocessable();
    }

    public function test_referral_codes_are_persisted_and_track_registrations(): void
    {
        $referrer = User::factory()->create();
        Sanctum::actingAs($referrer);
        $code = $this->getJson('/api/v1/referrals')->assertOk()->json('data.code');

        $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Ibrahima',
            'last_name' => 'Sarr',
            'email' => 'ibrahima@example.test',
            'phone' => '+221770000098',
            'gender' => 'M',
            'password' => 'StrongPass123!',
            'password_confirmation' => 'StrongPass123!',
            'organization_name' => 'Nouvelle association',
            'referral_code' => $code,
        ])->assertCreated();

        $this->assertDatabaseHas('referral_conversions', [
            'referral_profile_id' => $referrer->referralProfile()->value('id'),
        ]);
    }

    public function test_password_reset_revokes_existing_access_tokens(): void
    {
        Notification::fake();
        config(['app.frontend_url' => 'https://cotiz-one.vercel.app']);
        $user = User::factory()->create();
        $user->createToken('test-device');

        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertOk();
        $token = null;
        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use (&$token): bool {
            $token = $notification->token;

            return true;
        });
        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user): bool {
            $mail = $notification->toMail($user);
            $resetUrl = $mail->actionUrl;
            parse_str((string) parse_url($resetUrl, PHP_URL_QUERY), $query);
            $html = view($mail->view['html'], $mail->viewData)->render();
            $text = view($mail->view['text'], $mail->viewData)->render();

            return parse_url($resetUrl, PHP_URL_HOST) === 'cotiz-one.vercel.app'
                && ($query['email'] ?? null) === $user->email
                && filled($query['reset_token'] ?? null)
                && $mail->subject === 'Réinitialisez votre mot de passe Cotiz'
                && str_contains($html, 'Réinitialiser mon mot de passe')
                && str_contains($html, e($resetUrl))
                && str_contains($text, $resetUrl);
        });

        $this->postJson('/api/v1/auth/reset-password', [
            'email' => $user->email,
            'token' => $token,
            'password' => 'NewStrongPass123!',
            'password_confirmation' => 'NewStrongPass123!',
        ])->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_recurring_contributions_generate_due_cycles(): void
    {
        [$organization, $admin] = $this->organizationWithAdmin();
        Sanctum::actingAs($admin);

        $this->postJson("/api/v1/organizations/{$organization->id}/contributions", [
            'title' => 'Cotisation récurrente',
            'amount_type' => 'fixed',
            'amount' => 1000,
            'frequency' => 'monthly',
            'start_date' => now()->subMonths(3)->toDateString(),
            'target_type' => 'all',
        ])->assertCreated();

        $this->artisan('cotiz:generate-cycles')->assertSuccessful();

        $this->assertGreaterThan(
            1,
            $organization->contributions()->where('title', 'Cotisation récurrente')->firstOrFail()->cycles()->count(),
        );
    }

    private function organizationWithAdmin(): array
    {
        $admin = User::factory()->create();
        $organization = Organization::create([
            'created_by' => $admin->id,
            'name' => 'Association de test',
            'type' => 'association',
            'location' => 'Dakar',
        ]);
        $organization->members()->create([
            'user_id' => $admin->id,
            'first_name' => $admin->first_name,
            'last_name' => $admin->last_name,
            'phone' => $admin->phone,
            'email' => $admin->email,
            'gender' => $admin->gender,
            'role' => 'admin',
            'status' => 'active',
            'is_ghost' => false,
            'has_transaction_access' => true,
            'join_date' => now()->toDateString(),
        ]);

        return [$organization, $admin];
    }
}
