<?php

namespace Database\Seeders;

use App\Models\LiveCategory;
use Illuminate\Database\Seeder;

class TruncateLiveCategory extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        LiveCategory::truncate();
    }
}
