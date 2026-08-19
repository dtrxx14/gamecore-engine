<?php

namespace App\Http\Controllers;

use App\Models\LiveConfiguration;
use App\Models\LiveMatchScore;
use App\Models\Organization;
use App\Models\Tournament;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $totalUsers = User::query()->count();
        $verifiedUsers = User::query()->whereNotNull('email_verified_at')->count();
        $totalOrganizations = Organization::query()->count();
        $approvedOrganizations = Organization::query()
            ->whereHas('status', fn ($query) => $query->where('type', 'organization')->where('slug', 'approved'))
            ->count();
        $pendingOrganizations = Organization::query()
            ->whereHas('status', fn ($query) => $query->where('type', 'organization')->where('slug', 'pending-approval'))
            ->count();
        $totalTournaments = Tournament::query()->count();
        $totalLiveConfigurations = LiveConfiguration::query()->count();
        $activeMatches = LiveMatchScore::query()
            ->whereHas('status', fn ($query) => $query->where('type', 'live-match')->whereIn('slug', ['pending', 'playing']))
            ->count();

        $recentUsers = collect(User::query()
            ->select(['id', 'email', 'created_at'])
            ->latest('created_at')
            ->take(5)
            ->get()
            ->map(fn ($user) => [
                'title' => $user->email,
                'subtitle' => 'User account',
                'timestamp' => $user->created_at?->toISOString(),
            ])
            ->values()
            ->all());

        $recentOrganizations = collect(Organization::query()
            ->select(['id', 'name', 'created_at'])
            ->latest('created_at')
            ->take(5)
            ->get()
            ->map(fn ($organization) => [
                'title' => $organization->name,
                'subtitle' => 'Organization',
                'timestamp' => $organization->created_at?->toISOString(),
            ])
            ->values()
            ->all());

        $recentTournaments = collect(Tournament::query()
            ->select(['id', 'title', 'created_at'])
            ->latest('created_at')
            ->take(5)
            ->get()
            ->map(fn ($tournament) => [
                'title' => $tournament->title,
                'subtitle' => 'Tournament',
                'timestamp' => $tournament->created_at?->toISOString(),
            ])
            ->values()
            ->all());

        $recentActivity = collect([])
            ->merge($recentUsers->map(fn ($user) => [
                'title' => 'New user registered',
                'subtitle' => $user['title'],
                'timestamp' => $user['timestamp'],
            ]))
            ->merge($recentOrganizations->map(fn ($organization) => [
                'title' => 'Organization created',
                'subtitle' => $organization['title'],
                'timestamp' => $organization['timestamp'],
            ]))
            ->merge($recentTournaments->map(fn ($tournament) => [
                'title' => 'Tournament added',
                'subtitle' => $tournament['title'],
                'timestamp' => $tournament['timestamp'],
            ]))
            ->sortByDesc('timestamp')
            ->take(8)
            ->values()
            ->all();

        return inertia('dashboard', [
            'stats' => [
                'total_users' => $totalUsers,
                'verified_users' => $verifiedUsers,
                'total_organizations' => $totalOrganizations,
                'approved_organizations' => $approvedOrganizations,
                'pending_organizations' => $pendingOrganizations,
                'total_tournaments' => $totalTournaments,
                'total_live_configurations' => $totalLiveConfigurations,
                'active_matches' => $activeMatches,
            ],
            'recent_activity' => $recentActivity,
            'recent_users' => $recentUsers->all(),
            'recent_organizations' => $recentOrganizations->all(),
            'recent_tournaments' => $recentTournaments->all(),
        ]);
    }
}
