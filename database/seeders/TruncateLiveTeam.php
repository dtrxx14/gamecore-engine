<?php

namespace Database\Seeders;

use App\Models\LiveTeam;
use Illuminate\Database\Seeder;

class TruncateLiveTeam extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        LiveTeam::truncate();
    }
}
