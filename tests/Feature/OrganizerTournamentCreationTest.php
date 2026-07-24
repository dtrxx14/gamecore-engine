<?php

use App\Models\Organization;
use App\Models\OrganizationMember;
use App\Models\Role;
use App\Models\Status;
use App\Models\Tournament;
use App\Models\User;

it('allows an approved organizer to create a tournament with venue, settings, courts, and categories', function () {
    $loginRole = Role::firstOrCreate(
        ['type' => 'login', 'slug' => 'player'],
        ['name' => 'Player', 'status_id' => 1]
    );

    $organizationRole = Role::firstOrCreate(
        ['type' => 'organization', 'slug' => 'admin'],
        ['name' => 'Admin', 'status_id' => 1]
    );

    $organizationStatus = Status::firstOrCreate(
        ['type' => 'organization', 'slug' => 'approved'],
        ['name' => 'Approved']
    );

    $settingsStatus = Status::firstOrCreate(
        ['type' => 'tournament', 'slug' => 'active'],
        ['name' => 'Active']
    );

    $memberStatus = Status::firstOrCreate(
        ['type' => 'organization-member', 'slug' => 'approved'],
        ['name' => 'Approved']
    );

    $organization = Organization::create([
        'uuid' => 'approved-org-uuid',
        'name' => 'Tournament Org',
        'slug' => 'tournament-org',
        'email' => 'org@example.com',
        'contact_number' => '1234567890',
        'website_url' => 'https://example.com',
        'description' => 'Approved organizer',
        'address' => '123 Main St',
        'country_id' => 1,
        'state_province_id' => 1,
        'zip_code' => '12345',
        'status_id' => $organizationStatus->id,
    ]);

    $user = User::factory()->create(['role_id' => $loginRole->id]);

    OrganizationMember::create([
        'organization_id' => $organization->id,
        'user_id' => $user->id,
        'role_id' => $organizationRole->id,
        'status_id' => $memberStatus->id,
    ]);

    $this->actingAs($user)
        ->post('/organizer/tournaments', [
            'title' => 'Test Tournament',
            'start_date' => '2026-08-01 09:00:00',
            'description' => 'Test description',
            'venue_name' => 'Main Arena',
            'venue_address' => '123 Sports Ave',
            'venue_pin_location' => '18.50,73.85',
            'allow_waitlist' => true,
            'call_time_in_hours' => '08:00',
            'start_time_in_hours' => '09:00',
            'end_time_in_hours' => '18:00',
            'default_match_duration_minutes' => 30,
            'default_rest_time_minutes' => 10,
            'default_court_counts' => 2,
            'is_dupr' => true,
            'status_id' => $settingsStatus->id,
            'categories' => [
                [
                    'name' => 'Open Singles',
                    'division' => 'Open',
                    'description' => 'Single elimination bracket',
                    'entry_fee' => '250.00',
                    'currency' => 'PHP',
                    'min_players' => 2,
                    'max_players' => 64,
                    'team_size' => 1,
                    'team_type' => 'singles',
                    'formats' => [
                        [
                            'round_format' => 'single-elimination',
                            'competition_format' => 'round-robin',
                            'scoring_format' => 'standard',
                            'series_format' => 'best-of-3',
                            'game_to' => 11,
                            'win_by' => 2,
                            'pool_count' => 4,
                            'advance_per_pool' => 1,
                            'allow_draw' => false,
                        ],
                        [
                            'round_format' => 'quarter-finals',
                            'competition_format' => 'single-elimination',
                            'scoring_format' => 'standard',
                            'series_format' => 'best-of-1',
                            'game_to' => 11,
                            'win_by' => 2,
                            'pool_count' => 0,
                            'advance_per_pool' => 0,
                            'allow_draw' => false,
                        ],
                    ],
                ],
            ],
            'courts' => ['Court 1', 'Court 2'],
        ])
        ->assertRedirect();

    $tournament = Tournament::where('title', 'Test Tournament')->first();

    expect($tournament)->not->toBeNull();
    expect($tournament->venues()->where('name', 'Main Arena')->exists())->toBeTrue();
    expect($tournament->settings)->not->toBeNull();
    expect($tournament->settings->courts()->count())->toBe(2);
    expect($tournament->categories()->count())->toBe(1);
    expect($tournament->categories()->first()->formats()->count())->toBe(2);
    expect($tournament->categories()->first()->formats()->first()->round_format)->toBe('single-elimination');
});

it('renders a bracket preview page for a tournament category using the saved elimination format', function () {
    $loginRole = Role::firstOrCreate(
        ['type' => 'login', 'slug' => 'player'],
        ['name' => 'Player', 'status_id' => 1]
    );

    $organizationRole = Role::firstOrCreate(
        ['type' => 'organization', 'slug' => 'admin'],
        ['name' => 'Admin', 'status_id' => 1]
    );

    $organizationStatus = Status::firstOrCreate(
        ['type' => 'organization', 'slug' => 'approved'],
        ['name' => 'Approved']
    );

    $settingsStatus = Status::firstOrCreate(
        ['type' => 'tournament', 'slug' => 'active'],
        ['name' => 'Active']
    );

    $memberStatus = Status::firstOrCreate(
        ['type' => 'organization-member', 'slug' => 'approved'],
        ['name' => 'Approved']
    );

    $organization = Organization::create([
        'uuid' => 'approved-org-bracket-uuid',
        'name' => 'Bracket Org',
        'slug' => 'bracket-org',
        'email' => 'bracket-org@example.com',
        'contact_number' => '1234567890',
        'website_url' => 'https://example.com',
        'description' => 'Bracket organizer',
        'address' => '123 Main St',
        'country_id' => 1,
        'state_province_id' => 1,
        'zip_code' => '12345',
        'status_id' => $organizationStatus->id,
    ]);

    $user = User::factory()->create(['role_id' => $loginRole->id]);

    OrganizationMember::create([
        'organization_id' => $organization->id,
        'user_id' => $user->id,
        'role_id' => $organizationRole->id,
        'status_id' => $memberStatus->id,
    ]);

    $tournament = Tournament::create([
        'organization_id' => $organization->id,
        'title' => 'Bracket Preview Tournament',
        'slug' => 'bracket-preview-tournament',
        'banner_image' => null,
        'start_date' => '2026-08-04',
        'description' => 'Bracket preview',
    ]);

    $category = $tournament->categories()->create([
        'name' => 'Open Singles',
        'division' => 'Open',
        'description' => 'Bracket preview category',
        'entry_fee' => '250.00',
        'currency' => 'PHP',
        'min_players' => 2,
        'max_players' => 16,
        'team_size' => 1,
        'team_type' => 'singles',
    ]);

    $category->formats()->create([
        'round_format' => 'round-16',
        'competition_format' => 'single-elimination',
        'scoring_format' => 'deuce',
        'series_format' => 'best-of-3',
        'game_to' => 11,
        'win_by' => 2,
        'pool_count' => 2,
        'advance_per_pool' => 1,
        'allow_draw' => false,
    ]);

    $this->actingAs($user)
        ->get(route('organizer.tournaments.brackets', ['tournament' => $tournament->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('organizer/tournament-brackets')
            ->where('props.tournament.id', $tournament->id)
            ->where('props.categories.0.name', 'Open Singles')
            ->where('props.categories.0.bracket.placement_slots', 16)
        );
});
