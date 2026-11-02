<?php

namespace Tests\Unit;

use Illuminate\Auth\Notifications\ResetPassword;
use Tests\TestCase;

class PasswordResetMailTest extends TestCase
{
    public function test_password_reset_mail_renders_branded_html_and_plain_text_with_the_frontend_link(): void
    {
        config(['app.frontend_url' => 'https://cotiz-one.vercel.app/']);

        $user = (object) [
            'first_name' => 'Fatou',
            'last_name' => 'Diallo',
            'email' => 'fatou@example.com',
        ];

        $mail = (new ResetPassword('reset-token'))->toMail($user);
        $html = view($mail->view['html'], $mail->viewData)->render();
        $text = view($mail->view['text'], $mail->viewData)->render();
        $resetUrl = 'https://cotiz-one.vercel.app/?reset_token=reset-token&email=fatou%40example.com';

        $this->assertSame('Réinitialisez votre mot de passe Cotiz', $mail->subject);
        $this->assertSame($resetUrl, $mail->actionUrl);
        $this->assertStringContainsString('Bonjour Fatou Diallo', $html);
        $this->assertStringContainsString('Réinitialiser mon mot de passe', $html);
        $this->assertStringContainsString('60 minutes', $html);
        $this->assertStringContainsString(e($resetUrl), $html);
        $this->assertStringContainsString($resetUrl, $text);
    }
}
