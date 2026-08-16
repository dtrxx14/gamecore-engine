<?php

use App\Models\PlayerInformation;
use App\Models\Role;
use App\Models\Status;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->admin = User::factory()->create();
    $adminRole = Role::query()->where('type', 'login')->where('slug', 'admin')->firstOrFail();
    $activeStatus = Status::query()->where('type', 'login')->where('slug', 'active')->firstOrFail();
    $this->admin->forceFill([
        'role_id' => $adminRole->id,
        'status_id' => $activeStatus->id,
    ])->save();
});

it('displays player management page', function () {
    $response = $this->actingAs($this->admin)->get('/admin/player-management');
    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/player-management')
        ->has('players')
        ->has('filters')
        ->has('countries')
        ->has('stateProvinces')
    );
});

it('paginates players', function () {
    $players = PlayerInformation::factory()->count(25)->create();

    $response = $this->actingAs($this->admin)->get('/admin/player-management?per_page=10');
    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/player-management')
        ->has('players.data', 10)
        ->where('players.per_page', 10)
    );
});

it('filters players by search', function () {
    $player1 = PlayerInformation::factory()->create(['first_name' => 'John', 'last_name' => 'Doe']);
    $player2 = PlayerInformation::factory()->create(['first_name' => 'Jane', 'last_name' => 'Smith']);

    $response = $this->actingAs($this->admin)->get('/admin/player-management?search=John');
    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/player-management')
    );
});

it('stores a new player', function () {
    $response = $this->actingAs($this->admin)->post('/admin/player-management', [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john@example.com',
        'contact_number' => '555-1234',
        'club' => 'Test Club',
        'gender' => 'male',
        'birthdate' => '1990-01-01',
        'nationality_id' => null,
        'state_province_id' => null,
        'dupr_account' => '12345',
        'bio' => 'Test bio',
    ]);

    $response->assertRedirect('/admin/player-management');
    expect(User::where('email', 'john@example.com')->exists())->toBeTrue();
    expect(PlayerInformation::where('first_name', 'John')->where('last_name', 'Doe')->exists())->toBeTrue();
});

it('updates a player', function () {
    $player = PlayerInformation::factory()->create([
        'first_name' => 'John',
        'last_name' => 'Doe',
        'club' => 'Old Club',
    ]);

    $response = $this->actingAs($this->admin)->put("/admin/player-management/{$player->id}", [
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'contact_number' => '555-5678',
        'club' => 'New Club',
        'gender' => 'female',
        'birthdate' => '1985-05-15',
        'nationality_id' => null,
        'state_province_id' => null,
        'dupr_account' => '54321',
        'bio' => 'Updated bio',
    ]);

    $response->assertRedirect('/admin/player-management');
    expect($player->fresh()->first_name)->toBe('Jane');
    expect($player->fresh()->last_name)->toBe('Smith');
    expect($player->fresh()->club)->toBe('New Club');
});

it('updates a player profile image', function () {
    Storage::fake('public');

    $player = PlayerInformation::factory()->create();
    $file = UploadedFile::fake()->image('profile.jpg', 800, 800);

    $response = $this->actingAs($this->admin)->post("/admin/player-management/{$player->id}", [
        '_method' => 'PUT',
        'profile_image' => $file,
        'first_name' => $player->first_name,
        'last_name' => $player->last_name,
    ]);

    $response->assertRedirect('/admin/player-management');
    expect($player->fresh()->profile_image)->not->toBeNull();
    Storage::disk('public')->assertExists($player->fresh()->profile_image);
});

it('updates a player profile image when the stored path is empty', function () {
    Storage::fake('public');

    $player = PlayerInformation::factory()->create([
        'profile_image' => '',
    ]);
    $file = UploadedFile::fake()->image('profile.jpg', 800, 800);

    $response = $this->actingAs($this->admin)->post("/admin/player-management/{$player->id}", [
        '_method' => 'PUT',
        'profile_image' => $file,
        'first_name' => $player->first_name,
        'last_name' => $player->last_name,
    ]);

    $response->assertRedirect('/admin/player-management');
    expect($player->fresh()->profile_image)->not->toBeNull();
    Storage::disk('public')->assertExists($player->fresh()->profile_image);
});

it('removes a player profile image', function () {
    Storage::fake('public');

    $player = PlayerInformation::factory()->create([
        'profile_image' => 'player-images/test-image.jpg',
    ]);
    Storage::disk('public')->put('player-images/test-image.jpg', 'test-image');

    $response = $this->actingAs($this->admin)->delete("/admin/player-management/{$player->id}/profile-image");

    $response->assertRedirect('/admin/player-management');
    expect($player->fresh()->profile_image)->toBeNull();
    Storage::disk('public')->assertMissing('player-images/test-image.jpg');
});

it('deletes a player', function () {
    $player = PlayerInformation::factory()->create();
    $userId = $player->user_id;

    $response = $this->actingAs($this->admin)->delete("/admin/player-management/{$player->id}");

    $response->assertRedirect('/admin/player-management');
    expect(PlayerInformation::find($player->id))->toBeNull();
    expect(User::find($userId))->toBeNull();
});

it('only admins can access player management', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/admin/player-management');
    $response->assertForbidden();
});
