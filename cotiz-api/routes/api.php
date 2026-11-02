<?php

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BootstrapController;
use App\Http\Controllers\Api\ContributionController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\GlobalAdminController;
use App\Http\Controllers\Api\InvitationController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReferralController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/invitations/{token}', [InvitationController::class, 'preview'])->middleware('throttle:10,1');
    Route::prefix('auth')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
        Route::post('/login/verify', [AuthController::class, 'verifyLoginOtp'])->middleware('throttle:10,1');
        Route::post('/login/resend', [AuthController::class, 'resendLoginOtp'])->middleware('throttle:3,1');
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:3,1');
        Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::get('/me', [AuthController::class, 'me']);
            Route::patch('/profile', [AuthController::class, 'updateProfile']);
            Route::post('/logout', [AuthController::class, 'logout']);
        });
    });

    Route::middleware(['auth:sanctum', 'throttle:api'])->group(function (): void {
        Route::get('/bootstrap', BootstrapController::class);
        Route::get('/referrals', [ReferralController::class, 'show']);
        Route::post('/referrals/rotate', [ReferralController::class, 'rotate']);
        Route::get('/organizations', [OrganizationController::class, 'index']);
        Route::post('/organizations', [OrganizationController::class, 'store']);

        Route::prefix('admin')->middleware('global.role:superadmin')->group(function (): void {
            Route::get('/users', [GlobalAdminController::class, 'users']);
            Route::patch('/users/{user}/role', [GlobalAdminController::class, 'updateRole']);
            Route::get('/organizations', [GlobalAdminController::class, 'organizations']);
        });

        Route::prefix('organizations/{organization}')->group(function (): void {
            Route::post('/join', [MemberController::class, 'join']);
            Route::get('/', [OrganizationController::class, 'show'])->middleware('organization.role:member');

            Route::middleware('organization.role:admin')->group(function (): void {
                Route::patch('/', [OrganizationController::class, 'update']);
                Route::delete('/', [OrganizationController::class, 'scheduleDeletion']);
                Route::post('/restore', [OrganizationController::class, 'restoreDeletion']);
                Route::patch('/subscription', [OrganizationController::class, 'updatePlan']);
                Route::post('/invitations', [InvitationController::class, 'create']);
                Route::get('/audit-logs', [AuditLogController::class, 'index']);
                Route::post('/audit-logs/{auditLog}/undo', [PaymentController::class, 'undo']);

                Route::post('/members', [MemberController::class, 'store']);
                Route::get('/members', [MemberController::class, 'index']);
                Route::patch('/members/{member}', [MemberController::class, 'update']);
                Route::delete('/members/{member}', [MemberController::class, 'archive']);
                Route::post('/members/{member}/accept', [MemberController::class, 'accept']);
                Route::post('/members/{member}/reject', [MemberController::class, 'reject']);
                Route::patch('/members/{member}/transaction-access', [MemberController::class, 'toggleTransactionAccess']);
                Route::post('/members/{member}/transfer-admin', [MemberController::class, 'transferAdmin']);

                Route::post('/contributions', [ContributionController::class, 'store']);
                Route::patch('/contributions/{contribution}', [ContributionController::class, 'update']);
                Route::post('/contributions/{contribution}/cycles', [ContributionController::class, 'createCycle']);
                Route::post('/cycles/{cycle}/close', [ContributionController::class, 'closeCycle']);

                Route::get('/payments', [PaymentController::class, 'index']);
                Route::post('/payments/{payment}/validate', [PaymentController::class, 'validatePayment']);
                Route::post('/payments/{payment}/reject', [PaymentController::class, 'reject']);
                Route::post('/payments/{payment}/cancel', [PaymentController::class, 'cancel']);
                Route::post('/expenses', [ExpenseController::class, 'store']);
                Route::get('/expenses', [ExpenseController::class, 'index']);
                Route::post('/expenses/{expense}/cancel', [ExpenseController::class, 'cancel']);
                Route::get('/notifications', [NotificationController::class, 'index']);
                Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
                Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
            });

            Route::middleware('organization.role:member')->group(function (): void {
                Route::get('/contributions', [ContributionController::class, 'index']);
                Route::get('/cycles', [ContributionController::class, 'cycles']);
                Route::get('/payments', [PaymentController::class, 'index']);
                Route::post('/payments', [PaymentController::class, 'store']);
                Route::get('/expenses', [ExpenseController::class, 'index']);
                Route::get('/notifications', [NotificationController::class, 'index']);
                Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
                Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
            });
        });

        Route::patch('/admin/organizations/{organization}/status', [OrganizationController::class, 'updateStatus'])
            ->middleware('global.role:superadmin');
    });
});
