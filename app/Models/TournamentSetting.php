<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TournamentSetting extends Model
{
    protected $fillable = [
        'tournament_id',
        'allow_waitlist',
        'call_time_in_hours',
        'start_time_in_hours',
        'end_time_in_hours',
        'default_match_duration_minutes',
        'default_rest_time_minutes',
        'default_court_counts',
        'is_dupr',
        'status_id',
    ];

    public function tournament()
    {
        return $this->belongsTo(Tournament::class);
    }

    public function courts()
    {
        return $this->hasMany(TournamentCourt::class);
    }
}
