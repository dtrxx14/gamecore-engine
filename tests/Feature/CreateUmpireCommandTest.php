<?php

use App\Models\Role;
use App\Models\Status;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

it('creates an active umpire account with a player profile', function () {
    $activeStatus = Status::create([
        'type' => 'login',
        'name' => 'Active',
        'slug' => 'active',
    ]);
    $umpireRole = Role::create([
        'type' => 'login',
        'name' => 'Umpire',
        'slug' => 'umpire',
        'status_id' => $activeStatus->id,
    ]);

    $this->artisan('umpire:create', [
        'email' => 'official@example.com',
        'gender' => 'female',
        'firstName' => 'Alex',
        'lastName' => 'Official',
        'password' => 'Password123!',
    ])
        ->expectsOutput('Umpire [official@example.com] created successfully.')
        ->assertExitCode(0);

    $user = User::query()->where('email', 'official@example.com')->firstOrFail();

    expect($user->role_id)->toBe($umpireRole->id)
        ->and($user->status_id)->toBe($activeStatus->id)
        ->and(Hash::check('Password123!', $user->password))->toBeTrue()
        ->and($user->playerInformation->only(['first_name', 'last_name', 'gender']))->toBe([
            'first_name' => 'Alex',
            'last_name' => 'Official',
            'gender' => 'female',
        ]);
});

it('rejects an invalid umpire gender', function () {
    $this->artisan('umpire:create', [
        'email' => 'official@example.com',
        'gender' => 'other',
        'firstName' => 'Alex',
        'lastName' => 'Official',
        'password' => 'Password123!',
    ])
        ->expectsOutput('Gender must be male or female.')
        ->assertExitCode(1);

    expect(User::query()->where('email', 'official@example.com')->exists())->toBeFalse();
});
