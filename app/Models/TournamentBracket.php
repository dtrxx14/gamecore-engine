<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TournamentBracket extends Model
{
    protected $fillable = [
        'tournament_id',
        'name',
        'description',
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
}
