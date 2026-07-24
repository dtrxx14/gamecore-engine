<?php

use App\Models\PlayerInformation;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('player profile can be updated from the edit profile page', function () {
    $user = User::factory()->create();
    $profile = $user->playerInformation()->create([
        'first_name' => 'Old',
        'last_name' => 'Name',
        'bio' => 'Old bio',
    ]);

    $response = $this
        ->actingAs($user)
        ->from(route('player.edit-profile'))
        ->patch(route('player.profile.update'), [
            'first_name' => 'New',
            'last_name' => 'Name',
            'contact_number' => '+123456789',
            'dupr_account' => 'dupr-123',
            'bio' => 'Updated bio',
            'country_id' => 1,
            'state_province_id' => 2,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('player.edit-profile'));

    $profile->refresh();

    expect($profile->first_name)->toBe('New')
        ->and($profile->last_name)->toBe('Name')
        ->and($profile->contact_number)->toBe('+123456789')
        ->and($profile->dupr_account)->toBe('dupr-123')
        ->and($profile->bio)->toBe('Updated bio')
        ->and($profile->nationality_id)->toBe(1)
        ->and($profile->state_province_id)->toBe(2);
});

test('player password can be updated from the edit profile page', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from(route('player.edit-profile'))
        ->put(route('player.password.update'), [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('player.edit-profile'));

    expect(Hash::check('new-password', $user->refresh()->password))->toBeTrue();
});
