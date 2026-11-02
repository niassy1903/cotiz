<?php

namespace App\Models;

trait SerializesMongoId
{
    public function attributesToArray(): array
    {
        $attributes = parent::attributesToArray();

        if (array_key_exists('_id', $attributes)) {
            $attributes['id'] = $attributes['_id'];
            unset($attributes['_id']);
        }

        return $attributes;
    }
}
