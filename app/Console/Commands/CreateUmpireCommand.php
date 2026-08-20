<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\Status;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CreateUmpireCommand extends Command
{
    protected $signature = 'umpire:create
                            {email : The umpire email address}
                            {gender : The umpire gender (male or female)}
                            {firstName : The umpire first name}
                            {lastName : The umpire last name}';

    protected $description = 'Create an umpire account';

    public function handle(): int
    {
        $email = trim((string) $this->argument('email'));
        $gender = strtolower(trim((string) $this->argument('gender')));
        $firstName = trim((string) $this->argument('firstName'));
        $lastName = trim((string) $this->argument('lastName'));

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('The email address is invalid.');

            return self::FAILURE;
        }

        if (! in_array($gender, ['male', 'female'], true)) {
            $this->error('Gender must be male or female.');

            return self::FAILURE;
        }

        if ($firstName === '' || $lastName === '') {
            $this->error('First name and last name are required.');

            return self::FAILURE;
        }

        if (User::query()->where('email', $email)->exists()) {
            $this->error("A user with email [{$email}] already exists.");

            return self::FAILURE;
        }

        $umpireRole = Role::query()
            ->where('type', 'login')
            ->where('slug', 'umpire')
            ->first();

        if (! $umpireRole) {
            $this->error('The login umpire role was not found.');

            return self::FAILURE;
        }

        $activeStatus = Status::query()
            ->where('type', 'login')
            ->where('slug', 'active')
            ->first();

        if (! $activeStatus) {
            $this->error('The active login status was not found.');

            return self::FAILURE;
        }

        $user = DB::transaction(function () use ($email, $gender, $firstName, $lastName, $password, $umpireRole, $activeStatus): User {
            $user = User::create([
                'email' => $email,
                'email_verified_at' => now(),
                'password' => bcrypt($password),
                'role_id' => $umpireRole->id,
                'status_id' => $activeStatus->id,
                'is_organizer' => false,
                'account_number' => $this->generateAccountNumber(),
            ]);

            $user->playerInformation()->create([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'gender' => $gender,
            ]);

            return $user;
        });

        $this->info("Umpire [{$user->email}] created successfully.");

        return self::SUCCESS;
    }

    private function generateAccountNumber(): string
    {
        $today = now()->format('Ymd');
        $lastUser = User::latest('id')->first();
        $sequence = $lastUser && $lastUser->account_number
            ? (int) substr($lastUser->account_number, -4) + 1
            : 1;

        return $today.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }
}
