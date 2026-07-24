<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TournamentCategory extends Model
{
    protected $fillable = [
        'tournament_id',
        'name',
        'division',
        'description',
        'entry_fee',
        'currency',
        'min_players',
        'max_players',
        'team_size',
        'team_type',
    ];

    public function tournament()
    {
        return $this->belongsTo(Tournament::class);
    }

    public function format()
    {
        return $this->hasOne(TournamentCategoryFormat::class);
    }

    public function formats()
    {
        return $this->hasMany(TournamentCategoryFormat::class);
    }
}
