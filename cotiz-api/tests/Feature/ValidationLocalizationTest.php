<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class ValidationLocalizationTest extends TestCase
{
    public function test_password_validation_accepts_eight_characters_and_rejects_seven(): void
    {
        $rules = [
            'password' => [
                'required',
                'string',
                'min:8',
                'max:72',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,72}$/',
            ],
        ];

        $this->assertTrue(Validator::make(['password' => 'Aa1!bcde'], $rules)->passes());
        $this->assertFalse(Validator::make(['password' => 'Aa1!bcd'], $rules)->passes());
    }

    public function test_validation_errors_are_translated_into_french(): void
    {
        app()->setLocale('fr');

        $validator = Validator::make(
            ['password' => 'court'],
            ['password' => ['required', 'string', 'min:8']],
            [],
            ['password' => 'mot de passe'],
        );

        $this->assertSame(
            'Le champ mot de passe doit contenir au moins 8 caractères.',
            $validator->errors()->first(),
        );
    }
}
