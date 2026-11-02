<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends MongoModel
{
    protected $attributes = [
        'member_estimate' => 0,
        'subscription_plan' => 'free',
        'status' => 'active',
    ];

    protected $fillable = [
        'created_by', 'name', 'type', 'description', 'logo_url', 'location',
        'member_estimate', 'wave_number', 'orange_money_number', 'subscription_plan',
        'subscription_renewal_date', 'status', 'deletion_scheduled_at',
    ];

    protected function casts(): array
    {
        return ['subscription_renewal_date' => 'date:Y-m-d', 'deletion_scheduled_at' => 'datetime'];
    }

    public function hasMemberCapacity(): bool
    {
        $limit = match ($this->subscription_plan) {
            'free' => 10,
            'basic' => 75,
            'premium' => null,
            default => 0,
        };

        return $limit === null || $this->members()->where('status', 'active')->count() < $limit;
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members(): HasMany
    {
        return $this->hasMany(OrganizationMember::class);
    }

    public function contributions(): HasMany
    {
        return $this->hasMany(Contribution::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(AppNotification::class);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(OrganizationInvitation::class);
    }
}
