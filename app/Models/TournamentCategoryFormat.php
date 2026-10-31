<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TournamentCategoryFormat extends Model
{
    protected $fillable = [
        'tournament_category_id',
        'round_format',
        'competition_format',
        'scoring_format',
        'series_format',
        'point_system',
        'allow_wildcard',
        'game_to',
        'win_by',
        'game_time',
        'tie_break_method',
        'pool_count',
        'advance_per_pool',
        'allow_draw',
        'allow_court_change',
        'court_change_trigger',
        'court_change_interval',
    ];

    public function category()
    {
        return $this->belongsTo(TournamentCategory::class, 'tournament_category_id');
    }
}
