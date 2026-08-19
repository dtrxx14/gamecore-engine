<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class VerifyEmailCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'verify:email {email : The email address to verify}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verify a user account by email address';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = trim($this->argument('email'));

        $user = User::whereRaw('LOWER(email) = ?', [mb_strtolower($email)])->first();

        if (! $user) {
            $this->error("User with email [{$email}] was not found.");

            return self::FAILURE;
        }

        if ($user->hasVerifiedEmail()) {
            $this->info("User [{$user->email}] is already verified.");

            return self::SUCCESS;
        }

        $user->markEmailAsVerified();

        $this->info("User [{$user->email}] has been verified successfully.");

        return self::SUCCESS;
    }
}
