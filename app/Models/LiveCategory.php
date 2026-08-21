<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveCategory extends Model
{
    protected $fillable = [
        'live_configuration_id',
        'name',
        'game_to',
        'win_by',
        'game_time',
        'game_interval',
    ];

    protected $casts = [
        'game_to' => 'integer',
        'win_by' => 'integer',
    ];

    public function liveConfiguration()
    {
        return $this->belongsTo(LiveConfiguration::class, 'live_configuration_id');
    }

    public function teams()
    {
        return $this->hasMany(LiveTeam::class, 'category_id');
    }

    public function matchScores()
    {
        return $this->hasMany(LiveMatchScore::class, 'category_id');
    }
}
