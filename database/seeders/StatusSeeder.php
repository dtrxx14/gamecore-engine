<?php

namespace Database\Seeders;

use App\Models\Status;
use Illuminate\Database\Seeder;

class StatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Status::truncate();

        $statuses = [
            ['type' => 'login', 'name' => 'Active', 'slug' => 'active'],
            ['type' => 'login', 'name' => 'Inactive', 'slug' => 'inactive'],
            ['type' => 'login', 'name' => 'Suspended', 'slug' => 'suspended'],
            ['type' => 'organization', 'name' => 'Pending Approval', 'slug' => 'pending-approval'],
            ['type' => 'organization', 'name' => 'Approved', 'slug' => 'approved'],
            ['type' => 'organization', 'name' => 'Rejected', 'slug' => 'rejected'],
            ['type' => 'organization-member', 'name' => 'Approved', 'slug' => 'approved'],
            ['type' => 'organization-member', 'name' => 'Pending Approval', 'slug' => 'pending-approval'],
            ['type' => 'organization-member', 'name' => 'Rejected', 'slug' => 'rejected'],
            ['type' => 'tournament', 'name' => 'Active', 'slug' => 'active'],
            ['type' => 'tournament', 'name' => 'Inactive', 'slug' => 'inactive'],
            ['type' => 'tournament-registration', 'name' => 'Approved', 'slug' => 'approved'],
            ['type' => 'tournament-registration', 'name' => 'Pending Approval', 'slug' => 'pending-approval'],
            ['type' => 'tournament-registration', 'name' => 'Rejected', 'slug' => 'rejected'],
            ['type' => 'tournament-bracket', 'name' => 'Winner', 'slug' => 'winner'],
            ['type' => 'tournament-bracket', 'name' => 'Loser', 'slug' => 'loser'],
            ['type' => 'tournament-bracket', 'name' => 'Pending', 'slug' => 'pending'],
            ['type' => 'tournament-bracket', 'name' => 'Next', 'slug' => 'next'],
            ['type' => 'tournament-bracket', 'name' => 'Completed', 'slug' => 'completed'],
            ['type' => 'tournament-matches', 'name' => 'Scheduled', 'slug' => 'scheduled'],
            ['type' => 'tournament-matches', 'name' => 'Live', 'slug' => 'live'],
            ['type' => 'tournament-matches', 'name' => 'Completed', 'slug' => 'completed'],
            ['type' => 'tournament-live', 'name' => 'Live', 'slug' => 'live'],
            ['type' => 'tournament-live', 'name' => 'Next', 'slug' => 'next'],
            ['type' => 'tournament-live', 'name' => 'Default', 'slug' => 'default'],
            ['type' => 'tournament-live', 'name' => 'Completed', 'slug' => 'completed'],
            ['type' => 'live-match', 'name' => 'Pending', 'slug' => 'pending'],
            ['type' => 'live-match', 'name' => 'Playing', 'slug' => 'playing'],
            ['type' => 'live-match', 'name' => 'Completed', 'slug' => 'completed'],
            ['type' => 'roles', 'name' => 'Active', 'slug' => 'active'],
            ['type' => 'roles', 'name' => 'Inactive', 'slug' => 'inactive'],
        ];

        foreach ($statuses as $status) {
            Status::create($status);
        }
    }
}
