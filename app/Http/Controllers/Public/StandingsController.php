<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\LiveConfiguration;
use App\Models\LiveStanding;
use App\Models\LiveMatchScore;
use App\Models\LiveTeam;
use Illuminate\Http\Request;

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
     * Build standings data grouped by configuration and category.
     */
    private function buildStandingsData(): array
    {
        $activeConfigs = LiveConfiguration::query()
            ->whereHas('status', function ($query) {
                $query->where('slug', 'active');
            })
            ->with(['categories', 'categories.teams'])
            ->get();

        $result = [];

        foreach ($activeConfigs as $config) {
            $configData = [
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
                    ->orderBy('wins', 'desc')
                    ->orderBy('point_differential', 'desc')
                    ->orderBy('points_for', 'desc')
                    ->get();

                $teams = [];
                $rank = 1;

                foreach ($standings as $standing) {
                    $team = LiveTeam::find($standing->team_id);
                    if (!$team) continue;

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
                        'rank' => $rank,
                        'team_id' => $standing->team_id,
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
                    'category_id' => $category->id,
                    'category_name' => $category->name,
                    'game_to' => $category->game_to ?? 21,
                    'teams' => $teams,
                ];
            }

            $result[] = $configData;
        }

        return $result;
    }
}
