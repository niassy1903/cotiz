<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('created_by');
            $table->string('name');
            $table->string('type');
            $table->text('description')->nullable();
            $table->string('logo_url')->nullable();
            $table->string('location');
            $table->unsignedInteger('member_estimate')->default(0);
            $table->string('wave_number')->nullable();
            $table->string('orange_money_number')->nullable();
            $table->string('subscription_plan')->default('free');
            $table->date('subscription_renewal_date')->nullable();
            $table->string('status')->default('active');
            $table->timestamp('deletion_scheduled_at')->nullable();
            $table->timestamps();
        });

        Schema::create('organization_members', function (Blueprint $table) {
            $table->id();
            $table->string('organization_id');
            $table->string('user_id')->nullable();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('phone');
            $table->string('email')->nullable();
            $table->char('gender', 1);
            $table->string('role')->default('member');
            $table->string('status')->default('active');
            $table->boolean('is_ghost')->default(false);
            $table->boolean('has_transaction_access')->default(false);
            $table->date('join_date');
            $table->string('avatar')->nullable();
            $table->timestamps();
            $table->unique(['organization_id', 'user_id']);
            $table->index(['organization_id', 'status', 'role']);
        });

        Schema::create('contributions', function (Blueprint $table) {
            $table->id();
            $table->string('organization_id');
            $table->string('created_by');
            $table->string('title');
            $table->string('amount_type')->default('fixed');
            $table->decimal('amount', 12, 2);
            $table->decimal('amount_female', 12, 2)->nullable();
            $table->string('frequency');
            $table->unsignedTinyInteger('day_of_month')->nullable();
            $table->date('start_date');
            $table->string('target_type')->default('all');
            $table->json('target_member_ids')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
            $table->index(['organization_id', 'status']);
        });

        Schema::create('contribution_cycles', function (Blueprint $table) {
            $table->id();
            $table->string('organization_id');
            $table->string('contribution_id');
            $table->string('contribution_title');
            $table->unsignedInteger('cycle_number');
            $table->string('period_label');
            $table->date('due_date');
            $table->decimal('expected_amount', 12, 2)->default(0);
            $table->decimal('total_collected', 12, 2)->default(0);
            $table->string('status')->default('open');
            $table->timestamps();
            $table->unique(['contribution_id', 'cycle_number']);
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('organization_id');
            $table->string('contribution_id');
            $table->string('cycle_id')->nullable();
            $table->string('member_id');
            $table->string('created_by');
            $table->string('contribution_title');
            $table->string('member_name');
            $table->string('member_phone')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('method');
            $table->string('transaction_id');
            $table->string('status')->default('pending');
            $table->text('notes')->nullable();
            $table->text('reject_reason')->nullable();
            $table->timestamp('payment_date');
            $table->timestamp('validated_at')->nullable();
            $table->string('validated_by')->nullable();
            $table->timestamps();
            $table->unique(['organization_id', 'transaction_id']);
            $table->index(['organization_id', 'status', 'payment_date']);
        });

        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('organization_id');
            $table->string('created_by');
            $table->string('created_by_admin_name');
            $table->decimal('amount', 12, 2);
            $table->text('description');
            $table->date('date');
            $table->string('category');
            $table->string('status')->default('active');
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
            $table->index(['organization_id', 'date', 'status']);
        });

        Schema::create('app_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('organization_id');
            $table->string('target_user_id')->nullable();
            $table->string('title');
            $table->text('message');
            $table->string('type');
            $table->timestamp('read_at')->nullable();
            $table->string('link_action')->nullable();
            $table->timestamps();
            $table->index(['organization_id', 'target_user_id', 'read_at']);
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('organization_id');
            $table->string('user_id')->nullable();
            $table->string('user_name');
            $table->string('action');
            $table->text('details');
            $table->string('resource_type');
            $table->string('resource_id');
            $table->timestamp('can_undo_until')->nullable();
            $table->boolean('is_undone')->default(false);
            $table->timestamps();
            $table->index(['organization_id', 'created_at']);
            $table->index(['resource_type', 'resource_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('app_notifications');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('contribution_cycles');
        Schema::dropIfExists('contributions');
        Schema::dropIfExists('organization_members');
        Schema::dropIfExists('organizations');
    }
};
