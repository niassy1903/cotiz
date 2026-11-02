<?php

namespace App\Models;

class LoginOtp extends MongoModel
{
    protected $table = 'login_otps';

    protected $fillable = [
        'user_id',
        'challenge_hash',
        'code_hash',
        'expires_at',
        'attempts',
    ];

    protected $casts = [
        'expires_at' => 'immutable_datetime',
        'attempts' => 'integer',
    ];

    protected $attributes = [
        'attempts' => 0,
    ];
}
