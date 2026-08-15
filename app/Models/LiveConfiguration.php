<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveConfiguration extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'tournament_id',
        'number_of_courts',
        'scoring_system',
        'allow_court_change',
        'court_change_trigger',
        'court_change_interval',
        'status_id',
    ];

    public function tournament()
    {
        return $this->belongsTo(Tournament::class);
    }

    public function status()
    {
        return $this->belongsTo(Status::class);
    }

    public function matchScores()
    {
        return $this->hasMany(LiveMatchScore::class);
    }

    public function categories()
    {
        return $this->hasMany(LiveCategory::class);
    }

    public function teams()
    {
        return $this->hasMany(LiveTeam::class);
    }
}
