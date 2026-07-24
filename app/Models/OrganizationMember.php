<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrganizationMember extends Model
{
    protected $fillable = [
        'organization_id',
        'user_id',
        'role_id',
        'status_id',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function status()
    {
        return $this->belongsTo(Status::class);
    }
}
