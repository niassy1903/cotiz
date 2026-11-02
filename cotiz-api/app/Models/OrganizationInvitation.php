<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganizationInvitation extends MongoModel
{
    protected $fillable = [
        'organization_id', 'created_by', 'token_hash', 'expires_at', 'used_at', 'revoked_at',
    ];

    protected function casts(): array
    {
        return ['expires_at' => 'datetime', 'used_at' => 'datetime', 'revoked_at' => 'datetime'];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
