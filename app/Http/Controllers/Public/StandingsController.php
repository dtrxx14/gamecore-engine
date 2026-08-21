<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\LiveConfiguration;
use App\Models\LiveMatchScore;

class StandingsController extends Controller
{
    /**
     * Display the public standings page.
     */
    public function index()
    {
        $configurations = LiveConfiguration::query()
            ->whereHas('status', function ($query) {
                $query->where('slug', 'active');
            })
            ->get()
            ->map(function ($config) {
                return [
                    'id' => $config->id,
                    'name' => $config->name,
                    'scoring_system' => $config->scoring_system,
                    'pusher_channel' => "standings.{$config->id}",
                ];
            });

        $groupedStandings = $this->buildStandingsData();

        return inertia('public/standings', [
            'configurations' => $configurations,
            'standingsByConfig' => $groupedStandings,
        ]);
    }

    /**
     * Display the public standings page for a specific configuration by slug.
     */
    public function show(string $slug)
    {
        $configuration = LiveConfiguration::query()
            ->where('slug', $slug)
            ->whereHas('status', function ($query) {
                $query->where('slug', 'active');
            })
            ->first();

        abort_unless($configuration, 404, 'Live configuration not found.');

        $standingsData = $this->buildStandingsDataForConfig($configuration);

        return inertia('public/standings', [
            'configuration' => [
                'id' => $configuration->id,
                'name' => $configuration->name,
                'slug' => $configuration->slug,
                'scoring_system' => $configuration->scoring_system,
                'pusher_channel' => "standings.{$configuration->id}",
            ],
            'standingsData' => $standingsData,
        ]);
    }

    /**
     * API endpoint for a specific configuration by slug (polling fallback).
     */
    public function showApi(string $slug)
    {
        $configuration = LiveConfiguration::query()
            ->where('slug', $slug)
            ->whereHas('status', function ($query) {
                $query->where('slug', 'active');
            })
            ->first();

        abort_unless($configuration, 404, 'Live configuration not found.');

        $standingsData = $this->buildStandingsDataForConfig($configuration);

        return response()->json([
            'success' => true,
            'data' => $standingsData,
        ]);
    }

    /**
     * API endpoint for polling fallback.
     */
    public function api()
    {
        $groupedStandings = $this->buildStandingsData();

        return response()->json([
            'success' => true,
            'data' => $groupedStandings,
        ]);
    }

    /**
     * Build standings data for a single configuration (used by slug-based pages).
     */
    private function buildStandingsDataForConfig(LiveConfiguration $config): array
    {
        $config->load(['categories', 'categories.teams']);

        $configData = [
            'live_configuration_id' => $config->id,
            'configuration_id' => $config->id,
            'configuration_name' => $config->name,
            'scoring_system' => $config->scoring_system,
            'pusher_channel' => "standings.{$config->id}",
            'categories' => [],
        ];

        foreach ($config->categories as $category) {
            $matches = LiveMatchScore::query()
                ->where('live_configuration_id', $config->id)
                ->where('category_id', $category->id)
                ->where(function ($query) {
                    $query->whereNotNull('end_play_at')
                        ->orWhereHas('status', fn ($status) => $status
                            ->where('type', 'live-match')
                            ->where('slug', 'completed'));
                })
                ->whereNotNull('team_a_id')
                ->whereNotNull('team_b_id')
                ->get();

            $teamsById = [];
            $headToHead = [];

            foreach ($category->teams as $team) {
                $teamsById[(int) $team->id] = [
                    'live_configuration_id' => $config->id,
                    'category_id' => $category->id,
                    'team_id' => (int) $team->id,
                    'team_name' => $team->name,
                    'court_number' => 0,
                    'matches_played' => 0,
                    'wins' => 0,
                    'losses' => 0,
                    'points_for' => 0,
                    'points_against' => 0,
                    'point_differential' => 0,
                ];
            }

            foreach ($matches as $match) {
                $teamAId = (int) $match->team_a_id;
                $teamBId = (int) $match->team_b_id;
                $teamA = $category->teams->firstWhere('id', $teamAId);
                $teamB = $category->teams->firstWhere('id', $teamBId);

                if ($teamAId === $teamBId || ! $teamA || ! $teamB || $match->team_a_score === null || $match->team_b_score === null) {
                    continue;
                }

                // Each completed row is one game for team_a_id and one game for team_b_id.
                foreach ([[$teamAId, $teamA], [$teamBId, $teamB]] as [$teamId, $team]) {
                    $teamsById[$teamId] ??= [
                        'live_configuration_id' => $config->id,
                        'category_id' => $category->id,
                        'team_id' => $teamId,
                        'team_name' => $team->name,
                        'court_number' => $match->court_number,
                        'matches_played' => 0,
                        'wins' => 0,
                        'losses' => 0,
                        'points_for' => 0,
                        'points_against' => 0,
                        'point_differential' => 0,
                    ];
                }

                $teamsById[$teamAId]['matches_played']++;
                $teamsById[$teamBId]['matches_played']++;
                $teamsById[$teamAId]['points_for'] += (int) $match->team_a_score;
                $teamsById[$teamAId]['points_against'] += (int) $match->team_b_score;
                $teamsById[$teamBId]['points_for'] += (int) $match->team_b_score;
                $teamsById[$teamBId]['points_against'] += (int) $match->team_a_score;
                $teamsById[$teamAId]['point_differential'] += $match->team_a_score - $match->team_b_score;
                $teamsById[$teamBId]['point_differential'] += $match->team_b_score - $match->team_a_score;

                if ($match->team_a_score > $match->team_b_score) {
                    $teamsById[$teamAId]['wins']++;
                    $teamsById[$teamBId]['losses']++;
                    $headToHead[$teamAId][$teamBId] = ($headToHead[$teamAId][$teamBId] ?? 0) + 1;
                } elseif ($match->team_b_score > $match->team_a_score) {
                    $teamsById[$teamBId]['wins']++;
                    $teamsById[$teamAId]['losses']++;
                    $headToHead[$teamBId][$teamAId] = ($headToHead[$teamBId][$teamAId] ?? 0) + 1;
                }
            }

            $teams = array_values($teamsById);

            usort($teams, function (array $left, array $right) use ($headToHead): int {
                if ($left['wins'] !== $right['wins']) {
                    return $right['wins'] <=> $left['wins'];
                }

                $leftHeadToHeadWins = $headToHead[$left['team_id']][$right['team_id']] ?? 0;
                $rightHeadToHeadWins = $headToHead[$right['team_id']][$left['team_id']] ?? 0;
                if ($leftHeadToHeadWins !== $rightHeadToHeadWins) {
                    return $rightHeadToHeadWins <=> $leftHeadToHeadWins;
                }

                if ($left['point_differential'] !== $right['point_differential']) {
                    return $right['point_differential'] <=> $left['point_differential'];
                }

                return $right['points_for'] <=> $left['points_for'];
            });

            foreach ($teams as $index => $team) {
                $teams[$index]['rank'] = $index + 1;
            }

            $configData['categories'][] = [
                'live_configuration_id' => $config->id,
                'category_id' => $category->id,
                'category_name' => $category->name,
                'game_to' => $category->game_to ?? 21,
                'win_by' => $category->win_by ?? 1,
                'game_time' => $category->game_time,
                'game_interval' => $category->game_interval,
                'teams' => $teams,
            ];
        }

        return $configData;
    }

    /**
     * Build a head-to-head summary for teams tied on wins within a category.
     */
    private function buildHeadToHeadRecords(array $teams, int $configurationId, int $categoryId): array
    {
        if (count($teams) < 2) {
            return [];
        }

        $highestWins = max(array_map(fn (array $team): int => $team['wins'], $teams));
        $tiedTeamIds = array_values(array_map(
            fn (array $team): int => $team['team_id'],
            array_filter($teams, fn (array $team): bool => $team['wins'] === $highestWins)
        ));

        if (count($tiedTeamIds) < 2) {
            return [];
        }

        $records = array_fill_keys($tiedTeamIds, ['wins' => 0, 'losses' => 0, 'matches' => 0]);

        $matches = LiveMatchScore::query()
            ->where('live_configuration_id', $configurationId)
            ->where('category_id', $categoryId)
            ->where(function ($query) use ($tiedTeamIds) {
                $query->whereIn('team_a_id', $tiedTeamIds)
                    ->whereIn('team_b_id', $tiedTeamIds);
            })
            ->get();

        foreach ($matches as $match) {
            $teamAId = (int) $match->team_a_id;
            $teamBId = (int) $match->team_b_id;

            if (! in_array($teamAId, $tiedTeamIds, true) || ! in_array($teamBId, $tiedTeamIds, true)) {
                continue;
            }

            if ($match->team_a_score === null || $match->team_b_score === null) {
                continue;
            }

            $records[$teamAId]['matches']++;
            $records[$teamBId]['matches']++;

            if ($match->team_a_score > $match->team_b_score) {
                $records[$teamAId]['wins']++;
                $records[$teamBId]['losses']++;
            } elseif ($match->team_b_score > $match->team_a_score) {
                $records[$teamBId]['wins']++;
                $records[$teamAId]['losses']++;
            }
        }

        return $records;
    }

    /**
     * Compare head-to-head performance for teams tied on wins.
     */
    private function compareHeadToHead(int $leftTeamId, int $rightTeamId, array $headToHeadRecords, int $configurationId, int $categoryId): int
    {
        $leftMatches = $headToHeadRecords[$leftTeamId]['matches'] ?? 0;
        $rightMatches = $headToHeadRecords[$rightTeamId]['matches'] ?? 0;

        if ($leftMatches === 0 && $rightMatches === 0) {
            return 0;
        }

        $leftWins = $headToHeadRecords[$leftTeamId]['wins'] ?? 0;
        $rightWins = $headToHeadRecords[$rightTeamId]['wins'] ?? 0;

        if ($leftWins !== $rightWins) {
            return $rightWins <=> $leftWins;
        }

        return 0;
    }

    /**
     * Build standings data grouped by configuration and category.
     */
    private function buildStandingsData(): array
    {
        $activeConfigs = LiveConfiguration::query()
            ->whereHas('status', function ($query) {
                $query->where('slug', 'active');
            })
            ->get();

        $result = [];

        foreach ($activeConfigs as $config) {
            $result[] = $this->buildStandingsDataForConfig($config);
        }

        return $result;
    }
}
