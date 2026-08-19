<?php

namespace Database\Seeders;

use App\Models\LiveCategory;
use App\Models\LiveConfiguration;
use App\Models\LiveMatchScore;
use App\Models\LiveTeam;
use App\Models\PlayerInformation;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::truncate();
        PlayerInformation::truncate();
        LiveTeam::truncate();
        LiveMatchScore::truncate();
        LiveConfiguration::truncate();
        LiveCategory::truncate();

        $adminRole = Role::firstOrCreate(
            ['type' => 'login', 'slug' => 'admin'],
            ['name' => 'Admin', 'status_id' => 5]
        );

        $playerRole = Role::firstOrCreate(
            ['type' => 'login', 'slug' => 'player'],
            ['name' => 'Player', 'status_id' => 5]
        );

        $existingPlayerCount = User::query()->where('role_id', $playerRole->id)->count();
        $targetCount = max(100, $existingPlayerCount + 100);
        $emailPrefix = 'player-';

        // Create an admin user if it doesn't exist
        if (!User::query()->where('email', 'd14yamio@gmail.com')->exists()) {
            User::create([
                'email' => 'd14yamio@gmail.com',
                'email_verified_at' => now(),
                'password' => bcrypt('D1u9n9e7!'),
                'role_id' => $adminRole->id,
                'status_id' => 1,
                'is_organizer' => false,
                'account_number' => $this->generateAccountNumber(),
            ]);
        }

        // for ($i = 1; $i <= $targetCount; $i++) {
        //     $email = $emailPrefix.$i.'@gamecore.test';
        //     if (User::query()->where('email', $email)->exists()) {
        //         continue;
        //     }

        //     $playerInformation = [
        //         'first_name' => 'Player',
        //         'last_name' => $i,
        //         'contact_number' => '+1'.str_pad((string) random_int(100000000, 999999999), 9, '0', STR_PAD_LEFT),
        //         'club' => 'GameCore Club',
        //         'gender' => $i % 2 === 0 ? 'female' : 'male',
        //         'birthdate' => now()->subYears(18 + ($i % 20))->subDays($i % 365)->format('Y-m-d'),
        //         'nationality_id' => 1,
        //         'state_province_id' => 1,
        //         'dupr_account' => 'DU'.str_pad((string) $i, 6, '0', STR_PAD_LEFT),
        //         'bio' => 'Player seeded for organizer and tournament management demo.',
        //     ];

        //     $userModel = User::create([
        //         'email' => $email,
        //         'email_verified_at' => now(),
        //         'password' => bcrypt('Test123!'),
        //         'role_id' => $playerRole->id,
        //         'status_id' => 1,
        //         'is_organizer' => true,
        //         'account_number' => $this->generateAccountNumber(),
        //     ]);

        //     $userModel->playerInformation()->create($playerInformation);
        // }
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
