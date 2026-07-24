<?php

namespace App\Events;

use App\Models\LiveConfiguration;
use App\Models\LiveMatchScore;
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
     * The match data payload.
     */
    public array $match;

    /**
     * Create a new event instance.
     */
    public function __construct(LiveConfiguration $configuration, array $match)
    {
        $this->configurationId = $configuration->id;
        $this->match = $match;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('courts.' . $this->configurationId),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'match.score.updated';
    }
}

