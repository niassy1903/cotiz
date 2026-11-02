<?php

namespace App\Models;

use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;
use MongoDB\Laravel\Eloquent\DocumentModel;

class PersonalAccessToken extends SanctumPersonalAccessToken
{
    use DocumentModel {
        attributesToArray as protected mongoAttributesToArray;
    }

    protected $keyType = 'string';

    public function attributesToArray(): array
    {
        $attributes = $this->mongoAttributesToArray();

        if (array_key_exists('_id', $attributes)) {
            $attributes['id'] = $attributes['_id'];
            unset($attributes['_id']);
        }

        return $attributes;
    }
}
