<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends MongoModel
{
    protected $attributes = ['is_undone' => false];

    protected $fillable = [
        'organization_id', 'user_id', 'user_name', 'action', 'details', 'resource_type',
        'resource_id', 'can_undo_until', 'is_undone',
    ];

    protected function casts(): array
    {
        return ['can_undo_until' => 'datetime', 'is_undone' => 'boolean'];
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
