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
    $this->umpire = $createUser('umpire@example.com', $umpireRole->id);
    $this->umpireWithoutMatches = $createUser('umpire-empty@example.com', $umpireRole->id);
    $this->playerRole = $playerRole;
    $this->activeStatus = $activeStatus;

    PlayerInformation::create([
        'user_id' => $this->umpire->id,
        'first_name' => 'Morgan',
        'last_name' => 'Official',
    ]);
});

it('lists umpires with their tournament match totals and match details', function () {
    $tournamentId = DB::table('tournaments')->insertGetId([
        'uuid' => (string) Str::uuid(),
        'organization_id' => 1,
        'title' => 'Summer Open',
        'slug' => 'summer-open',
        'start_date' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $categoryId = DB::table('tournament_categories')->insertGetId([
        'tournament_id' => $tournamentId,
        'name' => 'Mixed Doubles',
        'division' => 'Open',
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

    foreach ($teamAPlayers as $player) {
        DB::table('tournament_team_members')->insert([
            'tournament_registration_id' => 1,
            'group_id' => 101,
            'user_id' => $player->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    DB::table('tournament_team_members')->insert([
        'tournament_registration_id' => 2,
        'group_id' => 202,
        'user_id' => $teamBPlayer->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $matchId = DB::table('tournament_matches')->insertGetId([
        'tournament_category_id' => $categoryId,
        'group_id' => 1,
        'bracket_id' => 1,
        'court_id' => 1,
        'official_id' => $this->umpire->id,
        'tournament_category_format_id' => 1,
        'team_a_id' => 101,
        'team_b_id' => 202,
        'team_a_score' => 15,
        'team_b_score' => 12,
        'status_id' => $this->activeStatus->id,
        'scheduled_at' => '2026-10-30 10:00:00',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('tournament_live_scores')->insert([
        'tournament_match_id' => $matchId,
        'court_id' => 1,
        'set_number' => 1,
        'team_a_score' => 11,
        'team_b_score' => 9,
        'server_group_id' => 101,
        'status_id' => $this->activeStatus->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($this->admin)
        ->getJson(route('admin.live-configuration.umpire-statistics'))
        ->assertOk()
        ->assertJsonPath('umpires.0.name', 'Morgan Official')
        ->assertJsonPath('umpires.0.total_matches', 1)
        ->assertJsonPath('umpires.1.total_matches', 0);

    $this->getJson(route('admin.live-configuration.umpires.matches', $this->umpire))
        ->assertOk()
        ->assertJsonPath('matches.0.tournament', 'Summer Open')
        ->assertJsonPath('matches.0.category', 'Mixed Doubles')
        ->assertJsonPath('matches.0.team_a_players.0', 'Alex Player')
        ->assertJsonPath('matches.0.team_a_players.1', 'Jamie Player')
        ->assertJsonPath('matches.0.team_b_players.0', 'Taylor Opponent')
        ->assertJsonPath('matches.0.score.team_a', 15)
        ->assertJsonPath('matches.0.score.team_b', 12)
        ->assertJsonPath('matches.0.sets.0.team_a_score', 11)
        ->assertJsonPath('matches.0.sets.0.team_b_score', 9);
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
