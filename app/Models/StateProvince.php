<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StateProvince extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'country_id',
    ];
}
