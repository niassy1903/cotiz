<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class ValidationLocalizationTest extends TestCase
{
    public function test_validation_errors_are_translated_into_french(): void
    {
        app()->setLocale('fr');

        $validator = Validator::make(
            ['password' => 'court'],
            ['password' => ['required', 'string', 'min:12']],
            [],
            ['password' => 'mot de passe'],
        );

        $this->assertSame(
            'Le champ mot de passe doit contenir au moins 12 caractères.',
            $validator->errors()->first(),
        );
    }
}
