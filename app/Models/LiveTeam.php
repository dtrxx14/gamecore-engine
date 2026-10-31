<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveTeam extends Model
{
    protected $fillable = [
        'name',
        'bracket',
        'category_id',
        'player_ids',
        'live_configuration_id',
    ];

    protected $casts = [
        'bracket' => 'string',
        'player_ids' => 'array',
    ];

    /**
     * Get the live configuration that owns this team.
     */
    public function liveConfiguration()
    {
        return $this->belongsTo(LiveConfiguration::class);
    }

    /**
     * Get the users/players in this team.
     */
    public function players()
    {
        return User::whereIn('id', $this->player_ids ?? [])->get();
    }

    public function category()
    {
        return $this->belongsTo(LiveCategory::class);
    }
}
