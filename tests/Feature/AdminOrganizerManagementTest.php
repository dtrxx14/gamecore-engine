<?php

use App\Models\Organization;
use App\Models\OrganizationMember;
use App\Models\Role;
use App\Models\Status;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admin organizer management lists only approved organizations', function () {
    $adminRole = Role::firstOrCreate(
        ['type' => 'login', 'slug' => 'admin'],
        ['name' => 'Admin', 'status_id' => 5]
    );

    $admin = User::factory()->create(['role_id' => $adminRole->id]);

    $approvedStatus = Status::firstOrCreate(
        ['type' => 'organization', 'slug' => 'approved'],
        ['name' => 'Approved']
    );

    $pendingStatus = Status::firstOrCreate(
        ['type' => 'organization', 'slug' => 'pending-approval'],
        ['name' => 'Pending Approval']
    );

    $organizationRole = Role::firstOrCreate(
        ['type' => 'organization', 'slug' => 'admin'],
        ['name' => 'Admin', 'status_id' => 5]
    );

    $memberStatus = Status::firstOrCreate(
        ['type' => 'organization-member', 'slug' => 'approved'],
        ['name' => 'Approved']
    );

    $approvedOrganization = Organization::create([
        'uuid' => 'approved-org-uuid',
        'name' => 'Acme Sports',
        'slug' => 'acme-sports',
        'email' => 'hello@acmesports.test',
        'contact_number' => '123456789',
        'status_id' => $approvedStatus->id,
    ]);

    OrganizationMember::create([
        'organization_id' => $approvedOrganization->id,
        'user_id' => $admin->id,
        'role_id' => $organizationRole->id,
        'status_id' => $memberStatus->id,
    ]);

    $pendingOrganization = Organization::create([
        'uuid' => 'pending-org-uuid',
        'name' => 'Pending Org',
        'slug' => 'pending-org',
        'email' => 'pending@org.test',
        'contact_number' => '987654321',
        'status_id' => $pendingStatus->id,
    ]);

    OrganizationMember::create([
        'organization_id' => $pendingOrganization->id,
        'user_id' => $admin->id,
        'role_id' => $organizationRole->id,
        'status_id' => $memberStatus->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.organizer.management'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/organizer-management')
            ->where('organizations.total', 1)
            ->where('organizations.data.0.name', 'Acme Sports')
        );
});

test('admin can open a specific organizer details page', function () {
    $adminRole = Role::firstOrCreate(
        ['type' => 'login', 'slug' => 'admin'],
        ['name' => 'Admin', 'status_id' => 5]
    );

    $admin = User::factory()->create(['role_id' => $adminRole->id]);

    $approvedStatus = Status::firstOrCreate(
        ['type' => 'organization', 'slug' => 'approved'],
        ['name' => 'Approved']
    );

    $organizationRole = Role::firstOrCreate(
        ['type' => 'organization', 'slug' => 'admin'],
        ['name' => 'Admin', 'status_id' => 5]
    );

    $memberStatus = Status::firstOrCreate(
        ['type' => 'organization-member', 'slug' => 'approved'],
        ['name' => 'Approved']
    );

    $organization = Organization::create([
        'uuid' => 'details-org-uuid',
        'name' => 'Northwind Events',
        'slug' => 'northwind-events',
        'email' => 'hello@northwind.test',
        'contact_number' => '5551234',
        'status_id' => $approvedStatus->id,
    ]);

    OrganizationMember::create([
        'organization_id' => $organization->id,
        'user_id' => $admin->id,
        'role_id' => $organizationRole->id,
        'status_id' => $memberStatus->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.organizer.management.show', ['organization' => $organization]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/organizer-management-details')
            ->where('organization.name', 'Northwind Events')
        );
});
