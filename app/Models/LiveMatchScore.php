<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveMatchScore extends Model
{
protected $fillable = [
        'live_configuration_id',
        'court_number',
        'category_id',
        'next_category_id',
        'team_a_id',
        'team_b_id',
        'team_a_score',
        'team_b_score',
        'rally_count',
        'team_a_court',
        'team_b_court',
        'serving_team',
        'service_number',
        'court_change_done',
        'next_team_a_id',
        'next_team_b_id',
        'status_id',
        'umpire_id',
        'start_play_at',
        'end_play_at',
        'is_paused',
        'paused_at',
        'paused_remaining',
        'team_a_signature',
        'team_b_signature',
        'team_a_signed_by',
        'team_b_signed_by',
    ];

    protected $casts = [
        'team_a_score' => 'integer',
        'team_b_score' => 'integer',
        'rally_count' => 'integer',
        'court_number' => 'integer',
        'start_play_at' => 'datetime',
        'end_play_at' => 'datetime',
        'team_a_court' => 'string',
        'team_b_court' => 'string',
        'is_paused' => 'boolean',
        'paused_at' => 'datetime',
        'paused_remaining' => 'integer',
        'service_number' => 'integer',
        'court_change_done' => 'boolean',
    ];

    public function liveConfiguration()
    {
        return $this->belongsTo(LiveConfiguration::class);
    }

    public function teamA()
    {
        return $this->belongsTo(LiveTeam::class, 'team_a_id');
    }

    public function teamB()
    {
        return $this->belongsTo(LiveTeam::class, 'team_b_id');
    }


    public function nextTeamA()
    {
        return $this->belongsTo(LiveTeam::class, 'next_team_a_id');
    }

    public function nextTeamB()
    {
        return $this->belongsTo(LiveTeam::class, 'next_team_b_id');
    }

    public function status()
    {
        return $this->belongsTo(Status::class);
    }

    public function umpire()
    {
        return $this->belongsTo(PlayerInformation::class, 'umpire_id', 'user_id');
    }

    public function category()
    {
        return $this->belongsTo(LiveCategory::class, 'category_id');
    }

    public function nextCategory()
    {
        return $this->belongsTo(LiveCategory::class, 'next_category_id');
    }
}

