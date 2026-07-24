<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlayerInformation extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'profile_image',
        'first_name',
        'middle_name',
        'last_name',
        'contact_number',
        'club',
        'club_organization_id',
        'gender',
        'birthdate',
        'nationality_id',
        'state_province_id',
        'dupr_account',
        'bio',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'birthdate' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function nationality()
    {
        return $this->belongsTo(Country::class, 'nationality_id');
    }

    public function stateProvince()
    {
        return $this->belongsTo(StateProvince::class, 'state_province_id');
    }

    public function clubOrganization()
    {
        return $this->belongsTo(Organization::class, 'club_organization_id');
    }
}
