<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TournamentCourt extends Model
{
    protected $fillable = [
        'tournament_setting_id',
        'name',
    ];

    public function setting()
    {
        return $this->belongsTo(TournamentSetting::class, 'tournament_setting_id');
    }
}
