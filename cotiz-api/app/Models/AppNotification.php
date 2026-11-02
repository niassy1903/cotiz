<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppNotification extends MongoModel
{
    protected $fillable = [
        'organization_id', 'target_user_id', 'title', 'message', 'type', 'read_at', 'link_action',
    ];

    protected function casts(): array
    {
        return ['read_at' => 'datetime'];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function targetUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_user_id');
    }
}
