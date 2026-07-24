<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Role::truncate();
        
        $roles = [
            ['type' => 'login', 'name' => 'Admin', 'slug' => 'admin', 'status_id' => 30],
            ['type' => 'login', 'name' => 'Player', 'slug' => 'player', 'status_id' => 30],
            ['type' => 'login', 'name' => 'Umpire', 'slug' => 'umpire', 'status_id' => 30],
            ['type' => 'organization', 'name' => 'Admin', 'slug' => 'admin', 'status_id' => 30],
            ['type' => 'organization', 'name' => 'Umpire', 'slug' => 'umpire', 'status_id' => 30],
            ['type' => 'organization', 'name' => 'Member', 'slug' => 'member', 'status_id' => 30],
        ];

        foreach ($roles as $role) {
            Role::create($role);
        }
    }
}
