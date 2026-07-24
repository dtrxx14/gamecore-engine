<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            StatusSeeder::class,
            RoleSeeder::class,
            CountryProvinceStateSeeder::class,
            UserSeeder::class,
            PlayerSeeder::class,
            OrganizerManagementSeeder::class,
            UmpireSeeder::class,
        ]);
    }
}
