<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $account_number
 * @property string|null $google_id
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property int $status_id
 * @property int $role_id
 * @property Carbon|null $last_login_at
 * @property string|null $last_device_used
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable(['email', 'password', 'account_number', 'google_id', 'status_id', 'role_id', 'is_organizer', 'last_login_at', 'last_device_used', 'deleted_at'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected $dates = ['deleted_at'];
    
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    protected function appends(): array
    {
        return ['has_approved_organization', 'organization_memberships', 'player_profile'];
    }

    public function getHasApprovedOrganizationAttribute(): bool
    {
        return $this->hasApprovedOrganization();
    }

    public function getOrganizationMembershipsAttribute(): array
    {
        return $this->organizationMembers()
            ->with(['organization.status', 'role'])
            ->get()
            ->map(function (OrganizationMember $membership): array {
                return [
                    'organization_id' => $membership->organization_id,
                    'organization' => $membership->organization ? [
                        'uuid' => $membership->organization->uuid,
                        'name' => $membership->organization->name,
                        'logo_image' => $membership->organization->logo_image,
                        'banner_image' => $membership->organization->banner_image,
                        'status' => $membership->organization->status ? [
                            'name' => $membership->organization->status->name,
                            'slug' => $membership->organization->status->slug,
                        ] : null,
                    ] : null,
                    'role' => $membership->role ? [
                        'name' => $membership->role->name,
                        'slug' => $membership->role->slug,
                    ] : null,
                ];
            })
            ->values()
            ->all();
    }

    public function getPlayerProfileAttribute(): array
    {
        $profile = $this->playerInformation()->with(['nationality', 'stateProvince', 'clubOrganization'])->first();

        return [
            'first_name' => $profile?->first_name ?? null,
            'middle_name' => $profile?->middle_name ?? null,
            'last_name' => $profile?->last_name ?? null,
            'contact_number' => $profile?->contact_number ?? null,
            'club' => $profile?->clubOrganization?->name ?? null,
            'gender' => $profile?->gender ?? null,
            'birthdate' => $profile?->birthdate?->format('Y-m-d') ?? null,
            'country' => $profile?->nationality?->name ?? null,
            'state' => $profile?->stateProvince?->name ?? null,
            'dupr_account' => $profile?->dupr_account ?? null,
            'bio' => $profile?->bio ?? null,
        ];
    }

    public function role()
    {
        return $this->belongsTo(Role::class)->where('type', 'login');
    }

    public function status()
    {
        return $this->belongsTo(Status::class)->where('type', 'login');
    }

    public function playerInformation()
    {
        return $this->hasOne(PlayerInformation::class);
    }

    public function organizationMembers()
    {
        return $this->hasMany(OrganizationMember::class);
    }

    public function approvedOrganization()
    {
        return $this->organizationMembers()
            ->whereHas('role', fn ($query) => $query->where('type', 'organization')->where('slug', 'admin'))
            ->whereHas('organization.status', fn ($query) => $query->where('slug', 'approved'))
            ->first()?->organization;
    }

    public function hasApprovedOrganization(): bool
    {
        return $this->approvedOrganization() !== null;
    }

    public function dashboardRouteName(): string
    {
        $roleSlug = $this->role?->slug;

        if ($roleSlug === 'admin') {
            return 'dashboard';
        }

        if ($roleSlug === 'umpire') {
            return 'umpire.dashboard';
        }

        if ($roleSlug === 'player' && $this->hasApprovedOrganization()) {
            return 'organizer.dashboard';
        }

        return 'player.dashboard';
    }
}

