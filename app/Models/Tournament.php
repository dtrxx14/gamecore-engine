<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tournament extends Model
{
    protected $fillable = [
        'uuid', 
        'organization_id',
        'title',
        'slug',
        'banner_image',
        'start_date',
        'description',
    ];

    /**
     * Eager load common relationships for convenience.
     */
    protected $with = ['venues', 'categories'];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function venues()
    {
        return $this->hasMany(TournamentVenue::class);
    }

    public function categories()
    {
        return $this->hasMany(TournamentCategory::class);
    }

    public function settings()
    {
        return $this->hasOne(TournamentSetting::class);
    }

    public function players()
    {
        return $this->belongsToMany(User::class, 'tournament_players', 'tournament_id', 'user_id');
    }
}
