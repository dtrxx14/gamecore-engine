<?php

use App\Models\Organization;
use App\Models\OrganizationMember;
use App\Models\Role;
use App\Models\Status;
use App\Models\User;
use Illuminate\Support\Str;

it('redirects organizer and player dashboards to login for guests', function () {
    $this->get('/organizer/dashboard')->assertRedirect('/login');
    $this->get('/player/dashboard')->assertRedirect('/login');
});

it('redirects authenticated users away from dashboards that do not match their role', function () {
    $admin = User::factory()->create(['role_id' => 1]);
    $player = User::factory()->create(['role_id' => 2]);

    $this->actingAs($admin)->get('/player/dashboard')->assertRedirect('/dashboard');
    $this->actingAs($player)->get('/dashboard')->assertRedirect('/player/dashboard');
});

it('allows only admin and umpire organization members to access the organizer dashboard', function () {
    $loginRole = Role::create([
        'type' => 'login',
        'name' => 'Player',
        'slug' => 'player',
        'status_id' => 1,
    ]);
    $organizationAdminRole = Role::create([
        'type' => 'organization',
        'name' => 'Admin',
        'slug' => 'admin',
        'status_id' => 1,
    ]);
    $organizationUmpireRole = Role::create([
        'type' => 'organization',
        'name' => 'Umpire',
        'slug' => 'umpire',
        'status_id' => 1,
    ]);
    $organizationMemberRole = Role::create([
        'type' => 'organization',
        'name' => 'Member',
        'slug' => 'member',
        'status_id' => 1,
    ]);
    $organizationStatus = Status::create([
        'type' => 'organization',
        'name' => 'Approved',
        'slug' => 'approved',
    ]);
    $memberStatus = Status::create([
        'type' => 'organization-member',
        'name' => 'Approved',
        'slug' => 'approved',
    ]);

    $organization = Organization::create([
        'uuid' => Str::uuid(),
        'name' => 'Test Org',
        'slug' => 'test-org',
        'email' => 'org@example.com',
        'contact_number' => '1234567890',
        'website_url' => 'https://example.com',
        'description' => 'Test organization',
        'address' => 'Somewhere',
        'country_id' => 1,
        'state_province_id' => 1,
        'zip_code' => '12345',
        'status_id' => $organizationStatus->id,
    ]);

    $member = User::factory()->create(['role_id' => $loginRole->id]);
    OrganizationMember::create([
        'organization_id' => $organization->id,
        'user_id' => $member->id,
        'role_id' => $organizationMemberRole->id,
        'status_id' => $memberStatus->id,
    ]);
    $this->actingAs($member)->get('/organizer/dashboard')->assertRedirect('/player/profile');

    $admin = User::factory()->create(['role_id' => $loginRole->id]);
    OrganizationMember::create([
        'organization_id' => $organization->id,
        'user_id' => $admin->id,
        'role_id' => $organizationAdminRole->id,
        'status_id' => $memberStatus->id,
    ]);
    $this->actingAs($admin)->get('/organizer/dashboard')->assertOk();

    $umpire = User::factory()->create(['role_id' => $loginRole->id]);
    OrganizationMember::create([
        'organization_id' => $organization->id,
        'user_id' => $umpire->id,
        'role_id' => $organizationUmpireRole->id,
        'status_id' => $memberStatus->id,
    ]);
    $this->actingAs($umpire)->get('/organizer/dashboard')->assertOk();
});
