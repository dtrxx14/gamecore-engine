<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    protected $fillable = [
        'uuid',
        'name',
        'slug',
        'logo_image',
        'banner_image',
        'email',
        'contact_number',
        'website_url',
        'description',
        'address',
        'state_province_id',
        'country_id',
        'zip_code',
        'status_id',
    ];

    public function members()
    {
        return $this->hasMany(OrganizationMember::class);
    }

    public function admins()
    {
        return $this->members()
            ->whereHas('role', fn ($query) => $query->where('type', 'organization')->where('slug', 'admin'));
    }

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    public function stateProvince()
    {
        return $this->belongsTo(StateProvince::class);
    }

    public function tournaments()
    {
        return $this->hasMany(Tournament::class);
    }

    public function status()
    {
        return $this->belongsTo(Status::class)->where('type', 'organization');
    }

    public function isApproved(): bool
    {
        return $this->status?->slug === 'approved';
    }
}

