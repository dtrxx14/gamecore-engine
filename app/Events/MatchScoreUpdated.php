<?php

namespace App\Events;

use App\Models\LiveConfiguration;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MatchScoreUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * The live configuration ID.
     */
    public int $configurationId;

    /**
     * The current umpire assignment ID.
     */
    public ?int $umpireId;

    /**
     * The previous umpire assignment ID, used when reassigning or removing a match.
     */
    public ?int $oldUmpireId;

    /**
     * The match data payload.
     */
    public array $match;

    /**
     * Create a new event instance.
     */
    public function __construct(LiveConfiguration $configuration, array $match, ?int $oldUmpireId = null)
    {
        $this->configurationId = $configuration->id;
        $this->umpireId = $match['umpire_id'] ?? null;
        $this->oldUmpireId = $match['old_umpire_id'] ?? $oldUmpireId;
        $this->match = $match;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channelNames = ['courts.' . $this->configurationId];

        foreach (array_filter([$this->umpireId, $this->oldUmpireId]) as $umpireId) {
            $channelNames[] = 'umpires.' . $umpireId;
        }

        return array_map(fn (string $channelName) => new Channel($channelName), array_values(array_unique($channelNames)));
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'match.score.updated';
    }
}

