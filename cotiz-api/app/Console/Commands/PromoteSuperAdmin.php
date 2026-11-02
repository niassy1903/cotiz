<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class PromoteSuperAdmin extends Command
{
    protected $signature = 'cotiz:promote-superadmin {email}';

    protected $description = 'Accorde le rôle superadmin à un compte existant.';

    public function handle(): int
    {
        $user = User::where('email', Str::lower((string) $this->argument('email')))->first();

        if (! $user) {
            $this->error('Aucun compte ne correspond à cette adresse.');

            return self::FAILURE;
        }

        $user->forceFill(['global_role' => 'superadmin'])->save();
        $this->info('Le rôle superadmin a été accordé.');

        return self::SUCCESS;
    }
}
