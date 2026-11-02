<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends MongoModel
{
    protected $attributes = ['status' => 'active'];

    protected $fillable = [
        'organization_id', 'created_by', 'created_by_admin_name', 'amount', 'description',
        'date', 'category', 'status', 'cancelled_at',
    ];

    protected function casts(): array
    {
        return ['amount' => 'float', 'date' => 'date:Y-m-d', 'cancelled_at' => 'datetime'];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
