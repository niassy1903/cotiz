<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContributionCycle extends MongoModel
{
    protected $attributes = [
        'expected_amount' => 0,
        'total_collected' => 0,
        'status' => 'open',
    ];

    protected $fillable = [
        'organization_id', 'contribution_id', 'contribution_title', 'cycle_number',
        'period_label', 'due_date', 'expected_amount', 'total_collected', 'status',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date:Y-m-d',
            'expected_amount' => 'float',
            'total_collected' => 'float',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function contribution(): BelongsTo
    {
        return $this->belongsTo(Contribution::class);
    }
}
