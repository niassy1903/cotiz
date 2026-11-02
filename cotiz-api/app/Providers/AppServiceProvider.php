<?php

namespace App\Providers;

use App\Models\PersonalAccessToken;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(120)
            ->by($request->user()?->id ?: $request->ip()));

        ResetPassword::createUrlUsing(fn (object $user, string $token): string => $this->passwordResetUrl($user, $token));

        ResetPassword::toMailUsing(function (object $user, string $token): MailMessage {
            $resetUrl = $this->passwordResetUrl($user, $token);
            $recipientName = trim(($user->first_name ?? '').' '.($user->last_name ?? ''));

            return (new MailMessage)
                ->subject('Réinitialisez votre mot de passe Cotiz')
                ->action('Réinitialiser mon mot de passe', $resetUrl)
                ->view('emails.auth.password-reset', [
                    'recipientName' => $recipientName !== '' ? $recipientName : 'membre Cotiz',
                    'resetUrl' => $resetUrl,
                    'expiresMinutes' => config('auth.passwords.users.expire', 60),
                ])
                ->text('emails.auth.password-reset-text', [
                    'recipientName' => $recipientName !== '' ? $recipientName : 'membre Cotiz',
                    'resetUrl' => $resetUrl,
                    'expiresMinutes' => config('auth.passwords.users.expire', 60),
                ]);
        });
    }

    private function passwordResetUrl(object $user, string $token): string
    {
        return rtrim((string) config('app.frontend_url'), '/')
            .'/?reset_token='.urlencode($token).'&email='.urlencode((string) $user->email);
    }
}
