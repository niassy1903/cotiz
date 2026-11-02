<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganizationMember extends MongoModel
{
    protected $attributes = [
        'role' => 'member',
        'status' => 'active',
        'is_ghost' => false,
        'has_transaction_access' => false,
    ];

    protected $fillable = [
        'organization_id', 'user_id', 'first_name', 'last_name', 'phone', 'email',
        'gender', 'role', 'status', 'is_ghost', 'has_transaction_access', 'join_date', 'avatar',
    ];

    protected function casts(): array
    {
        return [
            'is_ghost' => 'boolean',
            'has_transaction_access' => 'boolean',
            'join_date' => 'date:Y-m-d',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
