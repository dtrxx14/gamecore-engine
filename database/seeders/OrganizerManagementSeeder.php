<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\Organization;
use App\Models\OrganizationMember;
use App\Models\Role;
use App\Models\StateProvince;
use App\Models\Status;
use App\Models\Tournament;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class OrganizerManagementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $approvedStatus = Status::firstOrCreate(
            ['type' => 'organization', 'slug' => 'approved'],
            ['name' => 'Approved']
        );

        $memberStatus = Status::firstOrCreate(
            ['type' => 'organization-member', 'slug' => 'approved'],
            ['name' => 'Approved']
        );

        $organizationAdminRole = Role::firstOrCreate(
            ['type' => 'organization', 'slug' => 'admin'],
            ['name' => 'Admin', 'status_id' => 5]
        );

        $organizationMemberRole = Role::firstOrCreate(
            ['type' => 'organization', 'slug' => 'member'],
            ['name' => 'Member', 'status_id' => 5]
        );

        $organizationUmpireRole = Role::firstOrCreate(
            ['type' => 'organization', 'slug' => 'umpire'],
            ['name' => 'Umpire', 'status_id' => 5]
        );

        $playerRole = Role::firstOrCreate(
            ['type' => 'login', 'slug' => 'player'],
            ['name' => 'Player', 'status_id' => 5]
        );

        $countries = Country::query()->get();
        $users = User::query()->where('role_id', $playerRole->id)->get();

        if ($users->isEmpty()) {
            $this->command->warn('No player users found. Creating seed users first.');
            $this->call(UserSeeder::class);
            $users = User::query()->where('role_id', $playerRole->id)->get();
        }

        $existingCount = Organization::query()->count();
        $targetCount = max(50, $existingCount + 50);

        $counter = 0;

        while (Organization::query()->count() < $targetCount) {
            $counter++;
            $country = $countries->random();
            $state = StateProvince::query()->where('country_id', $country?->id)->inRandomOrder()->first();

            $organizationName = $this->organizationName($counter);
            $slug = Str::slug($organizationName).'-'.Str::random(4);
            $email = Str::slug($organizationName).'-'.$counter.'@example.test';

            if (Organization::query()->where('email', $email)->exists()) {
                continue;
            }

            $organization = Organization::create([
                'uuid' => (string) Str::uuid(),
                'name' => $organizationName,
                'slug' => $slug,
                'email' => $email,
                'contact_number' => '+1'.str_pad((string) random_int(100000000, 999999999), 9, '0', STR_PAD_LEFT),
                'website_url' => 'https://'.Str::slug($organizationName).'.test',
                'description' => 'A growing event organizer focused on community tournaments and local competitions.',
                'address' => $counter.' '.fake()->streetName().' Street',
                'country_id' => $country?->id ?? 1,
                'state_province_id' => $state?->id,
                'zip_code' => str_pad((string) random_int(10000, 99999), 5, '0', STR_PAD_LEFT),
                'status_id' => $approvedStatus->id,
            ]);

            $adminUser = $users->random();
            $existingAdminMembership = OrganizationMember::query()
                ->where('organization_id', $organization->id)
                ->where('user_id', $adminUser->id)
                ->exists();
            if (! $existingAdminMembership) {
                OrganizationMember::create([
                    'organization_id' => $organization->id,
                    'user_id' => $adminUser->id,
                    'role_id' => $organizationAdminRole->id,
                    'status_id' => $memberStatus->id,
                ]);
            }

            $memberPool = $users->filter(fn (User $user) => $user->id !== $adminUser->id)->shuffle();
            $memberCount = min(8, max(2, random_int(2, 5)));
            foreach ($memberPool->take($memberCount) as $memberUser) {
                $existingMembership = OrganizationMember::query()
                    ->where('organization_id', $organization->id)
                    ->where('user_id', $memberUser->id)
                    ->exists();
                if ($existingMembership) {
                    continue;
                }

                OrganizationMember::create([
                    'organization_id' => $organization->id,
                    'user_id' => $memberUser->id,
                    'role_id' => $organizationMemberRole->id,
                    'status_id' => $memberStatus->id,
                ]);
            }

            $umpirePool = $users->filter(fn (User $user) => $user->id !== $adminUser->id)->shuffle();
            $umpireCount = random_int(1, 2);
            foreach ($umpirePool->take($umpireCount) as $umpireUser) {
                $existingUmpireMembership = OrganizationMember::query()
                    ->where('organization_id', $organization->id)
                    ->where('user_id', $umpireUser->id)
                    ->exists();
                if ($existingUmpireMembership) {
                    continue;
                }

                OrganizationMember::create([
                    'organization_id' => $organization->id,
                    'user_id' => $umpireUser->id,
                    'role_id' => $organizationUmpireRole->id,
                    'status_id' => $memberStatus->id,
                ]);
            }

            $tournamentCount = random_int(1, 3);
            for ($i = 0; $i < $tournamentCount; $i++) {
                Tournament::create([
                    'uuid' => (string) Str::uuid(),
                    'organization_id' => $organization->id,
                    'title' => $organizationName.' Tournament '.$i + 1,
                    'slug' => Str::slug($organizationName.' tournament '.($i + 1)).'-'.Str::random(4),
                    'start_date' => now()->addDays(random_int(5, 90))->setTime(random_int(9, 20), 0, 0),
                    'description' => 'Community tournament hosted by '.$organizationName.'.',
                ]);
            }
        }

        $this->command->info('Created '.Organization::query()->count().' organizations with members and tournaments.');
    }

    protected function organizationName(int $counter): string
    {
        $prefixes = ['North', 'Peak', 'Summit', 'Metro', 'City', 'Elite', 'Nova', 'Rally', 'Orbit', 'Prime'];
        $suffixes = ['Sports', 'Events', 'Gaming', 'League', 'Tournaments', 'Club', 'Arena', 'Network', 'Collective', 'Challenge'];

        return $prefixes[$counter % count($prefixes)].' '.$suffixes[$counter % count($suffixes)].' '.$counter;
    }
}
