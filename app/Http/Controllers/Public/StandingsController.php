<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\LiveConfiguration;
use App\Models\LiveMatchScore;
use App\Models\LiveStanding;
use App\Models\LiveTeam;
use Illuminate\Support\Facades\DB;

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
            $standings = LiveStanding::query()
                ->where('live_configuration_id', $config->id)
                ->where('category_id', $category->id)
                ->select([
                    'live_configuration_id',
                    'category_id',
                    'team_id',
                    DB::raw('SUM(matches_played) as matches_played'),
                    DB::raw('SUM(wins) as wins'),
                    DB::raw('SUM(losses) as losses'),
                    DB::raw('SUM(points_for) as points_for'),
                    DB::raw('SUM(points_against) as points_against'),
                    DB::raw('SUM(point_differential) as point_differential'),
                ])
                ->groupBy('live_configuration_id', 'category_id', 'team_id')
                ->get();

            $teams = [];

            foreach ($standings as $standing) {
                $team = LiveTeam::find($standing->team_id);
                if (! $team) {
                    continue;
                }

                $latestMatch = LiveMatchScore::query()
                    ->where('live_configuration_id', $config->id)
                    ->where('category_id', $category->id)
                    ->where(function ($q) use ($standing) {
                        $q->where('team_a_id', $standing->team_id)
                            ->orWhere('team_b_id', $standing->team_id);
                    })
                    ->latest()
                    ->first();

                $teams[] = [
                    'live_configuration_id' => $config->id,
                    'category_id' => $category->id,
                    'team_id' => $standing->team_id,
                    'team_name' => $team->name,
                    'court_number' => $latestMatch->court_number ?? 0,
                    'matches_played' => (int) $standing->matches_played,
                    'wins' => (int) $standing->wins,
                    'losses' => (int) $standing->losses,
                    'points_for' => (int) $standing->points_for,
                    'points_against' => (int) $standing->points_against,
                    'point_differential' => (int) $standing->point_differential,
                ];
            }

            $headToHeadRecords = $this->buildHeadToHeadRecords($teams, $config->id, $category->id);

            usort($teams, function (array $left, array $right) use ($headToHeadRecords, $config, $category): int {
                if ($left['wins'] !== $right['wins']) {
                    return $right['wins'] <=> $left['wins'];
                }

                $headToHeadComparison = $this->compareHeadToHead($left['team_id'], $right['team_id'], $headToHeadRecords, $config->id, $category->id);
                if ($headToHeadComparison !== 0) {
                    return $headToHeadComparison;
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
