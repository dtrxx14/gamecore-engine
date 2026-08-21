<?php

namespace App\Http\Controllers\Umpire;

use App\Events\MatchScoreUpdated;
use App\Events\StandingsUpdated;
use App\Http\Controllers\Controller;
use App\Models\LiveConfiguration;
use App\Models\LiveMatchScore;
use App\Models\LiveStanding;
use App\Models\LiveTeam;
use App\Models\Status;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Response;

class UmpireDashboardController extends Controller
{
    /**
     * Display the umpire dashboard showing assigned courts.
     */
    public function index(): Response
    {
        $userId = auth()->id();

        $completedStatus = Status::where('type', 'live-match')->where('slug', 'completed')->first();
        $assignments = LiveMatchScore::query()
            ->where('umpire_id', $userId)
            ->with([
                'liveConfiguration',
                'liveConfiguration.status',
                'category',
                'teamA',
                'teamB',
                'nextTeamA',
                'nextTeamB',
                'status',
            ])
            ->where('status_id', '!=', $completedStatus->id)
            ->orderBy('live_configuration_id')
            ->orderBy('court_number')
            ->get();

        // Group assignments by configuration
        $groupedAssignments = $assignments->groupBy('live_configuration_id')->map(function ($scores, $configId) {
            $config = $scores->first()->liveConfiguration;

            return [
                'configuration' => $config,
                'courts' => $scores->values(),
            ];
        })->values();

        return inertia('umpire/dashboard', [
            'groupedAssignments' => $groupedAssignments,
        ]);
    }

    /**
     * Compute the match phase for the frontend.
     */
    private function computeMatchPhase(LiveMatchScore $match): string
    {
        if ($match->end_play_at) {
            return 'finished';
        }

        if ($match->start_play_at) {
            if ($match->is_paused) {
                return 'paused';
            }

            return 'playing';
        }

        return 'setup';
    }

    /**
     * Calculate time remaining for a match.
     */
    private function calculateTimeRemaining(LiveMatchScore $match): ?int
    {
        if (! $match->start_play_at || ! $match->category?->game_time) {
            return null;
        }

        $gameMinutes = (int) $match->category->game_time;
        $totalGameSeconds = $gameMinutes * 60;

        if ($match->is_paused && $match->paused_at) {
            $elapsedSeconds = $match->start_play_at->diffInSeconds($match->paused_at);

            return max(0, $totalGameSeconds - $elapsedSeconds);
        }

        $elapsedSeconds = $match->start_play_at->diffInSeconds(now());

        return max(0, $totalGameSeconds - $elapsedSeconds);
    }

    /**
     * Display the match detail page for a specific assigned match.
     */
    public function show(LiveMatchScore $liveMatchScore): Response
    {
        // Ensure the umpire owns this assignment
        if ($liveMatchScore->umpire_id !== auth()->id()) {
            abort(403, 'You are not assigned to this match.');
        }

        $liveMatchScore->load([
            'liveConfiguration',
            'liveConfiguration.status',
            'category',
            'teamA',
            'teamB',
            'nextTeamA',
            'nextTeamB',
            'status',
        ]);

        // Compute phase for browser refresh persistence
        $phase = $this->computeMatchPhase($liveMatchScore);
        $timeRemaining = $this->calculateTimeRemaining($liveMatchScore);

        // Load player details for team A and team B
        $matchData = $liveMatchScore->toArray();

        // Append player details to teams
        if ($liveMatchScore->teamA) {
            $playerIds = $liveMatchScore->teamA->player_ids ?? [];
            $players = User::whereIn('id', $playerIds)
                ->with('playerInformation')
                ->get()
                ->map(function ($user) {
                    $profile = $user->playerInformation;

                    return [
                        'id' => $user->id,
                        'email' => $user->email,
                        'first_name' => $profile?->first_name,
                        'last_name' => $profile?->last_name,
                        'profile_image' => $profile?->profile_image,
                    ];
                });
            $matchData['team_a']['players'] = $players;
        }

        if ($liveMatchScore->teamB) {
            $playerIds = $liveMatchScore->teamB->player_ids ?? [];
            $players = User::whereIn('id', $playerIds)
                ->with('playerInformation')
                ->get()
                ->map(function ($user) {
                    $profile = $user->playerInformation;

                    return [
                        'id' => $user->id,
                        'email' => $user->email,
                        'first_name' => $profile?->first_name,
                        'last_name' => $profile?->last_name,
                        'profile_image' => $profile?->profile_image,
                    ];
                });
            $matchData['team_b']['players'] = $players;
        }

        // Check for existing winner
        // Only flag winner in setup/show if match already has end_play_at (completed)
        // or if exactly one team reached game_to (to avoid false positives on undo)
        $gameTo = $liveMatchScore->category?->game_to ?? 21;
        $winBy = $liveMatchScore->category?->win_by ?? 1;
        $winner = null;
        if ($liveMatchScore->end_play_at) {
            // Match completed - determine from final scores
            if ($liveMatchScore->team_a_score > $liveMatchScore->team_b_score) {
                $winner = 'team_a';
            } elseif ($liveMatchScore->team_b_score > $liveMatchScore->team_a_score) {
                $winner = 'team_b';
            }
        } else {
            // Match still going - require both game_to and the configured lead.
            $teamAWon = $liveMatchScore->team_a_score >= $gameTo
                && $liveMatchScore->team_a_score - $liveMatchScore->team_b_score >= $winBy;
            $teamBWon = $liveMatchScore->team_b_score >= $gameTo
                && $liveMatchScore->team_b_score - $liveMatchScore->team_a_score >= $winBy;
            if ($teamAWon && ! $teamBWon) {
                $winner = 'team_a';
            } elseif ($teamBWon && ! $teamAWon) {
                $winner = 'team_b';
            }
        }

        return inertia('umpire/match-detail', [
            'match' => $matchData,
            'phase' => $phase,
            'time_remaining' => $timeRemaining,
            'existing_winner' => $winner,
        ]);
    }

    /**
     * Update match setup (team verification, default timer, court sides, serving team).
     */
    public function updateMatchSetup(Request $request, LiveMatchScore $liveMatchScore)
    {
        // Ensure the umpire owns this assignment
        if ($liveMatchScore->umpire_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'team_a_verified' => 'sometimes|boolean',
            'team_b_verified' => 'sometimes|boolean',
            'both_teams_present' => 'sometimes|boolean',
            'default_timer_started' => 'sometimes|boolean',
            'coin_toss_result' => 'sometimes|in:heads,tails',
            'coin_toss_winner' => 'sometimes|in:team_a,team_b',
            'coin_toss_choice' => 'sometimes|in:service,court',
            'serving_team' => 'sometimes|in:team_a,team_b',
            'team_a_court' => 'sometimes|in:left,right',
            'team_b_court' => 'sometimes|in:left,right',
            'status_slug' => 'sometimes|string',
        ]);

        $updateData = [];

        if (isset($validated['serving_team'])) {
            $updateData['serving_team'] = $validated['serving_team'];
        }

        if (isset($validated['team_a_court'])) {
            $updateData['team_a_court'] = $validated['team_a_court'];
        }

        if (isset($validated['team_b_court'])) {
            $updateData['team_b_court'] = $validated['team_b_court'];
        }

        if (isset($validated['status_slug'])) {
            $status = Status::where('slug', $validated['status_slug'])->first();
            if ($status) {
                $updateData['status_id'] = $status->id;
            }
        }

        if (! empty($updateData)) {
            $liveMatchScore->update($updateData);
        }

        // Reload relationships
        $liveMatchScore->load([
            'liveConfiguration',
            'liveConfiguration.status',
            'category',
            'teamA',
            'teamB',
            'nextTeamA',
            'nextTeamB',
            'status',
        ]);

        return response()->json([
            'success' => true,
            'match' => $liveMatchScore,
        ]);
    }

    /**
     * Start the match - set status to 'playing', record start_play_at, set serving team and court sides.
     */
    public function startMatch(Request $request, LiveMatchScore $liveMatchScore)
    {
        if ($liveMatchScore->umpire_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'serving_team' => 'required|in:team_a,team_b',
            'team_a_court' => 'required|in:left,right',
            'team_b_court' => 'required|in:left,right',
        ]);

        $playingStatus = Status::where('type', 'live-match')->where('slug', 'playing')->first();

        // Side-out (pickleball) scoring starts the game at 0-0-2:
        // the initial serving team serves from their 2nd server.
        $isSideOut = $liveMatchScore->liveConfiguration?->scoring_system === 'side-out';
        $initialServiceNumber = $isSideOut ? 2 : 1;

        $liveMatchScore->update([
            'serving_team' => $validated['serving_team'],
            'service_number' => $initialServiceNumber,
            'team_a_court' => $validated['team_a_court'],
            'team_b_court' => $validated['team_b_court'],
            'status_id' => $playingStatus->id ?? $liveMatchScore->status_id,
            'start_play_at' => now(),
            'rally_count' => 0,
            'is_paused' => false,
            'paused_at' => null,
            'paused_remaining' => null,
        ]);

        $liveMatchScore->load([
            'liveConfiguration', 'liveConfiguration.status', 'category',
            'teamA', 'teamB', 'status',
        ]);

        // Dispatch real-time update for score change
        $this->dispatchMatchScoreUpdate($liveMatchScore);

        return response()->json([
            'success' => true,
            'match' => $liveMatchScore,
        ]);
    }

    /**
     * Update the score for a team, increment or decrement.
     * Also tracks rally count for player change detection.
     * Decrement also decrements rally_count to keep counts consistent.
     */
    public function updateScore(Request $request, LiveMatchScore $liveMatchScore)
    {
        if ($liveMatchScore->umpire_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'team' => 'required|in:team_a,team_b',
            'action' => 'required|in:increment,decrement',
        ]);

        $teamField = $validated['team'] === 'team_a' ? 'team_a_score' : 'team_b_score';
        $currentScore = $liveMatchScore->$teamField;

        $isSideOut = $liveMatchScore->liveConfiguration?->scoring_system === 'side-out';
        $serviceNumber = (int) ($liveMatchScore->service_number ?? 1);

        if ($validated['action'] === 'increment') {
            $newScore = $currentScore + 1;
            $opponentScore = $validated['team'] === 'team_a'
                ? $liveMatchScore->team_b_score
                : $liveMatchScore->team_a_score;
            $gameTo = $liveMatchScore->category?->game_to ?? 21;
            $winBy = $liveMatchScore->category?->win_by ?? 1;
            // A game is won only after reaching game_to and leading by win_by.
            $isWinningPoint = (! $isSideOut || $validated['team'] === $liveMatchScore->serving_team)
                && $newScore >= $gameTo
                && $newScore - $opponentScore >= $winBy;

            if ($isWinningPoint) {
                // Winning point: don't increment rally count or trigger player change
                // Everything waits until the "Won" button is confirmed
                $rallyCount = $liveMatchScore->rally_count;
            } else {
                $rallyCount = $liveMatchScore->rally_count + 1;
            }
        } else {
            $newScore = max(0, $currentScore - 1);
            // Check if the old score (before decrement) was a winning point
            // If the team being decremented had a score >= game_to, this was a winning point
            // Winning points don't increment rally_count, so undo shouldn't decrement it either
            $gameTo = $liveMatchScore->category?->game_to ?? 21;
            $winBy = $liveMatchScore->category?->win_by ?? 1;
            $opponentScore = $validated['team'] === 'team_a'
                ? $liveMatchScore->team_b_score
                : $liveMatchScore->team_a_score;
            $wasWinningPoint = $currentScore >= $gameTo && $currentScore - $opponentScore >= $winBy;

            if ($wasWinningPoint) {
                // Undoing a winning point: don't change rally_count
                $rallyCount = $liveMatchScore->rally_count;
            } else {
                // Undoing a normal point: decrement rally_count
                // If rally_count is 0 (just had a player change reset), go back to 9
                if ($liveMatchScore->rally_count === 0) {
                    $rallyCount = 9;
                } else {
                    $rallyCount = $liveMatchScore->rally_count - 1;
                }
            }
        }

        $updateData = [
            $teamField => $newScore,
            'rally_count' => $rallyCount,
        ];

        if ($isSideOut) {
            // ---- SIDE-OUT (pickleball) SCORING ----
            // Only the serving team can score a point. The umpire presses "+" on
            // whichever team actually WON the rally (the serving team OR the receiving team).
            //
            // If the serving team won the rally → they score -> keep serving.
            // If the receiving team won the rally (opponent scored) →
            //      nobody's score changes (only serving team can score), and:
            //        - if serving team was on 1st server → switch to 2nd server (still serving)
            //        - if serving team was on 2nd server → SIDE OUT → serve passes to opponent, 1st server
            //
            // Game starts at 0-0-2: the initial serving team begins on their 2nd server.

            if ($validated['action'] === 'increment') {
                if ($validated['team'] === $liveMatchScore->serving_team) {
                    // Serving team won the rally → they score, keep serving, same server
                    $updateData[$teamField] = $newScore;
                } else {
                    // Receiving team won the rally → no score, service transitions
                    $updateData[$teamField] = $currentScore; // no change

                    if ($serviceNumber === 1) {
                        // 1st server lost → move to 2nd server (same team keeps serving)
                        $updateData['service_number'] = 2;
                    } else {
                        // 2nd server lost → SIDE OUT, serve passes to the other team, 1st server
                        $updateData['service_number'] = 1;
                        $updateData['serving_team'] = $validated['team'];
                    }
                }

            } else {
                // Undo a side-out rally, including service-only transitions where no score changed.
                if ($currentScore > 0) {
                    $updateData[$teamField] = $newScore;
                } elseif ($validated['team'] === $liveMatchScore->serving_team && $serviceNumber === 1) {
                    // The serving team just received service after a side-out.
                    $updateData['serving_team'] = $liveMatchScore->serving_team === 'team_a' ? 'team_b' : 'team_a';
                    $updateData['service_number'] = 2;
                } elseif ($validated['team'] !== $liveMatchScore->serving_team && $serviceNumber === 2) {
                    // The receiving team just took the first server's rally.
                    $updateData['service_number'] = 1;
                }
            }
        } else {
            // Rally Point Scoring: the team that scores becomes the serving team
            if ($validated['action'] === 'increment') {
                $updateData['serving_team'] = $validated['team'];
            }
        }

        $liveMatchScore->update($updateData);

        $liveMatchScore->load([
            'liveConfiguration', 'liveConfiguration.status', 'category',
            'teamA', 'teamB', 'status',
        ]);

        // Determine if game is won
        // Only check winner on INCREMENT: the team that just scored wins if they reach game_to
        // On DECREMENT: no winner (we're undoing the last point)
        $gameTo = $liveMatchScore->category?->game_to ?? 21;
        $winBy = $liveMatchScore->category?->win_by ?? 1;
        $winner = null;
        if ($validated['action'] === 'increment') {
            if ($isSideOut) {
                // In side-out scoring, only the serving team can score/win.
                $servingTeamNow = $liveMatchScore->serving_team;
                $servingScoreNow = $servingTeamNow === 'team_a'
                    ? $liveMatchScore->team_a_score
                    : $liveMatchScore->team_b_score;
                $opponentScoreNow = $servingTeamNow === 'team_a'
                    ? $liveMatchScore->team_b_score
                    : $liveMatchScore->team_a_score;
                if ($servingScoreNow >= $gameTo && $servingScoreNow - $opponentScoreNow >= $winBy) {
                    $winner = $servingTeamNow;
                }
            } else {
                $scoringTeam = $validated['team'];
                $scoringScore = $scoringTeam === 'team_a' ? $liveMatchScore->team_a_score : $liveMatchScore->team_b_score;
                $opponentScore = $scoringTeam === 'team_a' ? $liveMatchScore->team_b_score : $liveMatchScore->team_a_score;
                if ($scoringScore >= $gameTo && $scoringScore - $opponentScore >= $winBy) {
                    $winner = $scoringTeam;
                }
            }
        }

        // Check if player change is needed based on configuration
        $needsPlayerChange = $this->checkNeedsPlayerChange($liveMatchScore, $validated['team'], $validated['action']);

        // Dispatch real-time update for score change
        $this->dispatchMatchScoreUpdate($liveMatchScore);

        return response()->json([
            'success' => true,
            'match' => $liveMatchScore,
            'winner' => $winner,
            'needs_player_change' => $needsPlayerChange,
        ]);
    }

    /**
     * Determine if a player change is needed from polling context (no scoring team/action info).
     * For score-count: triggers when max score reaches the interval (naturally one-time since scores continue past it).
     * For rally-count: triggers when rally_count hits the interval.
     */
    private function checkNeedsPlayerChangeFromPolling(LiveMatchScore $match): bool
    {
        $config = $match->liveConfiguration;
        if (! $config || ! $config->allow_court_change || $config->court_change_trigger === 'none') {
            return false;
        }

        $interval = $config->court_change_interval;

        // For side-out scoring, the court change is a ONE-TIME event per match.
        // Once it has been performed (court_change_done = true), it will never trigger again.
        if ($config->scoring_system === 'side-out' && $match->court_change_done) {
            return false;
        }

        switch ($config->court_change_trigger) {
            case 'rally-count':
                if ($interval && $match->rally_count > 0 && $match->rally_count % $interval === 0) {
                    return true;
                }
                break;

            case 'score-count':
                // Trigger when either team's score exactly equals the interval (one-time threshold)
                if ($interval) {
                    $maxScore = max($match->team_a_score, $match->team_b_score);
                    if ($maxScore === $interval) {
                        return true;
                    }
                }
                break;

            case 'game-end':
            case 'match-end':
                // Handled at game/match boundaries
                break;
        }

        return false;
    }

    /**
     * Determine if a player change (court swap) is needed based on the live configuration.
     *
     * Supports:
     * - rally-count: Trigger when rally_count > 0 and rally_count % court_change_interval === 0
     * - score-count: Trigger when either team's score equals court_change_interval (one-time per score threshold)
     * - none/game-end/match-end: No player change mid-game
     */
    private function checkNeedsPlayerChange(LiveMatchScore $match, ?string $scoringTeam = null, ?string $action = null): bool
    {
        $config = $match->liveConfiguration;
        if (! $config || ! $config->allow_court_change || $config->court_change_trigger === 'none') {
            return false;
        }

        $interval = $config->court_change_interval;

        // For side-out scoring, the court change is a ONE-TIME event per match.
        // Once it has been performed (court_change_done = true), it will never trigger again.
        if ($config->scoring_system === 'side-out' && $match->court_change_done) {
            return false;
        }

        switch ($config->court_change_trigger) {
            case 'rally-count':
                // Trigger when rally_count is a multiple of the interval (e.g., every 6 rallies)
                if ($interval && $match->rally_count > 0 && $match->rally_count % $interval === 0) {
                    return true;
                }
                break;

            case 'score-count':
                // Trigger when a team's score reaches the interval value
                // On increment only - when the scoring team's score matches the interval
                if ($interval && $action === 'increment' && $scoringTeam) {
                    $scoringScore = $scoringTeam === 'team_a' ? $match->team_a_score : $match->team_b_score;
                    if ($scoringScore === $interval) {
                        return true;
                    }
                }
                break;

            case 'game-end':
            case 'match-end':
                // These trigger at game/match boundaries, not mid-play
                break;
        }

        return false;
    }

    /**
     * Toggle pause/resume state for the timer.
     * When pausing: saves the remaining time in paused_remaining.
     * When resuming: shifts start_play_at forward by the paused duration
     * so that elapsed time calculations continue correctly (not including pause time).
     */
    public function togglePause(Request $request, LiveMatchScore $liveMatchScore)
    {
        if ($liveMatchScore->umpire_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $isPaused = $liveMatchScore->is_paused;

        if ($isPaused) {
            // Resuming: adjust start_play_at forward by the paused duration
            // so elapsed time calculation doesn't include the pause period
            if ($liveMatchScore->paused_at && $liveMatchScore->start_play_at) {
                $pausedDuration = $liveMatchScore->paused_at->diffInSeconds(now());
                if ($pausedDuration > 0) {
                    $liveMatchScore->update([
                        'start_play_at' => $liveMatchScore->start_play_at->addSeconds($pausedDuration),
                    ]);
                }
            }
            $liveMatchScore->update([
                'is_paused' => false,
                'paused_at' => null,
            ]);
        } else {
            // Pausing: store current paused_at timestamp and the time remaining at this moment
            $timeRemaining = $this->calculateTimeRemaining($liveMatchScore);
            $liveMatchScore->update([
                'is_paused' => true,
                'paused_at' => now(),
                'paused_remaining' => $timeRemaining,
            ]);
        }

        $liveMatchScore->load([
            'liveConfiguration', 'liveConfiguration.status', 'category',
            'teamA', 'teamB', 'status',
        ]);

        // Dispatch real-time update for pause state change
        $this->dispatchMatchScoreUpdate($liveMatchScore);

        return response()->json([
            'success' => true,
            'match' => $liveMatchScore,
            'is_paused' => ! $isPaused,
        ]);
    }

    /**
     * Confirm player change - resets rally_count to 0 and optionally swaps court sides.
     * Court side swapping only happens when the court_change_trigger is 'score-count'.
     * For 'rally-count' trigger, only rally_count is reset without swapping court sides.
     * After reset, a subsequent Undo (decrement) will set rally_count back to 9
     * since the last point was scored before the player change.
     */
    public function changePlayers(Request $request, LiveMatchScore $liveMatchScore)
    {
        if ($liveMatchScore->umpire_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'swap_courts' => 'sometimes|boolean',
            'team_a_court' => 'required_with:swap_courts|in:left,right',
            'team_b_court' => 'required_with:swap_courts|in:left,right',
        ]);

        $updateData = [
            'rally_count' => 0,
        ];

        // Only swap court sides when swap_courts is explicitly true (score-count trigger)
        if (! empty($validated['swap_courts'])) {
            $updateData['team_a_court'] = $validated['team_a_court'];
            $updateData['team_b_court'] = $validated['team_b_court'];
        }

        // Mark the one-time court change as done for side-out scoring.
        if ($liveMatchScore->liveConfiguration?->scoring_system === 'side-out') {
            $updateData['court_change_done'] = true;
        }

        $liveMatchScore->update($updateData);

        $liveMatchScore->load([
            'liveConfiguration', 'liveConfiguration.status', 'category',
            'teamA', 'teamB', 'status',
        ]);

        // Dispatch real-time update for player change
        $this->dispatchMatchScoreUpdate($liveMatchScore);

        return response()->json([
            'success' => true,
            'match' => $liveMatchScore,
            'rally_count' => $liveMatchScore->rally_count,
        ]);
    }

    /**
     * Get the current match state with calculated time remaining.
     * Time remaining is derived from start_play_at + game_time.
     * This allows the timer to work correctly even if the browser closes.
     */
    public function getMatchState(LiveMatchScore $liveMatchScore)
    {
        if ($liveMatchScore->umpire_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $liveMatchScore->load([
            'liveConfiguration', 'liveConfiguration.status', 'category',
            'teamA', 'teamB', 'status',
        ]);

        $timeRemaining = null;
        $totalGameSeconds = null;
        $elapsedSeconds = null;

        if ($liveMatchScore->start_play_at && $liveMatchScore->category?->game_time) {
            // Parse game_time (format like "15", "30", "45" - minutes)
            $gameMinutes = (int) $liveMatchScore->category->game_time;
            $totalGameSeconds = $gameMinutes * 60;

            if ($liveMatchScore->is_paused && $liveMatchScore->paused_at) {
                // If paused, calculate elapsed up to the pause point
                $start = $liveMatchScore->start_play_at;
                $pausedAt = $liveMatchScore->paused_at;
                $elapsedSeconds = $start->diffInSeconds($pausedAt);
                $timeRemaining = max(0, $totalGameSeconds - $elapsedSeconds);
            } else {
                // If running, calculate elapsed from start to now
                $start = $liveMatchScore->start_play_at;
                $now = now();
                $elapsedSeconds = $start->diffInSeconds($now);
                $timeRemaining = max(0, $totalGameSeconds - $elapsedSeconds);
            }
        }

        // Check for winner
        // Only detect winner if the match has NOT ended (no end_play_at)
        // and only when a team has clearly reached game_to.
        // We use the same logic: whoever reached game_to first is the winner.
        // But if BOTH teams are past game_to, we can't determine winner here
        // (it's handled by updateScore which knows which team just scored).
        // So for polling, we only flag winner if match has ended already.
        $gameTo = $liveMatchScore->category?->game_to ?? 21;
        $winBy = $liveMatchScore->category?->win_by ?? 1;
        $winner = null;
        if ($liveMatchScore->end_play_at) {
            // Match already ended - determine winner from final scores
            if ($liveMatchScore->team_a_score > $liveMatchScore->team_b_score) {
                $winner = 'team_a';
            } elseif ($liveMatchScore->team_b_score > $liveMatchScore->team_a_score) {
                $winner = 'team_b';
            }
        } else {
            // Match still going - require both game_to and the configured lead.
            $teamAWon = $liveMatchScore->team_a_score >= $gameTo
                && $liveMatchScore->team_a_score - $liveMatchScore->team_b_score >= $winBy;
            $teamBWon = $liveMatchScore->team_b_score >= $gameTo
                && $liveMatchScore->team_b_score - $liveMatchScore->team_a_score >= $winBy;
            if ($teamAWon && ! $teamBWon) {
                $winner = 'team_a';
            } elseif ($teamBWon && ! $teamAWon) {
                $winner = 'team_b';
            }
        }

        // Check if player change is needed based on configuration
        $needsPlayerChange = $this->checkNeedsPlayerChangeFromPolling($liveMatchScore);

        return response()->json([
            'success' => true,
            'match' => $liveMatchScore,
            'time_remaining' => $timeRemaining,
            'total_game_seconds' => $totalGameSeconds,
            'elapsed_seconds' => $elapsedSeconds,
            'winner' => $winner,
            'needs_player_change' => $needsPlayerChange,
        ]);
    }

    /**
     * Persist standings to the live_standings table when a match is completed.
     * Must be called BEFORE auto-advance since scores get reset.
     */
    private function persistStandings(LiveMatchScore $match): void
    {
        $teamAId = $match->team_a_id;
        $teamBId = $match->team_b_id;
        $teamAScore = $match->team_a_score;
        $teamBScore = $match->team_b_score;
        $categoryId = $match->category_id;
        $configId = $match->live_configuration_id;
        $courtNumber = $match->court_number;

        if (! $teamAId || ! $teamBId || ! $categoryId) {
            return;
        }

        // Determine winner
        $teamAWon = $teamAScore > $teamBScore;

        // Update or create Team A standing
        $standingA = LiveStanding::firstOrNew([
            'live_configuration_id' => $configId,
            'category_id' => $categoryId,
            'team_id' => $teamAId,
        ]);
        $standingA->court_number = $courtNumber;
        $standingA->matches_played++;
        $standingA->wins += $teamAWon ? 1 : 0;
        $standingA->losses += $teamAWon ? 0 : 1;
        $standingA->points_for += $teamAScore;
        $standingA->points_against += $teamBScore;
        $standingA->point_differential = $standingA->points_for - $standingA->points_against;
        $standingA->save();

        // Update or create Team B standing
        $standingB = LiveStanding::firstOrNew([
            'live_configuration_id' => $configId,
            'category_id' => $categoryId,
            'team_id' => $teamBId,
        ]);
        $standingB->court_number = $courtNumber;
        $standingB->matches_played++;
        $standingB->wins += $teamAWon ? 0 : 1;
        $standingB->losses += $teamAWon ? 1 : 0;
        $standingB->points_for += $teamBScore;
        $standingB->points_against += $teamAScore;
        $standingB->point_differential = $standingB->points_for - $standingB->points_against;
        $standingB->save();
    }

    /**
     * Dispatch the StandingsUpdated broadcast event for a given configuration.
     */
    private function dispatchStandingsEvent(int $configurationId): void
    {
        $configuration = LiveConfiguration::find($configurationId);
        if (! $configuration) {
            return;
        }

        // Build standings data in the same format as StandingsController
        $standingsData = [];

        $config = LiveConfiguration::query()
            ->where('id', $configurationId)
            ->with(['categories', 'categories.teams'])
            ->first();

        if (! $config) {
            return;
        }

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
                ->get();

            $teams = [];

            foreach ($standings as $standing) {
                $team = LiveTeam::find($standing->team_id);
                if (! $team) {
                    continue;
                }

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

            usort($teams, function (array $left, array $right) use ($headToHeadRecords): int {
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

            $standingsData[] = [
                'live_configuration_id' => $config->id,
                'category_id' => $category->id,
                'category_name' => $category->name,
                'game_to' => $category->game_to ?? 21,
                'teams' => $teams,
            ];
        }

        broadcast(new StandingsUpdated($configuration, $standingsData));
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
     * Dispatch the MatchScoreUpdated broadcast event for a given match.
     * Includes time_remaining for real-time countdown sync.
     */
    private function dispatchMatchScoreUpdate(LiveMatchScore $match): void
    {
        $configuration = LiveConfiguration::find($match->live_configuration_id);
        if (! $configuration) {
            return;
        }

        // Calculate time remaining if match is in progress
        $timeRemaining = $this->calculateTimeRemaining($match);

        $matchData = [
            'id' => $match->id,
            'live_configuration_id' => $match->live_configuration_id,
            'court_number' => $match->court_number,
            'category_id' => $match->category_id,
            'next_category_id' => $match->next_category_id,
            'team_a_id' => $match->team_a_id,
            'team_b_id' => $match->team_b_id,
            'next_team_a_id' => $match->next_team_a_id,
            'next_team_b_id' => $match->next_team_b_id,
            'team_a_score' => $match->team_a_score,
            'team_b_score' => $match->team_b_score,
            'serving_team' => $match->serving_team,
            'service_number' => $match->service_number,
            'court_change_done' => $match->court_change_done,
            'rally_count' => $match->rally_count,
            'is_paused' => $match->is_paused,
            'team_a_court' => $match->team_a_court,
            'team_b_court' => $match->team_b_court,
            'umpire_id' => $match->umpire_id,
            'status_id' => $match->status_id,
            'start_play_at' => $match->start_play_at?->toIso8601String(),
            'end_play_at' => $match->end_play_at?->toIso8601String(),
            'time_remaining' => $timeRemaining,
            'deleted' => false,
        ];

        broadcast(new MatchScoreUpdated($configuration, $matchData));
    }

    /**
     * End the match - set status to 'completed' and record end_play_at.
     * If next teams are set, auto-advance to the next pending match on this court.
     */
    public function endMatch(Request $request, LiveMatchScore $liveMatchScore)
    {
        if ($liveMatchScore->umpire_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $completedStatus = Status::where('type', 'live-match')->where('slug', 'completed')->first();
        $pendingStatus = Status::where('type', 'live-match')->where('slug', 'pending')->first();

        // Persist standings BEFORE auto-advance (scores get reset)
        $this->persistStandings($liveMatchScore);
        $this->dispatchStandingsEvent($liveMatchScore->live_configuration_id);

        $liveMatchScore->update([
            'status_id' => $completedStatus->id,
            'end_play_at' => now(),
            'is_paused' => false,
        ]);

        // Dispatch real-time update so the public /courts page reflects the finished match
        $this->dispatchMatchScoreUpdate($liveMatchScore);

        // Auto-advance: if next teams are defined, shift them to current and reset
        if ($liveMatchScore->next_team_a_id && $liveMatchScore->next_team_b_id) {
            LiveMatchScore::create([
                'live_configuration_id' => $liveMatchScore->live_configuration_id,
                'court_number' => $liveMatchScore->court_number,
                'category_id' => $liveMatchScore->next_category_id,
                'team_a_id' => $liveMatchScore->next_team_a_id,
                'team_b_id' => $liveMatchScore->next_team_b_id,
                'team_a_score' => 0,
                'team_b_score' => 0,
                'rally_count' => 0,
                'serving_team' => null,
                'status_id' => $pendingStatus->id, // pending
                'umpire_id' => null, // unassigned, admin can assign later
            ]);
        }

        $liveMatchScore->load([
            'liveConfiguration', 'liveConfiguration.status', 'category',
            'teamA', 'teamB', 'status',
        ]);

        return response()->json([
            'success' => true,
            'match' => $liveMatchScore,
        ]);
    }

    /**
     * Confirm winner - end the match and return summary data.
     * If next teams are set, persist standings, keep the just-completed match with its scores,
     * then create a new LiveMatchScore for the next pending match on this court.
     */
    public function confirmWinner(Request $request, LiveMatchScore $liveMatchScore)
    {
        if ($liveMatchScore->umpire_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'winner' => 'required|in:team_a,team_b',
        ]);

        $completedStatus = Status::where('type', 'live-match')->where('slug', 'completed')->first();
        $pendingStatus = Status::where('type', 'live-match')->where('slug', 'pending')->first();

        // Persist standings BEFORE creating next match (scores preserved here)
        $this->persistStandings($liveMatchScore);
        $this->dispatchStandingsEvent($liveMatchScore->live_configuration_id);

        // Mark current match as completed (keep its scores intact)
        $liveMatchScore->update([
            'status_id' => $completedStatus->id ?? $liveMatchScore->status_id,
            'end_play_at' => now(),
            'is_paused' => false,
        ]);

        // Dispatch real-time update so the public /courts page reflects the finished match
        $this->dispatchMatchScoreUpdate($liveMatchScore);

        // Auto-advance: if next teams are defined, create a NEW match record for the next pending match
        $nextTeamAId = $liveMatchScore->next_team_a_id;
        $nextTeamBId = $liveMatchScore->next_team_b_id;
        $nextCategoryId = $liveMatchScore->next_category_id;

        if ($nextTeamAId && $nextTeamBId) {
            // Create a new LiveMatchScore for the next pending match on this court
            LiveMatchScore::create([
                'live_configuration_id' => $liveMatchScore->live_configuration_id,
                'court_number' => $liveMatchScore->court_number,
                'category_id' => $nextCategoryId,
                'team_a_id' => $nextTeamAId,
                'team_b_id' => $nextTeamBId,
                'team_a_score' => 0,
                'team_b_score' => 0,
                'rally_count' => 0,
                'serving_team' => null,
                'status_id' => $pendingStatus->id, // pending
                'umpire_id' => null, // unassigned, admin can assign later
            ]);
        }

        // Reload to get fresh data
        $liveMatchScore->load([
            'liveConfiguration', 'liveConfiguration.status', 'category',
            'teamA', 'teamB', 'status',
        ]);

        return response()->json([
            'success' => true,
            'match' => $liveMatchScore,
            'winner' => $validated['winner'],
        ]);
    }

    /**
     * Declare a default winner when the default timer expires.
     * The winning team gets the game_to score (auto-win), opponent gets 0.
     * Persists standings then auto-advances to next pending match if next teams are defined.
     */
    public function defaultWinner(Request $request, LiveMatchScore $liveMatchScore)
    {
        if ($liveMatchScore->umpire_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $categoryDetails = $liveMatchScore->load(['category']);

        $validated = $request->validate([
            'winner_team' => 'required|in:team_a,team_b',
        ]);

        $completedStatus = Status::where('type', 'live-match')->where('slug', 'completed')->first();
        $pendingStatus = Status::where('type', 'live-match')->where('slug', 'pending')->first();
        $defaultWinScore = $categoryDetails->category->game_to;

        // Set the default win scores BEFORE persisting standings
        if ($validated['winner_team'] === 'team_a') {
            $liveMatchScore->team_a_score = $defaultWinScore;
            $liveMatchScore->team_b_score = 0;
        } else {
            $liveMatchScore->team_a_score = 0;
            $liveMatchScore->team_b_score = $defaultWinScore;
        }

        $liveMatchScore->status_id = $completedStatus->id;
        $liveMatchScore->end_play_at = now();
        $liveMatchScore->is_paused = false;

        // Persist standings BEFORE creating next match (scores preserved here)
        $this->persistStandings($liveMatchScore);
        $this->dispatchStandingsEvent($liveMatchScore->live_configuration_id);

        // Mark current match as completed (keep its scores intact)
        $liveMatchScore->update([
            'team_a_score' => $liveMatchScore->team_a_score,
            'team_b_score' => $liveMatchScore->team_b_score,
            'status_id' => $completedStatus->id,
            'end_play_at' => now(),
            'is_paused' => false,
        ]);

        // Dispatch real-time update so the public /courts page reflects the finished match
        $this->dispatchMatchScoreUpdate($liveMatchScore);

        // Auto-advance: if next teams are defined, create a NEW match record for the next pending match
        $nextTeamAId = $liveMatchScore->next_team_a_id;
        $nextTeamBId = $liveMatchScore->next_team_b_id;
        $nextCategoryId = $liveMatchScore->next_category_id;

        if ($nextTeamAId && $nextTeamBId) {
            // Create a new LiveMatchScore for the next pending match on this court
            LiveMatchScore::create([
                'live_configuration_id' => $liveMatchScore->live_configuration_id,
                'court_number' => $liveMatchScore->court_number,
                'category_id' => $nextCategoryId,
                'team_a_id' => $nextTeamAId,
                'team_b_id' => $nextTeamBId,
                'team_a_score' => 0,
                'team_b_score' => 0,
                'rally_count' => 0,
                'serving_team' => null,
                'status_id' => $pendingStatus->id, // pending
                'umpire_id' => null, // unassigned, admin can assign later
            ]);
        }

        // Reload to get fresh data
        $liveMatchScore->load([
            'liveConfiguration', 'liveConfiguration.status', 'category',
            'teamA', 'teamB', 'status',
        ]);

        return response()->json([
            'success' => true,
            'match' => $liveMatchScore,
            'winner' => $validated['winner_team'],
        ]);
    }

    /**
     * Save signatures for a completed match.
     */
    public function saveSignatures(Request $request, LiveMatchScore $liveMatchScore)
    {
        if ($liveMatchScore->umpire_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'team_a_signature' => 'nullable|string',
            'team_b_signature' => 'nullable|string',
            'team_a_signed_by' => 'nullable|integer|exists:users,id',
            'team_b_signed_by' => 'nullable|integer|exists:users,id',
        ]);

        $updateData = [];

        if (isset($validated['team_a_signature'])) {
            $updateData['team_a_signature'] = $validated['team_a_signature'];
        }
        if (isset($validated['team_b_signature'])) {
            $updateData['team_b_signature'] = $validated['team_b_signature'];
        }
        if (isset($validated['team_a_signed_by'])) {
            $updateData['team_a_signed_by'] = $validated['team_a_signed_by'];
        }
        if (isset($validated['team_b_signed_by'])) {
            $updateData['team_b_signed_by'] = $validated['team_b_signed_by'];
        }

        if (! empty($updateData)) {
            $liveMatchScore->update($updateData);
        }

        $liveMatchScore->load([
            'liveConfiguration', 'liveConfiguration.status', 'category',
            'teamA', 'teamB', 'status',
        ]);

        return response()->json([
            'success' => true,
            'match' => $liveMatchScore,
        ]);
    }

    /**
     * Display the match summary page after a match is completed.
     */
    public function showSummary(LiveMatchScore $liveMatchScore): Response
    {
        if ($liveMatchScore->umpire_id !== auth()->id()) {
            abort(403, 'You are not assigned to this match.');
        }

        $liveMatchScore->load([
            'liveConfiguration',
            'liveConfiguration.status',
            'category',
            'teamA',
            'teamB',
            'nextTeamA',
            'nextTeamB',
            'status',
        ]);

        // Load player details for teams
        $matchData = $liveMatchScore->toArray();

        if ($liveMatchScore->teamA) {
            $playerIds = $liveMatchScore->teamA->player_ids ?? [];
            $players = User::whereIn('id', $playerIds)
                ->with('playerInformation')
                ->get()
                ->map(function ($user) {
                    $profile = $user->playerInformation;

                    return [
                        'id' => $user->id,
                        'email' => $user->email,
                        'first_name' => $profile?->first_name,
                        'last_name' => $profile?->last_name,
                        'profile_image' => $profile?->profile_image,
                    ];
                });
            $matchData['team_a']['players'] = $players;
        }

        if ($liveMatchScore->teamB) {
            $playerIds = $liveMatchScore->teamB->player_ids ?? [];
            $players = User::whereIn('id', $playerIds)
                ->with('playerInformation')
                ->get()
                ->map(function ($user) {
                    $profile = $user->playerInformation;

                    return [
                        'id' => $user->id,
                        'email' => $user->email,
                        'first_name' => $profile?->first_name,
                        'last_name' => $profile?->last_name,
                        'profile_image' => $profile?->profile_image,
                    ];
                });
            $matchData['team_b']['players'] = $players;
        }

        // Determine winner
        // The winning team is the one with the higher score. This handles both
        // normal finishes (a team reached game_to) AND time-expired ends where
        // neither team reached game_to — the team with the higher score wins.
        $winner = null;
        if ($liveMatchScore->team_a_score > $liveMatchScore->team_b_score) {
            $winner = 'team_a';
        } elseif ($liveMatchScore->team_b_score > $liveMatchScore->team_a_score) {
            $winner = 'team_b';
        }

        // Calculate duration as mm:ss
        $durationFormatted = null;
        if ($liveMatchScore->start_play_at && $liveMatchScore->end_play_at) {
            $totalSeconds = $liveMatchScore->start_play_at->diffInSeconds($liveMatchScore->end_play_at);
            $minutes = floor($totalSeconds / 60);
            $seconds = $totalSeconds % 60;
            $durationFormatted = sprintf('%d:%02d', $minutes, $seconds);
        }

        return inertia('umpire/match-summary', [
            'match' => $matchData,
            'winner' => $winner,
            'duration_formatted' => $durationFormatted,
        ]);
    }
}
