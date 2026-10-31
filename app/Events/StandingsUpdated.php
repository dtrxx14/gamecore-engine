<?php

namespace App\Events;

use App\Models\LiveConfiguration;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StandingsUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * The live configuration ID.
     */
    public int $configurationId;

    /**
     * The standings data payload.
     */
    public array $standings;

    /**
     * Create a new event instance.
     */
    public function __construct(LiveConfiguration $configuration, array $standings)
    {
        $this->configurationId = $configuration->id;
        $this->standings = $standings;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('standings.'.$this->configurationId),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'standings.updated';
    }

    /**
     * Keep realtime standings updates small enough for Pusher's event limit.
     * The detailed tie-break explanation is loaded with the admin page and is
     * intentionally not repeated in every realtime event.
     *
     * @return array{configurationId: int, standings: array<int, array<string, mixed>>}
     */
    public function broadcastWith(): array
    {
        return [
            'configurationId' => $this->configurationId,
            'standings' => array_map(function (array $category): array {
                $category['teams'] = array_map(function (array $team): array {
                    return [
                        'id' => $team['id'] ?? $team['team_id'],
                        'live_configuration_id' => $team['live_configuration_id'] ?? null,
                        'category_id' => $team['category_id'] ?? null,
                        'team_id' => $team['team_id'],
                        'team_name' => $team['team_name'],
                        'bracket' => $team['bracket'] ?? null,
                        'court_number' => $team['court_number'] ?? 0,
                        'matches_played' => $team['matches_played'],
                        'wins' => $team['wins'],
                        'losses' => $team['losses'],
                        'points_for' => $team['points_for'],
                        'points_against' => $team['points_against'],
                        'point_differential' => $team['point_differential'],
                        'rank' => $team['rank'] ?? null,
                    ];
                }, $category['teams'] ?? []);

                return $category;
            }, $this->standings),
        ];
    }
}
