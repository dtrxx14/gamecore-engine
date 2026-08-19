<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class UmpireSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Creates 10 umpire accounts with role_id = 4 (type=organization, slug=umpire).
     * Safe to re-run — skips existing emails.
     */
    public function run(): void
    {
        $umpireRole = Role::query()
            ->where('type', 'login')
            ->where('slug', 'umpire')
            ->first();

        if (!$umpireRole) {
            $this->command->warn('Umpire role not found. Skipping UmpireSeeder.');
            return;
        }

        $umpires = [
            ['email' => 'umpire1@gamecore.com', 'gender' => 'male', 'first_name' => 'Umpire', 'last_name' => 'One'],
            ['email' => 'umpire2@gamecore.com', 'gender' => 'male', 'first_name' => 'Umpire', 'last_name' => 'Two'],
            ['email' => 'umpire3@gamecore.com', 'gender' => 'male', 'first_name' => 'Umpire', 'last_name' => 'Three'],
        ];

        foreach ($umpires as $data) {
            if (User::query()->where('email', $data['email'])->exists()) {
                continue;
            }

            $user = User::create([
                'email' => $data['email'],
                'email_verified_at' => now(),
                'password' => bcrypt('Password123!'),
                'role_id' => $umpireRole->id,
                'status_id' => 1,
                'is_organizer' => false,
                'account_number' => $this->generateAccountNumber(),
            ]);

            // Create player_information record so they have a name
            $user->playerInformation()->create([
                'first_name' => $data['first_name'],
                'middle_name' => null,
                'last_name' => $data['last_name'],
                'contact_number' => '+63'.str_pad((string) random_int(100000000, 999999999), 9, '0', STR_PAD_LEFT),
                'club' => 'GameCore Engine Officiating',
                'gender' => $data['gender'],
                'birthdate' => now()->subYears(25 + (array_search($data, $umpires) % 20))->subDays(array_search($data, $umpires) % 365)->format('Y-m-d'),
                'nationality_id' => 173,
                'state_province_id' => 3328,
                'dupr_account' => 'UMP'.str_pad((string) (array_search($data, $umpires) + 1), 4, '0', STR_PAD_LEFT),
                'bio' => sprintf('%s %s is a certified umpire registered with GameCore Engine.', $data['first_name'], $data['last_name']),
            ]);
        }
    }

    private function generateAccountNumber(): string
    {
        $today = now()->format('Ymd');
        $lastUser = User::latest('id')->first();
        $sequence = 1;

        if ($lastUser && $lastUser->account_number) {
            $lastSequence = (int) substr($lastUser->account_number, -4);
            $sequence = $lastSequence + 1;
        }

        return $today.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }
}

