<?php

use App\Models\Role;
use App\Models\Status;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $adminRole = Role::create([
        'type' => 'login',
        'name' => 'Admin',
        'slug' => 'admin',
        'status_id' => 1,
    ]);

    $activeStatus = Status::create([
        'type' => 'login',
        'name' => 'Active',
        'slug' => 'active',
    ]);

    $inactiveStatus = Status::create([
        'type' => 'login',
        'name' => 'Inactive',
        'slug' => 'inactive',
    ]);

    $this->adminRole = $adminRole;
    $this->activeStatus = $activeStatus;
    $this->inactiveStatus = $inactiveStatus;

    $this->admin = User::factory()->create([
        'role_id' => $adminRole->id,
        'status_id' => $activeStatus->id,
    ]);
});

test('admin can list and manage admin users', function () {
    $target = User::factory()->create([
        'email' => 'another-admin@example.com',
        'role_id' => $this->adminRole->id,
        'status_id' => $this->activeStatus->id,
    ]);

    $response = $this
        ->actingAs($this->admin)
        ->get(route('admin.user-management.index'));

    $response
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/user-management')
            ->where('admins.0.email', $target->email));
});

test('admin can create, update, toggle status, and reset a password', function () {
    $response = $this
        ->actingAs($this->admin)
        ->post(route('admin.user-management.store'), [
            'email' => 'created-admin@example.com',
            'account_number' => 'ADM-1001',
            'password' => 'new-password',
        ]);

    $response->assertRedirect(route('admin.user-management.index'));

    $adminUser = User::query()->where('email', 'created-admin@example.com')->firstOrFail();

    expect($adminUser->account_number)->toBe('ADM-1001')
        ->and($adminUser->role_id)->toBe($this->adminRole->id)
        ->and($adminUser->status_id)->toBe($this->activeStatus->id);

    $this
        ->actingAs($this->admin)
        ->put(route('admin.user-management.update', $adminUser), [
            'email' => 'updated-admin@example.com',
            'account_number' => 'ADM-2002',
        ])
        ->assertRedirect(route('admin.user-management.index'));

    $adminUser->refresh();

    expect($adminUser->email)->toBe('updated-admin@example.com')
        ->and($adminUser->account_number)->toBe('ADM-2002');

    $this
        ->actingAs($this->admin)
        ->patch(route('admin.user-management.toggle-status', $adminUser))
        ->assertRedirect(route('admin.user-management.index'));

    $adminUser->refresh();

    expect($adminUser->status_id)->toBe($this->inactiveStatus->id);

    $this
        ->actingAs($this->admin)
        ->post(route('admin.user-management.reset-password', $adminUser))
        ->assertRedirect(route('admin.user-management.index'));

    expect(Hash::check('Password123!', $adminUser->refresh()->password))->toBeTrue();
});
