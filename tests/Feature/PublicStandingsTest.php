<?php

use App\Models\LiveCategory;
use App\Models\LiveConfiguration;
use App\Models\LiveMatchScore;
use App\Models\LiveTeam;
use App\Models\Status;

it('groups standings by configuration, category and team without double counting court entries', function () {
    $status = Status::firstOrCreate(
        ['type' => 'login', 'slug' => 'active'],
        ['name' => 'Active']
    );

    $configuration = LiveConfiguration::create([
        'name' => 'Spring League',
        'slug' => 'spring-league',
        'number_of_courts' => 2,
        'scoring_system' => 'side-out',
        'allow_court_change' => true,
        'court_change_trigger' => 'score-count',
        'court_change_interval' => 2,
        'status_id' => $status->id,
    ]);

    $category = LiveCategory::create([
        'live_configuration_id' => $configuration->id,
        'name' => 'Men\'s Singles',
        'game_to' => 21,
        'win_by' => 2,
        'game_time' => '15',
        'game_interval' => '2',
    ]);

    $team = LiveTeam::create([
        'name' => 'Team Alpha',
        'category_id' => $category->id,
        'live_configuration_id' => $configuration->id,
        'player_ids' => [],
    ]);
    $opponent = LiveTeam::create([
        'name' => 'Team Beta',
        'category_id' => $category->id,
        'live_configuration_id' => $configuration->id,
        'player_ids' => [],
    ]);

    LiveMatchScore::create([
        'live_configuration_id' => $configuration->id,
        'court_number' => 1,
        'category_id' => $category->id,
        'team_a_id' => $team->id,
        'team_b_id' => $opponent->id,
        'team_a_score' => 21,
        'team_b_score' => 18,
        'status_id' => 1,
        'end_play_at' => now(),
    ]);

    LiveMatchScore::create([
        'live_configuration_id' => $configuration->id,
        'court_number' => 2,
        'category_id' => $category->id,
        'team_a_id' => $team->id,
        'team_b_id' => $opponent->id,
        'team_a_score' => 21,
        'team_b_score' => 17,
        'status_id' => 1,
        'end_play_at' => now(),
    ]);

    $response = $this->getJson('/api/standings');

    $response->assertOk();

    $teams = $response->json('data.0.categories.0.teams');

    expect($teams)->toHaveCount(1)
        ->and($teams[0]['team_id'])->toBe($team->id)
        ->and($teams[0]['matches_played'])->toBe(2)
        ->and($teams[0]['wins'])->toBe(2)
        ->and($teams[0]['points_for'])->toBe(42)
        ->and($teams[0]['points_against'])->toBe(35)
        ->and($teams[0]['point_differential'])->toBe(7);

    expect($response->json('data.0.categories.0.game_to'))->toBe(21)
        ->and($response->json('data.0.categories.0.win_by'))->toBe(2)
        ->and($response->json('data.0.categories.0.game_time'))->toBe('15')
        ->and($response->json('data.0.categories.0.game_interval'))->toBe('2');
});

it('orders tied teams by win-loss, head-to-head, point differential, and total points scored', function () {
    $status = Status::firstOrCreate(
        ['type' => 'login', 'slug' => 'active'],
        ['name' => 'Active']
    );

    $configuration = LiveConfiguration::create([
        'name' => 'Spring League',
        'slug' => 'spring-league-tiebreak',
        'number_of_courts' => 2,
        'scoring_system' => 'side-out',
        'allow_court_change' => true,
        'court_change_trigger' => 'score-count',
        'court_change_interval' => 2,
        'status_id' => $status->id,
    ]);

    $category = LiveCategory::create([
        'live_configuration_id' => $configuration->id,
        'name' => 'Men\'s Singles',
        'game_to' => 21,
    ]);

    $teamB = LiveTeam::create([
        'name' => 'Team Bravo',
        'category_id' => $category->id,
        'live_configuration_id' => $configuration->id,
        'player_ids' => [],
    ]);

    $teamA = LiveTeam::create([
        'name' => 'Team Alpha',
        'category_id' => $category->id,
        'live_configuration_id' => $configuration->id,
        'player_ids' => [],
    ]);

    $teamC = LiveTeam::create([
        'name' => 'Team Charlie',
        'category_id' => $category->id,
        'live_configuration_id' => $configuration->id,
        'player_ids' => [],
    ]);
    $teamD = LiveTeam::create([
        'name' => 'Team Delta',
        'category_id' => $category->id,
        'live_configuration_id' => $configuration->id,
        'player_ids' => [],
    ]);

    LiveMatchScore::create([
        'live_configuration_id' => $configuration->id,
        'court_number' => 1,
        'category_id' => $category->id,
        'team_a_id' => $teamA->id,
        'team_b_id' => $teamB->id,
        'team_a_score' => 21,
        'team_b_score' => 18,
        'status_id' => 1,
        'end_play_at' => now(),
    ]);
    LiveMatchScore::create([
        'live_configuration_id' => $configuration->id,
        'court_number' => 2,
        'category_id' => $category->id,
        'team_a_id' => $teamA->id,
        'team_b_id' => $teamC->id,
        'team_a_score' => 21,
        'team_b_score' => 17,
        'status_id' => 1,
        'end_play_at' => now(),
    ]);
    LiveMatchScore::create([
        'live_configuration_id' => $configuration->id,
        'court_number' => 1,
        'category_id' => $category->id,
        'team_a_id' => $teamB->id,
        'team_b_id' => $teamC->id,
        'team_a_score' => 21,
        'team_b_score' => 18,
        'status_id' => 1,
        'end_play_at' => now(),
    ]);
    LiveMatchScore::create([
        'live_configuration_id' => $configuration->id,
        'court_number' => 2,
        'category_id' => $category->id,
        'team_a_id' => $teamB->id,
        'team_b_id' => $teamD->id,
        'team_a_score' => 21,
        'team_b_score' => 19,
        'status_id' => 1,
        'end_play_at' => now(),
    ]);

    $response = $this->getJson('/api/standings');

    $response->assertOk();

    $teams = $response->json('data.0.categories.0.teams');

    expect($teams)->toHaveCount(2)
        ->and($teams[0]['team_id'])->toBe($teamA->id)
        ->and($teams[1]['team_id'])->toBe($teamB->id);
});
