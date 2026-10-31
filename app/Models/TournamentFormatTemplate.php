<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TournamentFormatTemplate extends Model
{
    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'formats',
    ];

    protected $casts = [
        'formats' => 'array',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
