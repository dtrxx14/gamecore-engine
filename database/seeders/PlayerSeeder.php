<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use App\Models\Country;
use App\Models\StateProvince;
use Illuminate\Database\Seeder;

class PlayerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Creates player users with associated player_information records.
     * Each player gets: User account (email, password, role, status) +
     * PlayerInformation (name, contact, gender, birthdate, club, nationality, state, DUPR, bio).
     *
     * Skips existing emails — safe to re-run.
     */
    public function run(): void
    {
        $playerRole = Role::firstOrCreate(
            ['type' => 'login', 'slug' => 'player'],
            ['name' => 'Player', 'status_id' => 5]
        );

        $country = Country::first();
        $stateProvince = StateProvince::first();

        $players = [
            [
                'email' => 'player-1@gamecore.test',
                'first_name' => 'Juan',
                'last_name' => 'Dela Cruz',
                'gender' => 'male',
                'club' => 'Manila Badminton Club',
            ],
            [
                'email' => 'player-2@gamecore.test',
                'first_name' => 'Maria',
                'last_name' => 'Santos',
                'gender' => 'female',
                'club' => 'Quezon City Sports Center',
            ],
            [
                'email' => 'player-3@gamecore.test',
                'first_name' => 'Jose',
                'last_name' => 'Rizal',
                'gender' => 'male',
                'club' => 'Makati Tennis Club',
            ],
            [
                'email' => 'player-4@gamecore.test',
                'first_name' => 'Ana',
                'last_name' => 'Gonzales',
                'gender' => 'female',
                'club' => 'Cebu Badminton Academy',
            ],
            [
                'email' => 'player-5@gamecore.test',
                'first_name' => 'Carlos',
                'last_name' => 'Mendoza',
                'gender' => 'male',
                'club' => 'Davao Sports Complex',
            ],
            [
                'email' => 'player-6@gamecore.test',
                'first_name' => 'Sofia',
                'last_name' => 'Villanueva',
                'gender' => 'female',
                'club' => 'Iloilo Badminton Club',
            ],
            [
                'email' => 'player-7@gamecore.test',
                'first_name' => 'Miguel',
                'last_name' => 'Reyes',
                'gender' => 'male',
                'club' => 'Baguio Tennis Center',
            ],
            [
                'email' => 'player-8@gamecore.test',
                'first_name' => 'Isabella',
                'last_name' => 'Martinez',
                'gender' => 'female',
                'club' => 'Laguna Sports Hub',
            ],
            [
                'email' => 'player-9@gamecore.test',
                'first_name' => 'Ramon',
                'last_name' => 'Fernandez',
                'gender' => 'male',
                'club' => 'Pampanga Badminton Club',
            ],
            [
                'email' => 'player-10@gamecore.test',
                'first_name' => 'Lucia',
                'last_name' => 'Torres',
                'gender' => 'female',
                'club' => 'Batangas Sports Complex',
            ],
            [
                'email' => 'player-11@gamecore.test',
                'first_name' => 'Antonio',
                'last_name' => 'Garcia',
                'gender' => 'male',
                'club' => 'Bulacan Badminton Center',
            ],
            [
                'email' => 'player-12@gamecore.test',
                'first_name' => 'Camila',
                'last_name' => 'Lopez',
                'gender' => 'female',
                'club' => 'Cavite Sports Arena',
            ],
            [
                'email' => 'player-13@gamecore.test',
                'first_name' => 'Pedro',
                'last_name' => 'Martinez',
                'gender' => 'male',
                'club' => 'Zamboanga Badminton Club',
            ],
            [
                'email' => 'player-14@gamecore.test',
                'first_name' => 'Gabriela',
                'last_name' => 'Silang',
                'gender' => 'female',
                'club' => 'Ilocos Sports Center',
            ],
            [
                'email' => 'player-15@gamecore.test',
                'first_name' => 'Andres',
                'last_name' => 'Bonifacio',
                'gender' => 'male',
                'club' => 'Laguna Badminton Academy',
            ],
            [
                'email' => 'player-16@gamecore.test',
                'first_name' => 'Elena',
                'last_name' => 'Cruz',
                'gender' => 'female',
                'club' => 'Pangasinan Sports Complex',
            ],
            [
                'email' => 'player-17@gamecore.test',
                'first_name' => 'Diego',
                'last_name' => 'Aquino',
                'gender' => 'male',
                'club' => 'Nueva Ecija Badminton Club',
            ],
            [
                'email' => 'player-18@gamecore.test',
                'first_name' => 'Rosa',
                'last_name' => 'Marcos',
                'gender' => 'female',
                'club' => 'Tarlac Sports Hub',
            ],
            [
                'email' => 'player-19@gamecore.test',
                'first_name' => 'Luis',
                'last_name' => 'Navarro',
                'gender' => 'male',
                'club' => 'Bicol Badminton Center',
            ],
            [
                'email' => 'player-20@gamecore.test',
                'first_name' => 'Carmen',
                'last_name' => 'Del Rosario',
                'gender' => 'female',
                'club' => 'Albay Sports Complex',
            ],
            [
                'email' => 'player-21@gamecore.test',
                'first_name' => 'Emilio',
                'last_name' => 'Aguinaldo',
                'gender' => 'male',
                'club' => 'Kawit Badminton Club',
            ],
            [
                'email' => 'player-22@gamecore.test',
                'first_name' => 'Leonor',
                'last_name' => 'Rivera',
                'gender' => 'female',
                'club' => 'Rizal Sports Center',
            ],
            [
                'email' => 'player-23@gamecore.test',
                'first_name' => 'Rafael',
                'last_name' => 'Cortez',
                'gender' => 'male',
                'club' => 'Mindanao Badminton Academy',
            ],
            [
                'email' => 'player-24@gamecore.test',
                'first_name' => 'Teresa',
                'last_name' => 'Alonzo',
                'gender' => 'female',
                'club' => 'Palawan Sports Complex',
            ],
            [
                'email' => 'player-25@gamecore.test',
                'first_name' => 'Fernando',
                'last_name' => 'Guerrero',
                'gender' => 'male',
                'club' => 'Bohol Badminton Center',
            ],
            [
                'email' => 'player-26@gamecore.test',
                'first_name' => 'Marissa',
                'last_name' => 'Dimagiba',
                'gender' => 'female',
                'club' => 'Negros Sports Hub',
            ],
            [
                'email' => 'player-27@gamecore.test',
                'first_name' => 'Ricardo',
                'last_name' => 'Llamas',
                'gender' => 'male',
                'club' => 'Samar Badminton Club',
            ],
            [
                'email' => 'player-28@gamecore.test',
                'first_name' => 'Bea',
                'last_name' => 'Alcantara',
                'gender' => 'female',
                'club' => 'Bulacan Tennis Center',
            ],
            [
                'email' => 'player-29@gamecore.test',
                'first_name' => 'Dennis',
                'last_name' => 'Sison',
                'gender' => 'male',
                'club' => 'Pampanga Sports Arena',
            ],
            [
                'email' => 'player-30@gamecore.test',
                'first_name' => 'Cristina',
                'last_name' => 'Magsaysay',
                'gender' => 'female',
                'club' => 'Laguna Badminton Club',
            ],
            [
                'email' => 'player-31@gamecore.test',
                'first_name' => 'Gregorio',
                'last_name' => 'Sandoval',
                'gender' => 'male',
                'club' => 'Batangas Tennis Club',
            ],
            [
                'email' => 'player-32@gamecore.test',
                'first_name' => 'Liza',
                'last_name' => 'Macapagal',
                'gender' => 'female',
                'club' => 'Pangasinan Badminton Center',
            ],
            [
                'email' => 'player-33@gamecore.test',
                'first_name' => 'Romeo',
                'last_name' => 'Salcedo',
                'gender' => 'male',
                'club' => 'Ilocos Norte Sports Complex',
            ],
            [
                'email' => 'player-34@gamecore.test',
                'first_name' => 'Angelica',
                'last_name' => 'Mercado',
                'gender' => 'female',
                'club' => 'Cebu City Sports Center',
            ],
            [
                'email' => 'player-35@gamecore.test',
                'first_name' => 'Francisco',
                'last_name' => 'Ramos',
                'gender' => 'male',
                'club' => 'Davao Badminton Club',
            ],
            [
                'email' => 'player-36@gamecore.test',
                'first_name' => 'Jasmine',
                'last_name' => 'Velasco',
                'gender' => 'female',
                'club' => 'Baguio Badminton Academy',
            ],
            [
                'email' => 'player-37@gamecore.test',
                'first_name' => 'Hector',
                'last_name' => 'Luna',
                'gender' => 'male',
                'club' => 'Zamboanga Sports Complex',
            ],
            [
                'email' => 'player-38@gamecore.test',
                'first_name' => 'Patricia',
                'last_name' => 'Manalo',
                'gender' => 'female',
                'club' => 'Quezon Badminton Center',
            ],
            [
                'email' => 'player-39@gamecore.test',
                'first_name' => 'Alberto',
                'last_name' => 'Rosales',
                'gender' => 'male',
                'club' => 'Cavite Tennis Club',
            ],
            [
                'email' => 'player-40@gamecore.test',
                'first_name' => 'Lorraine',
                'last_name' => 'Bautista',
                'gender' => 'female',
                'club' => 'Rizal Badminton Academy',
            ],
            [
                'email' => 'player-41@gamecore.test',
                'first_name' => 'Lorenzo',
                'last_name' => 'Vargas',
                'gender' => 'male',
                'club' => 'Nueva Vizcaya Sports Hub',
            ],
            [
                'email' => 'player-42@gamecore.test',
                'first_name' => 'Grace',
                'last_name' => 'Pascual',
                'gender' => 'female',
                'club' => 'Bicol Tennis Center',
            ],
            [
                'email' => 'player-43@gamecore.test',
                'first_name' => 'Mario',
                'last_name' => 'Santiago',
                'gender' => 'male',
                'club' => 'Tarlac Badminton Club',
            ],
            [
                'email' => 'player-44@gamecore.test',
                'first_name' => 'Diana',
                'last_name' => 'Valencia',
                'gender' => 'female',
                'club' => 'Mindoro Sports Complex',
            ],
            [
                'email' => 'player-45@gamecore.test',
                'first_name' => 'Oscar',
                'last_name' => 'Pineda',
                'gender' => 'male',
                'club' => 'Sorsogon Badminton Academy',
            ],
            [
                'email' => 'player-46@gamecore.test',
                'first_name' => 'Margarita',
                'last_name' => 'Gatchalian',
                'gender' => 'female',
                'club' => 'Marikina Sports Center',
            ],
            [
                'email' => 'player-47@gamecore.test',
                'first_name' => 'Vincent',
                'last_name' => 'Mata',
                'gender' => 'male',
                'club' => 'Antipolo Badminton Club',
            ],
            [
                'email' => 'player-48@gamecore.test',
                'first_name' => 'Natasha',
                'last_name' => 'Corpuz',
                'gender' => 'female',
                'club' => 'Tagaytay Sports Complex',
            ],
        ];

        foreach ($players as $index => $data) {
            if (User::query()->where('email', $data['email'])->exists()) {
                continue;
            }

            $sequence = $index + 1;
            $user = User::create([
                'email' => $data['email'],
                'email_verified_at' => now(),
                'password' => bcrypt('Test123!'),
                'role_id' => $playerRole->id,
                'status_id' => 1,
                'is_organizer' => false,
                'account_number' => $this->generateAccountNumber(),
            ]);

            $user->playerInformation()->create([
                'first_name' => $data['first_name'],
                'middle_name' => null,
                'last_name' => $data['last_name'],
                'contact_number' => '+63'.str_pad((string) random_int(100000000, 999999999), 9, '0', STR_PAD_LEFT),
                'club' => $data['club'],
                'gender' => $data['gender'],
                'birthdate' => now()->subYears(18 + ($sequence % 20))->subDays($sequence % 365)->format('Y-m-d'),
                'nationality_id' => $country?->id,
                'state_province_id' => $stateProvince?->id,
                'dupr_account' => 'DU'.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT),
                'bio' => sprintf('%s %s is a competitive athlete registered with %s.', $data['first_name'], $data['last_name'], $data['club']),
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

