<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReferralConversion extends MongoModel
{
    protected $fillable = ['referral_profile_id', 'organization_id'];

    public function profile(): BelongsTo
    {
        return $this->belongsTo(ReferralProfile::class, 'referral_profile_id');
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
