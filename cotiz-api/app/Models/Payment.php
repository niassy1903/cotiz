<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends MongoModel
{
    protected $attributes = ['status' => 'pending'];

    protected $fillable = [
        'organization_id', 'contribution_id', 'cycle_id', 'member_id', 'created_by',
        'contribution_title', 'member_name', 'member_phone', 'amount', 'method',
        'transaction_id', 'status', 'notes', 'reject_reason', 'payment_date',
        'validated_at', 'validated_by',
    ];

    protected function casts(): array
    {
        return ['amount' => 'float', 'payment_date' => 'datetime', 'validated_at' => 'datetime'];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function contribution(): BelongsTo
    {
        return $this->belongsTo(Contribution::class);
    }

    public function cycle(): BelongsTo
    {
        return $this->belongsTo(ContributionCycle::class, 'cycle_id');
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(OrganizationMember::class, 'member_id');
    }

    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }
}
