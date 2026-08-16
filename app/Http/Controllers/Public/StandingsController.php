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
                ->groupBy('team_id')
                ->select([
                    'team_id',
                    DB::raw('SUM(matches_played) as matches_played'),
                    DB::raw('SUM(wins) as wins'),
                    DB::raw('SUM(losses) as losses'),
                    DB::raw('SUM(points_for) as points_for'),
                    DB::raw('SUM(points_against) as points_against'),
                    DB::raw('SUM(point_differential) as point_differential'),
                ])
                ->orderByRaw('SUM(wins) DESC')
                ->orderByRaw('SUM(point_differential) DESC')
                ->orderByRaw('SUM(points_for) DESC')
                ->get();

            $teams = [];
            $rank = 1;

            foreach ($standings as $standing) {
                $team = LiveTeam::find($standing->team_id);
                if (! $team) {
                    continue;
                }

                // Get court number from the most recent match
                $latestMatch = LiveMatchScore::query()
                    ->where('live_configuration_id', $config->id)
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
                    'rank' => $rank,
                    'team_name' => $team->name,
                    'court_number' => $latestMatch->court_number ?? 0,
                    'matches_played' => $standing->matches_played,
                    'wins' => $standing->wins,
                    'losses' => $standing->losses,
                    'points_for' => $standing->points_for,
                    'points_against' => $standing->points_against,
                    'point_differential' => $standing->point_differential,
                ];

                $rank++;
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
