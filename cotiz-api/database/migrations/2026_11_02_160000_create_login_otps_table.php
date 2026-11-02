<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('login_otps', function (Blueprint $table): void {
            $table->id();
            $table->string('user_id');
            $table->string('challenge_hash', 64)->unique();
            $table->string('code_hash');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->expire('expires_at', 0);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('login_otps');
    }
};
