<?php

namespace Database\Seeders;

use App\Models\LiveMatchScore;
use Illuminate\Database\Seeder;

class TruncateLiveMatch extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        LiveMatchScore::truncate();
    }
}