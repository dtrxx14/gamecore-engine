<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\LiveConfiguration;
use App\Models\LiveMatchScore;
use App\Models\Status;
use App\Models\User;

class LiveCourtsController extends Controller
{
    /**
     * Display the public courts overview page.
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
                    'number_of_courts' => $config->number_of_courts,
                    'scoring_system' => $config->scoring_system,
                    'pusher_channel' => "courts.{$config->id}",
                ];
            });

        $courtsData = $this->buildCourtsData();

        return inertia('public/courts', [
            'configurations' => $configurations,
            'courtsByConfig' => $courtsData,
        ]);
    }

/**
     * Display the public courts page for a specific configuration by slug.
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

        $courtsData = $this->buildCourtsDataForConfig($configuration);

        return inertia('public/courts', [
            'configuration' => [
                'id' => $configuration->id,
                'name' => $configuration->name,
                'slug' => $configuration->slug,
                'number_of_courts' => $configuration->number_of_courts,
                'scoring_system' => $configuration->scoring_system,
                'pusher_channel' => "courts.{$configuration->id}",
            ],
            'courtsData' => $courtsData,
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

        $courtsData = $this->buildCourtsDataForConfig($configuration);

        return response()->json([
            'success' => true,
            'data' => $courtsData,
        ]);
    }

    /**
     * API endpoint for polling fallback.
     */
    public function api()
    {
        $courtsData = $this->buildCourtsData();

        return response()->json([
            'success' => true,
            'data' => $courtsData,
        ]);
    }

/**
     * Build courts data for a single configuration (used by slug-based pages).
     */
    private function buildCourtsDataForConfig(LiveConfiguration $config): array
    {
        $completedStatus = Status::where('type', 'live-match')->where('slug', 'completed')->first();

        // Get all matches for this config that are not completed (playing, paused, setup)
        $activeMatches = LiveMatchScore::query()
            ->where('live_configuration_id', $config->id)
            ->where(function ($q) use ($completedStatus) {
                $q->where('status_id', '!=', $completedStatus->id)
                  ->orWhereNull('status_id');
            })
            ->with([
                'liveConfiguration',
                'category',
                'teamA',
                'teamB',
                'nextTeamA',
                'nextTeamB',
                'status',
            ])
            ->orderBy('court_number')
            ->get();

        // Also get completed matches (for showing recent results)
        $recentCompleted = LiveMatchScore::query()
            ->where('live_configuration_id', $config->id)
            ->where('status_id', $completedStatus->id)
            ->with([
                'liveConfiguration',
                'category',
                'teamA',
                'teamB',
                'status',
            ])
            ->orderBy('updated_at', 'desc')
            ->get();

        $courts = [];

        // Group active matches by court
        foreach ($activeMatches as $match) {
            $courtNum = $match->court_number;

            $playersA = [];
            $playersB = [];

            if ($match->teamA) {
                $playerIds = $match->teamA->player_ids ?? [];
                $playersA = User::whereIn('id', $playerIds)
                    ->with('playerInformation')
                    ->get()
                    ->map(function ($user) {
                        $profile = $user->playerInformation;
                        return [
                            'id' => $user->id,
                            'first_name' => $profile?->first_name,
                            'last_name' => $profile?->last_name,
                            'profile_image' => $profile?->profile_image,
                        ];
                    })->toArray();
            }

            if ($match->teamB) {
                $playerIds = $match->teamB->player_ids ?? [];
                $playersB = User::whereIn('id', $playerIds)
                    ->with('playerInformation')
                    ->get()
                    ->map(function ($user) {
                        $profile = $user->playerInformation;
                        return [
                            'id' => $user->id,
                            'first_name' => $profile?->first_name,
                            'last_name' => $profile?->last_name,
                            'profile_image' => $profile?->profile_image,
                        ];
                    })->toArray();
            }

            // Compute phase
            $phase = 'setup';
            if ($match->end_play_at) {
                $phase = 'finished';
            } elseif ($match->start_play_at) {
                $phase = $match->is_paused ? 'paused' : 'playing';
            }

            // Calculate time remaining
            $timeRemaining = null;
            if ($match->start_play_at && $match->category?->game_time) {
                $gameMinutes = (int) $match->category->game_time;
                $totalGameSeconds = $gameMinutes * 60;

                if ($match->is_paused && $match->paused_at) {
                    $elapsed = $match->start_play_at->diffInSeconds($match->paused_at);
                    $timeRemaining = max(0, $totalGameSeconds - $elapsed);
                } else {
                    $elapsed = $match->start_play_at->diffInSeconds(now());
                    $timeRemaining = max(0, $totalGameSeconds - $elapsed);
                }
            }

            $courts[$courtNum] = [
                'court_number' => $courtNum,
                'phase' => $phase,
                'is_paused' => $match->is_paused,
                'category' => $match->category ? [
                    'id' => $match->category->id,
                    'name' => $match->category->name,
                    'game_to' => $match->category->game_to,
                    'game_time' => $match->category->game_time,
                ] : null,
                'team_a' => $match->teamA ? [
                    'id' => $match->teamA->id,
                    'name' => $match->teamA->name,
                    'players' => $playersA,
                ] : null,
                'team_b' => $match->teamB ? [
                    'id' => $match->teamB->id,
                    'name' => $match->teamB->name,
                    'players' => $playersB,
                ] : null,
                'team_a_score' => $match->team_a_score ?? 0,
                'team_b_score' => $match->team_b_score ?? 0,
                'team_a_court' => $match->team_a_court,
                'team_b_court' => $match->team_b_court,
                'serving_team' => $match->serving_team,
                'service_number' => $match->service_number ?? 1,
                'rally_count' => $match->rally_count ?? 0,
                'time_remaining' => $timeRemaining,
                'next_team_a' => $match->nextTeamA ? [
                    'id' => $match->nextTeamA->id,
                    'name' => $match->nextTeamA->name,
                ] : null,
                'next_team_b' => $match->nextTeamB ? [
                    'id' => $match->nextTeamB->id,
                    'name' => $match->nextTeamB->name,
                ] : null,
                'next_category' => $match->nextCategory ? [
                    'id' => $match->nextCategory->id,
                    'name' => $match->nextCategory->name,
                ] : null,
            ];
        }

        // Fill in empty courts
        for ($i = 1; $i <= $config->number_of_courts; $i++) {
            if (!isset($courts[$i])) {
                $courts[$i] = [
                    'court_number' => $i,
                    'phase' => 'idle',
                    'is_paused' => false,
                    'category' => null,
                    'team_a' => null,
                    'team_b' => null,
                    'team_a_score' => 0,
                    'team_b_score' => 0,
                    'team_a_court' => null,
                    'team_b_court' => null,
                    'serving_team' => null,
                    'rally_count' => 0,
                    'time_remaining' => null,
                    'next_team_a' => null,
                    'next_team_b' => null,
                    'next_category' => null,
                ];
            }
        }

        ksort($courts);

        return [
            'configuration_id' => $config->id,
            'configuration_name' => $config->name,
            'number_of_courts' => $config->number_of_courts,
            'scoring_system' => $config->scoring_system,
            'pusher_channel' => "courts.{$config->id}",
            'courts' => array_values($courts),
            'recent_completed' => $recentCompleted->map(function ($match) {
                return [
                    'court_number' => $match->court_number,
                    'team_a_name' => $match->teamA?->name ?? '—',
                    'team_b_name' => $match->teamB?->name ?? '—',
                    'team_a_score' => $match->team_a_score,
                    'team_b_score' => $match->team_b_score,
                    'category_name' => $match->category?->name ?? '—',
                ];
            }),
        ];
    }

    /**
     * Build courts data grouped by configuration and court number.
     */
    private function buildCourtsData(): array
    {
        $activeConfigs = LiveConfiguration::query()
            ->whereHas('status', function ($query) {
                $query->where('slug', 'active');
            })
            ->get();

        $result = [];

        foreach ($activeConfigs as $config) {
            $result[] = $this->buildCourtsDataForConfig($config);
        }

        return $result;
    }
}
