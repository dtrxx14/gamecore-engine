<?php

namespace App\Http\Controllers\Admin;

use App\Events\MatchScoreUpdated;
use App\Http\Controllers\Controller;
use App\Models\LiveCategory;
use App\Models\LiveConfiguration;
use App\Models\LiveMatchScore;
use App\Models\LiveStanding;
use App\Models\LiveTeam;
use App\Models\Status;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;

class LiveConfigurationController extends Controller
{
    /**
     * Display a listing of live configurations.
     */
    public function index(): Response
    {
        $configurations = LiveConfiguration::query()
            ->with('status')
            ->latest('created_at')
            ->get();

        return inertia('admin/live-configuration', [
            'configurations' => $configurations,
        ]);
    }

    /**
     * Show the form for creating a new live configuration.
     */
    public function create(): Response
    {
        $statuses = Status::query()
            ->where('type', 'login')
            ->orWhere(function ($q) {
                $q->where('type', 'general');
            })
            ->get(['id', 'name', 'slug']);

        return inertia('admin/live-configuration-create', [
            'statuses' => $statuses,
        ]);
    }

    /**
     * Store a newly created live configuration.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'number_of_courts' => ['required', 'integer', 'min:1', 'max:50'],
            'scoring_system' => ['required', 'string', 'in:side-out,rally-point'],
            'allow_court_change' => ['nullable', 'boolean'],
            'court_change_trigger' => ['nullable', 'string', 'in:none,rally-count,score-count,game-end,match-end'],
            'court_change_interval' => ['nullable', 'integer', 'min:1', 'max:255'],
            'status_id' => ['required', 'integer', 'exists:statuses,id'],
        ]);

        LiveConfiguration::create([
            'name' => $validated['name'],
            'slug' => $this->generateUniqueSlug($validated['name']),
            'number_of_courts' => $validated['number_of_courts'],
            'scoring_system' => $validated['scoring_system'],
            'allow_court_change' => $validated['allow_court_change'] ?? false,
            'court_change_trigger' => $validated['court_change_trigger'] ?? 'none',
            'court_change_interval' => $validated['court_change_interval'] ?? null,
            'status_id' => $validated['status_id'],
        ]);

        return to_route('admin.live-configuration.index')
            ->with('success', 'Live configuration created successfully.');
    }

    /**
     * Generate a unique slug from a given name.
     */
    private function generateUniqueSlug(string $name): string
    {
        $base = \Illuminate\Support\Str::slug($name);
        $slug = $base;
        $counter = 2;

        while (LiveConfiguration::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Display the live court setup for a configuration.
     * Only shows pending and playing matches in court cards.
     */
    public function show(LiveConfiguration $liveConfiguration): Response
    {
        // Get the completed status ID to filter it out from match_scores
        $completedStatus = Status::where('type', 'live-match')->where('slug', 'completed')->first();
        $completedStatusId = $completedStatus?->id;

        $liveConfiguration->load([
            'status',
            'categories',
            'matchScores' => function ($query) use ($completedStatusId) {
                // Only load matches that are NOT completed (pending, playing, etc.)
                if ($completedStatusId) {
                    $query->where('status_id', '!=', $completedStatusId);
                }
            },
            'matchScores.category',
            'matchScores.nextCategory',
            'matchScores.teamA',
            'matchScores.teamB',
            'matchScores.nextTeamA',
            'matchScores.nextTeamB',
            'matchScores.status',
            'matchScores.umpire',
        ]);

        $teams = LiveTeam::query()
            ->where('live_configuration_id', $liveConfiguration->id)
            ->with('category')
            ->latest('created_at')
            ->get();
        $statuses = Status::query()->where('type', 'live-match')->get(['id', 'name', 'slug']);

        // Resolve player names for team display and team edit modal
        $allPlayerIds = $teams->pluck('player_ids')->flatten()->unique()->filter()->values()->toArray();
        $players = [];
        if (!empty($allPlayerIds)) {
            $players = User::query()
                ->join('player_information', 'users.id', '=', 'player_information.user_id')
                ->whereIn('users.id', $allPlayerIds)
                ->select(
                    'users.id',
                    'users.email',
                    'player_information.first_name',
                    'player_information.last_name'
                )
                ->get();
        }

        // Get umpires (users with role_id=4 / organization-umpire)
        $umpires = User::query()
            ->join('player_information', 'users.id', '=', 'player_information.user_id')
            ->where('users.role_id', function ($q) {
                $q->select('id')->from('roles')->where('type', 'login')->where('slug', 'umpire')->limit(1);
            })
            ->select(
                'users.id',
                'users.email',
                'player_information.first_name',
                'player_information.last_name'
            )
            ->get();

        // Load standings grouped by category, with team data, sorted by win-loss record,
        // then head-to-head, then point differential, then total points scored.
        $standings = LiveStanding::query()
            ->where('live_configuration_id', $liveConfiguration->id)
            ->with(['team', 'category'])
            ->get()
            ->groupBy('category_id')
            ->map(function ($categoryStandings) {
                $categoryStandings = $categoryStandings->values()->all();

                usort($categoryStandings, function ($left, $right) {
                    if ($left->wins !== $right->wins) {
                        return $right->wins <=> $left->wins;
                    }

                    $leftMatches = LiveMatchScore::query()
                        ->where('live_configuration_id', $left->live_configuration_id)
                        ->where('category_id', $left->category_id)
                        ->where(function ($query) use ($left, $right) {
                            $query->where(function ($subQuery) use ($left, $right) {
                                $subQuery->where('team_a_id', $left->team_id)
                                    ->where('team_b_id', $right->team_id);
                            })->orWhere(function ($subQuery) use ($left, $right) {
                                $subQuery->where('team_a_id', $right->team_id)
                                    ->where('team_b_id', $left->team_id);
                            });
                        })
                        ->get();

                    $leftHeadToHeadWins = 0;
                    $rightHeadToHeadWins = 0;

                    foreach ($leftMatches as $match) {
                        if ($match->team_a_id == $left->team_id && $match->team_b_id == $right->team_id) {
                            $leftHeadToHeadWins += $match->team_a_score > $match->team_b_score ? 1 : 0;
                            $rightHeadToHeadWins += $match->team_b_score > $match->team_a_score ? 1 : 0;
                        }

                        if ($match->team_a_id == $right->team_id && $match->team_b_id == $left->team_id) {
                            $leftHeadToHeadWins += $match->team_b_score > $match->team_a_score ? 1 : 0;
                            $rightHeadToHeadWins += $match->team_a_score > $match->team_b_score ? 1 : 0;
                        }
                    }

                    if ($leftHeadToHeadWins !== $rightHeadToHeadWins) {
                        return $rightHeadToHeadWins <=> $leftHeadToHeadWins;
                    }

                    if ($left->point_differential !== $right->point_differential) {
                        return $right->point_differential <=> $left->point_differential;
                    }

                    return $right->points_for <=> $left->points_for;
                });

                return collect($categoryStandings)->values();
            });

        return inertia('admin/live-configuration-show', [
            'configuration' => $liveConfiguration,
            'teams' => $teams,
            'statuses' => $statuses,
            'players' => $players,
            'umpires' => $umpires,
            'standings' => $standings,
        ]);
    }

    /**
     * Show the form for editing a live configuration.
     */
    public function edit(LiveConfiguration $liveConfiguration): Response
    {
        $statuses = Status::query()
            ->where('type', 'login')
            ->orWhere(function ($q) {
                $q->where('type', 'general');
            })
            ->get(['id', 'name', 'slug']);

        return inertia('admin/live-configuration-edit', [
            'configuration' => $liveConfiguration->load('status'),
            'statuses' => $statuses,
        ]);
    }

    /**
     * Update a live configuration.
     */
    public function update(Request $request, LiveConfiguration $liveConfiguration): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'number_of_courts' => ['required', 'integer', 'min:1', 'max:50'],
            'scoring_system' => ['required', 'string', 'in:side-out,rally-point'],
            'allow_court_change' => ['nullable', 'boolean'],
            'court_change_trigger' => ['nullable', 'string', 'in:none,rally-count,score-count,game-end,match-end'],
            'court_change_interval' => ['nullable', 'integer', 'min:1', 'max:255'],
            'status_id' => ['required', 'integer', 'exists:statuses,id'],
        ]);

        $liveConfiguration->update([
            'name' => $validated['name'],
            'slug' => $this->generateUniqueSlug($validated['name']),
            'number_of_courts' => $validated['number_of_courts'],
            'scoring_system' => $validated['scoring_system'],
            'allow_court_change' => $validated['allow_court_change'] ?? false,
            'court_change_trigger' => $validated['court_change_trigger'] ?? 'none',
            'court_change_interval' => $validated['court_change_interval'] ?? null,
            'status_id' => $validated['status_id'],
        ]);

        return to_route('admin.live-configuration.index')
            ->with('success', 'Live configuration updated successfully.');
    }

    /**
     * Remove a live configuration.
     */
    public function destroy(LiveConfiguration $liveConfiguration): RedirectResponse
    {
        $liveConfiguration->matchScores()->delete();
        $liveConfiguration->categories()->delete();
        LiveStanding::where('live_configuration_id', $liveConfiguration->id)->delete();
        // Delete only the teams scoped to this configuration to avoid orphaned records.
        LiveTeam::where('live_configuration_id', $liveConfiguration->id)->delete();
        $liveConfiguration->delete();

        return to_route('admin.live-configuration.index')
            ->with('success', 'Live configuration deleted successfully.');
    }

    // ========================
    // Player Search (for team creation)
    // ========================

    public function searchPlayers(Request $request): \Illuminate\Http\JsonResponse
    {
        $query = $request->input('q', '');
        $excludeIds = $request->input('exclude_ids', []);

        if (is_string($excludeIds)) {
            $excludeIds = array_filter(array_map('intval', explode(',', $excludeIds)));
        }

        $players = User::query()
            ->join('player_information', 'users.id', '=', 'player_information.user_id')
            ->where('users.role_id', function ($q) {
                $q->select('id')->from('roles')->where('slug', 'player')->limit(1);
            })
            ->when(!empty($excludeIds), function ($q) use ($excludeIds) {
                $q->whereNotIn('users.id', $excludeIds);
            })
            ->when($query, function ($q) use ($query) {
                $q->where(function ($sub) use ($query) {
                    $sub->where('player_information.first_name', 'like', "%{$query}%")
                        ->orWhere('player_information.last_name', 'like', "%{$query}%")
                        ->orWhere('users.email', 'like', "%{$query}%");
                });
            })
            ->select(
                'users.id',
                'users.email',
                'player_information.first_name',
                'player_information.last_name'
            )
            ->limit(20)
            ->get();

        return response()->json($players);
    }

    // ========================
    // Category Management
    // ========================

    public function storeCategory(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'live_configuration_id' => ['required', 'integer', 'exists:live_configurations,id'],
            'name' => ['required', 'string', 'max:255'],
            'game_to' => ['required', 'integer', 'min:1', 'max:999'],
            'game_time' => ['nullable', 'string', 'max:50'],
            'game_interval' => ['nullable', 'string', 'max:50'],
        ]);

        LiveCategory::create($validated);

        return redirect()->back()->with('success', 'Category created successfully.');
    }

    public function updateCategory(Request $request, LiveCategory $liveCategory): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'game_to' => ['required', 'integer', 'min:1', 'max:999'],
            'game_time' => ['nullable', 'string', 'max:50'],
            'game_interval' => ['nullable', 'string', 'max:50'],
        ]);

        $liveCategory->update($validated);

        return redirect()->back()->with('success', 'Category updated successfully.');
    }

    public function destroyCategory(LiveCategory $liveCategory): RedirectResponse
    {
        $liveCategory->delete();

        return redirect()->back()->with('success', 'Category deleted successfully.');
    }

    // ========================
    // Team Management
    // ========================

    public function storeTeam(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'live_configuration_id' => ['required', 'integer', 'exists:live_configurations,id'],
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer', 'exists:live_categories,id'],
            'player_ids' => ['nullable', 'array'],
            'player_ids.*' => ['integer', 'exists:users,id'],
        ]);

        LiveTeam::create([
            'live_configuration_id' => $validated['live_configuration_id'],
            'name' => $validated['name'],
            'category_id' => $validated['category_id'] ?? null,
            'player_ids' => $validated['player_ids'] ?? [],
        ]);

        return redirect()->back()->with('success', 'Team created successfully.');
    }

    public function updateTeam(Request $request, LiveTeam $liveTeam): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer', 'exists:live_categories,id'],
            'player_ids' => ['nullable', 'array'],
            'player_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $liveTeam->update([
            'name' => $validated['name'],
            'category_id' => $validated['category_id'] ?? null,
            'player_ids' => $validated['player_ids'] ?? [],
        ]);

        return redirect()->back()->with('success', 'Team updated successfully.');
    }

    public function destroyTeam(LiveTeam $liveTeam): RedirectResponse
    {
        $liveTeam->delete();

        return redirect()->back()->with('success', 'Team deleted successfully.');
    }

    // ========================
    // Match Score Management
    // ========================

    public function storeMatchScore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'live_configuration_id' => ['required', 'integer', 'exists:live_configurations,id'],
            'court_number' => ['required', 'integer', 'min:1'],
            'category_id' => ['nullable', 'integer', 'exists:live_categories,id'],
            'next_category_id' => ['nullable', 'integer', 'exists:live_categories,id'],
            'team_a_id' => ['nullable', 'integer', 'exists:live_teams,id'],
            'team_b_id' => ['nullable', 'integer', 'exists:live_teams,id'],
            'serving_team' => ['nullable', 'string', 'in:team_a,team_b'],
            'next_team_a_id' => ['nullable', 'integer', 'exists:live_teams,id'],
            'next_team_b_id' => ['nullable', 'integer', 'exists:live_teams,id'],
            'umpire_id' => ['nullable', 'integer', 'exists:users,id'],
            'status_id' => ['required', 'integer', 'exists:statuses,id'],
        ]);

        $match = LiveMatchScore::updateOrCreate(
            [
                'id' => $request->input('id'),
                'live_configuration_id' => $validated['live_configuration_id'],
                'court_number' => $validated['court_number'],
            ],
            [
                'category_id' => $validated['category_id'] ?? null,
                'next_category_id' => $validated['next_category_id'] ?? null,
                'team_a_id' => $validated['team_a_id'] ?? null,
                'team_b_id' => $validated['team_b_id'] ?? null,
                'serving_team' => $validated['serving_team'] ?? null,
                'next_team_a_id' => $validated['next_team_a_id'] ?? null,
                'next_team_b_id' => $validated['next_team_b_id'] ?? null,
                'umpire_id' => $validated['umpire_id'] ?? null,
                'status_id' => $validated['status_id'],
            ]
        );

        $this->dispatchMatchScoreUpdate($match);

        return redirect()->back()->with('success', 'Match score updated successfully.');
    }

    public function updateMatchScore(Request $request, LiveMatchScore $liveMatchScore): RedirectResponse
    {
        $validated = $request->validate([
            'team_a_id' => ['nullable', 'integer', 'exists:live_teams,id'],
            'team_b_id' => ['nullable', 'integer', 'exists:live_teams,id'],
            'team_a_score' => ['nullable', 'integer', 'min:0'],
            'team_b_score' => ['nullable', 'integer', 'min:0'],
            'serving_team' => ['nullable', 'string', 'in:team_a,team_b'],
            'next_team_a_id' => ['nullable', 'integer', 'exists:live_teams,id'],
            'next_team_b_id' => ['nullable', 'integer', 'exists:live_teams,id'],
            'status_id' => ['required', 'integer', 'exists:statuses,id'],
        ]);

        $liveMatchScore->update($validated);
        $this->dispatchMatchScoreUpdate($liveMatchScore->fresh());

        return redirect()->back()->with('success', 'Match score updated successfully.');
    }

    public function destroyMatchScore(LiveMatchScore $liveMatchScore): RedirectResponse
    {
        $previousUmpireId = $liveMatchScore->umpire_id;
        $liveMatchScore->delete();

        $configuration = LiveConfiguration::find($liveMatchScore->live_configuration_id);
        if ($configuration) {
            broadcast(new MatchScoreUpdated($configuration, [
                'live_configuration_id' => $configuration->id,
                'court_number' => $liveMatchScore->court_number,
                'team_a_score' => 0,
                'team_b_score' => 0,
                'serving_team' => null,
                'umpire_id' => null,
                'old_umpire_id' => $previousUmpireId,
                'status_id' => null,
                'time_remaining' => null,
                'deleted' => true,
            ]));
        }

        return redirect()->back()->with('success', 'Match removed from court.');
    }

    protected function dispatchMatchScoreUpdate(LiveMatchScore $match): void
    {
        $configuration = $match->liveConfiguration()->first();
        if (! $configuration) {
            return;
        }

        $previousUmpireId = $match->getRawOriginal('umpire_id') !== null ? (int) $match->getRawOriginal('umpire_id') : null;

        $matchData = [
            'live_configuration_id' => $match->live_configuration_id,
            'court_number' => $match->court_number,
            'category_id' => $match->category_id,
            'team_a_id' => $match->team_a_id,
            'team_b_id' => $match->team_b_id,
            'team_a_score' => $match->team_a_score,
            'team_b_score' => $match->team_b_score,
            'serving_team' => $match->serving_team,
            'service_number' => $match->service_number,
            'court_change_done' => $match->court_change_done,
            'rally_count' => $match->rally_count,
            'is_paused' => $match->is_paused,
            'team_a_court' => $match->team_a_court,
            'team_b_court' => $match->team_b_court,
            'start_play_at' => $match->start_play_at?->toIso8601String(),
            'end_play_at' => $match->end_play_at?->toIso8601String(),
            'time_remaining' => null,
            'umpire_id' => $match->umpire_id,
            'old_umpire_id' => $previousUmpireId,
            'status_id' => $match->status_id,
        ];

        broadcast(new MatchScoreUpdated($configuration, $matchData, $previousUmpireId));
    }
}

