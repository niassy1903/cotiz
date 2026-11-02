<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referral_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('user_id')->unique();
            $table->string('code', 32)->unique();
            $table->timestamps();
        });

        Schema::create('referral_conversions', function (Blueprint $table) {
            $table->id();
            $table->string('referral_profile_id');
            $table->string('organization_id')->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referral_conversions');
        Schema::dropIfExists('referral_profiles');
    }
};
