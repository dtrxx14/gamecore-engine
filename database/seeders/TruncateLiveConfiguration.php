<?php

namespace Database\Seeders;

use App\Models\LiveConfiguration;
use Illuminate\Database\Seeder;

class TruncateLiveConfiguration extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        LiveConfiguration::truncate();
    }
}
