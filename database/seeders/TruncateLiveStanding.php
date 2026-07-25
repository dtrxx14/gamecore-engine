<?php

namespace Database\Seeders;

use App\Models\LiveStanding;
use Illuminate\Database\Seeder;

class TruncateLiveStanding extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        LiveStanding::truncate();
    }
}
