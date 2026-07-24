<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveStanding extends Model
{
    protected $fillable = [
        'live_configuration_id',
        'category_id',
        'team_id',
        'court_number',
        'matches_played',
        'wins',
        'losses',
        'points_for',
        'points_against',
        'point_differential',
    ];

    public function liveConfiguration()
    {
        return $this->belongsTo(LiveConfiguration::class, 'live_configuration_id');
    }

    public function category()
    {
        return $this->belongsTo(LiveCategory::class, 'category_id');
    }

    public function team()
    {
        return $this->belongsTo(LiveTeam::class, 'team_id');
    }
}

