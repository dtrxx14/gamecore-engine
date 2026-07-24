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
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('standings.' . $this->configurationId),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'standings.updated';
    }
}
