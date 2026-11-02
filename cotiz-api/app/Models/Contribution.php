<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contribution extends MongoModel
{
    protected $attributes = [
        'amount_type' => 'fixed',
        'target_type' => 'all',
        'status' => 'active',
    ];

    protected $fillable = [
        'organization_id', 'created_by', 'title', 'amount_type', 'amount', 'amount_female',
        'frequency', 'day_of_month', 'start_date', 'target_type', 'target_member_ids', 'status',
    ];

    protected function casts(): array
    {
        return ['amount' => 'float', 'amount_female' => 'float', 'start_date' => 'date:Y-m-d', 'target_member_ids' => 'array'];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function cycles(): HasMany
    {
        return $this->hasMany(ContributionCycle::class);
    }
}
