<?php

use App\Models\PlayerInformation;
use App\Models\Role;
use App\Models\Status;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

beforeEach(function () {
    $activeStatus = Status::create([
        'type' => 'login',
        'name' => 'Active',
        'slug' => 'active',
    ]);

    $adminRole = Role::create([
        'type' => 'login',
        'name' => 'Admin',
        'slug' => 'admin',
        'status_id' => $activeStatus->id,
    ]);
    $umpireRole = Role::create([
        'type' => 'login',
        'name' => 'Umpire',
        'slug' => 'umpire',
        'status_id' => $activeStatus->id,
    ]);
    $playerRole = Role::create([
        'type' => 'login',
        'name' => 'Player',
        'slug' => 'player',
        'status_id' => $activeStatus->id,
    ]);

    $createUser = static function (string $email, int $roleId) use ($activeStatus): User {
        $user = User::query()->create([
            'account_number' => (string) Str::uuid(),
            'email' => $email,
            'password' => 'password',
            'role_id' => $roleId,
            'status_id' => $activeStatus->id,
        ]);
        $user->forceFill(['email_verified_at' => now()])->save();

        return $user;
    };

    $this->admin = $createUser('admin@example.com', $adminRole->id);
    $this->umpire = $createUser('aprilten712@gmail.com', $umpireRole->id);
    $this->umpireWithoutMatches = $createUser('umpire-empty@example.com', $umpireRole->id);
    $this->playerRole = $playerRole;
    $this->activeStatus = $activeStatus;

    PlayerInformation::create([
        'user_id' => $this->umpire->id,
        'first_name' => 'Morgan',
        'last_name' => 'Official',
    ]);
});

it('lists umpires with their live match totals and match details', function () {
    $configurationId = DB::table('live_configurations')->insertGetId([
        'name' => 'Summer Open',
        'number_of_courts' => 1,
        'scoring_system' => 'rally-point',
        'allow_court_change' => false,
        'court_change_trigger' => 'none',
        'status_id' => $this->activeStatus->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $categoryId = DB::table('live_categories')->insertGetId([
        'live_configuration_id' => $configurationId,
        'name' => 'Mixed Doubles',
        'game_to' => 11,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $teamAPlayers = collect([
        ['first_name' => 'Alex', 'last_name' => 'Player'],
        ['first_name' => 'Jamie', 'last_name' => 'Player'],
    ])->map(function (array $profile) {
        $player = User::query()->create([
            'account_number' => (string) Str::uuid(),
            'email' => Str::uuid().'@example.com',
            'email_verified_at' => now(),
            'password' => 'password',
            'role_id' => $this->playerRole->id,
            'status_id' => $this->activeStatus->id,
        ]);
        PlayerInformation::create(['user_id' => $player->id, ...$profile]);

        return $player;
    });
    $teamBPlayer = User::query()->create([
        'account_number' => (string) Str::uuid(),
        'email' => Str::uuid().'@example.com',
        'email_verified_at' => now(),
        'password' => 'password',
        'role_id' => $this->playerRole->id,
        'status_id' => $this->activeStatus->id,
    ]);
    PlayerInformation::create([
        'user_id' => $teamBPlayer->id,
        'first_name' => 'Taylor',
        'last_name' => 'Opponent',
    ]);

    $teamAId = DB::table('live_teams')->insertGetId([
        'name' => 'Team A',
        'category_id' => $categoryId,
        'live_configuration_id' => $configurationId,
        'player_ids' => $teamAPlayers->pluck('id')->toJson(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $teamBId = DB::table('live_teams')->insertGetId([
        'name' => 'Team B',
        'category_id' => $categoryId,
        'live_configuration_id' => $configurationId,
        'player_ids' => json_encode([$teamBPlayer->id]),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('live_match_scores')->insert([
        'live_configuration_id' => $configurationId,
        'court_number' => 1,
        'category_id' => $categoryId,
        'team_a_id' => $teamAId,
        'team_b_id' => $teamBId,
        'team_a_score' => 15,
        'team_b_score' => 12,
        'status_id' => $this->activeStatus->id,
        'umpire_id' => $this->umpire->id,
        'start_play_at' => '2026-10-30 10:00:00',
        'end_play_at' => '2026-10-30 10:30:00',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('live_match_scores')->insert([
        'live_configuration_id' => $configurationId,
        'court_number' => 2,
        'category_id' => $categoryId,
        'team_a_id' => $teamAId,
        'team_b_id' => $teamBId,
        'status_id' => $this->activeStatus->id,
        'umpire_id' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($this->admin)
        ->getJson(route('admin.live-configuration.umpire-statistics'))
        ->assertOk()
        ->assertJsonPath('umpires.0.name', 'Morgan Official')
        ->assertJsonPath('umpires.0.total_matches', 7)
        ->assertJsonPath('umpires.1.total_matches', 0);

    $this->getJson(route('admin.live-configuration.umpires.matches', $this->umpire))
        ->assertOk()
        ->assertJsonPath('matches.0.configuration', 'Summer Open')
        ->assertJsonPath('matches.0.category', 'Mixed Doubles')
        ->assertJsonPath('matches.0.team_a_players.0', 'Alex Player')
        ->assertJsonPath('matches.0.team_a_players.1', 'Jamie Player')
        ->assertJsonPath('matches.0.team_b_players.0', 'Taylor Opponent')
        ->assertJsonPath('matches.0.score.team_a', 15)
        ->assertJsonPath('matches.0.score.team_b', 12)
        ->assertJsonPath('matches.0.sets', []);
});

it('does not expose match details for a non-umpire account', function () {
    $player = User::query()->create([
        'account_number' => (string) Str::uuid(),
        'email' => 'non-umpire@example.com',
        'email_verified_at' => now(),
        'password' => 'password',
        'role_id' => $this->playerRole->id,
        'status_id' => $this->activeStatus->id,
    ]);

    $this->actingAs($this->admin)
        ->getJson(route('admin.live-configuration.umpires.matches', $player))
        ->assertNotFound();
});
