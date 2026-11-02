<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LoginOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $code,
        public readonly string $recipientName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Votre code de connexion Cotiz');
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.auth.login-otp',
            text: 'emails.auth.login-otp-text',
            with: [
                'appUrl' => rtrim((string) config('app.frontend_url'), '/'),
            ],
        );
    }
}
