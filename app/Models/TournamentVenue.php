<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TournamentVenue extends Model
{
    protected $fillable = [
        'tournament_id',
        'name',
        'address',
        'pin_location',
    ];

    public function tournament()
    {
        return $this->belongsTo(Tournament::class);
    }
}
