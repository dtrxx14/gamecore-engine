<?php

use App\Http\Controllers\Admin\LiveConfigurationController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\AdminOrganizerController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\OrganizerApprovalController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\Organizer\OrganizationDashboardController;
use App\Http\Controllers\Organizer\TournamentController;
use App\Http\Controllers\Player\ProfileController as PlayerProfileController;
use App\Http\Controllers\Public\LiveCourtsController;
use App\Http\Controllers\Public\StandingsController;
use App\Http\Controllers\Umpire\UmpireDashboardController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

// Public standings routes (no auth required)
Route::get('standings', [StandingsController::class, 'index'])->name('public.standings');
Route::get('api/standings', [StandingsController::class, 'api'])->name('api.standings');

// Public courts routes (no auth required)
Route::get('courts', [LiveCourtsController::class, 'index'])->name('public.courts');
Route::get('api/courts', [LiveCourtsController::class, 'api'])->name('api.courts');

// Public API routes
Route::get('/api/countries', [LocationController::class, 'countries']);
Route::get('/api/countries/{countryId}/states', [LocationController::class, 'stateProvinces']);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::middleware('role:admin')->group(function () {
        Route::inertia('dashboard', 'dashboard')->name('dashboard');
        Route::get('admin/organizer-approvals', [AdminOrganizerController::class, 'approvals'])->name('admin.organizer.approvals');
        Route::get('admin/organizer-management', [AdminOrganizerController::class, 'management'])->name('admin.organizer.management');
        Route::get('admin/organizer-management/{organization}', [AdminOrganizerController::class, 'show'])->name('admin.organizer.management.show');
        Route::get('admin/user-management', [UserManagementController::class, 'index'])->name('admin.user-management.index');
        Route::post('admin/user-management', [UserManagementController::class, 'store'])->name('admin.user-management.store');
        Route::put('admin/user-management/{user}', [UserManagementController::class, 'update'])->name('admin.user-management.update');
        Route::patch('admin/user-management/{user}/toggle-status', [UserManagementController::class, 'toggleStatus'])->name('admin.user-management.toggle-status');
        Route::post('admin/user-management/{user}/reset-password', [UserManagementController::class, 'resetPassword'])->name('admin.user-management.reset-password');
        Route::delete('admin/user-management/{user}', [UserManagementController::class, 'destroy'])->name('admin.user-management.destroy');

        // API routes for organizer approval/rejection
        Route::post('api/organizer-approvals/{organization}/approve', [OrganizerApprovalController::class, 'approve']);
        Route::post('api/organizer-approvals/{organization}/reject', [OrganizerApprovalController::class, 'reject']);

        // Live configuration routes
        Route::get('admin/live-configuration', [LiveConfigurationController::class, 'index'])->name('admin.live-configuration.index');
        Route::get('admin/live-configuration/create', [LiveConfigurationController::class, 'create'])->name('admin.live-configuration.create');
        Route::post('admin/live-configuration', [LiveConfigurationController::class, 'store'])->name('admin.live-configuration.store');
        Route::get('admin/live-configuration/{liveConfiguration}', [LiveConfigurationController::class, 'show'])->name('admin.live-configuration.show');
        Route::get('admin/live-configuration/{liveConfiguration}/edit', [LiveConfigurationController::class, 'edit'])->name('admin.live-configuration.edit');
        Route::put('admin/live-configuration/{liveConfiguration}', [LiveConfigurationController::class, 'update'])->name('admin.live-configuration.update');
        Route::delete('admin/live-configuration/{liveConfiguration}', [LiveConfigurationController::class, 'destroy'])->name('admin.live-configuration.destroy');

        // Player search route (for team member selection)
        Route::get('admin/live-configuration/players/search', [LiveConfigurationController::class, 'searchPlayers'])->name('admin.live-configuration.players.search');

        // Live category routes
        Route::post('admin/live-configuration/categories', [LiveConfigurationController::class, 'storeCategory'])->name('admin.live-configuration.categories.store');
        Route::put('admin/live-configuration/categories/{liveCategory}', [LiveConfigurationController::class, 'updateCategory'])->name('admin.live-configuration.categories.update');
        Route::delete('admin/live-configuration/categories/{liveCategory}', [LiveConfigurationController::class, 'destroyCategory'])->name('admin.live-configuration.categories.destroy');

        // Live team routes
        Route::post('admin/live-configuration/teams', [LiveConfigurationController::class, 'storeTeam'])->name('admin.live-configuration.teams.store');
        Route::put('admin/live-configuration/teams/{liveTeam}', [LiveConfigurationController::class, 'updateTeam'])->name('admin.live-configuration.teams.update');
        Route::delete('admin/live-configuration/teams/{liveTeam}', [LiveConfigurationController::class, 'destroyTeam'])->name('admin.live-configuration.teams.destroy');

        // Live match score routes
        Route::post('admin/live-configuration/match-scores', [LiveConfigurationController::class, 'storeMatchScore'])->name('admin.live-configuration.match-scores.store');
        Route::put('admin/live-configuration/match-scores/{liveMatchScore}', [LiveConfigurationController::class, 'updateMatchScore'])->name('admin.live-configuration.match-scores.update');
        Route::delete('admin/live-configuration/match-scores/{liveMatchScore}', [LiveConfigurationController::class, 'destroyMatchScore'])->name('admin.live-configuration.match-scores.destroy');
    });

    // Umpire routes
    Route::middleware('role:umpire')->group(function () {
        Route::get('umpire/dashboard', [UmpireDashboardController::class, 'index'])->name('umpire.dashboard');
        Route::get('umpire/match/{liveMatchScore}', [UmpireDashboardController::class, 'show'])->name('umpire.match.show');
        Route::post('umpire/match/{liveMatchScore}/setup', [UmpireDashboardController::class, 'updateMatchSetup'])->name('umpire.match.setup');
        Route::post('umpire/match/{liveMatchScore}/start', [UmpireDashboardController::class, 'startMatch'])->name('umpire.match.start');
        Route::post('umpire/match/{liveMatchScore}/score', [UmpireDashboardController::class, 'updateScore'])->name('umpire.match.score');
        Route::post('umpire/match/{liveMatchScore}/pause', [UmpireDashboardController::class, 'togglePause'])->name('umpire.match.pause');
        Route::post('umpire/match/{liveMatchScore}/change-players', [UmpireDashboardController::class, 'changePlayers'])->name('umpire.match.change-players');
        Route::get('umpire/match/{liveMatchScore}/state', [UmpireDashboardController::class, 'getMatchState'])->name('umpire.match.state');
        Route::post('umpire/match/{liveMatchScore}/end', [UmpireDashboardController::class, 'endMatch'])->name('umpire.match.end');
        Route::post('umpire/match/{liveMatchScore}/default-winner', [UmpireDashboardController::class, 'defaultWinner'])->name('umpire.match.default-winner');
        Route::post('umpire/match/{liveMatchScore}/confirm-winner', [UmpireDashboardController::class, 'confirmWinner'])->name('umpire.match.confirm-winner');
        Route::post('umpire/match/{liveMatchScore}/signatures', [UmpireDashboardController::class, 'saveSignatures'])->name('umpire.match.signatures');
        Route::get('umpire/match/{liveMatchScore}/summary', [UmpireDashboardController::class, 'showSummary'])->name('umpire.match.summary');
    });

Route::middleware('approved.organizer')->group(function () {
        Route::inertia('organizer/dashboard', 'organizer/dashboard')->name('organizer.dashboard');

        // Per-organization organizer admin dashboard (uuid-based)
        Route::get('organizer/organizations/{organization}/dashboard', [OrganizationDashboardController::class, 'show'])
            ->name('organizer.organization.dashboard');

        // Edit organization page
        Route::get('organizer/organizations/{organization}/edit', [OrganizationDashboardController::class, 'edit'])
            ->name('organizer.organization.edit');

        // Update organization
        Route::put('organizer/organizations/{organization}/update', [OrganizationDashboardController::class, 'update'])
            ->name('organizer.organization.update');

        Route::get('organizer/organizations/{organization}/tournaments/create', [TournamentController::class, 'show'])
            ->name('organizer.organization.tournaments.create');


        // Route::inertia('organizer/tournaments/create', 'organizer/create-tournament')->name('organizer.tournaments.create');
        Route::post('organizer/tournaments', [TournamentController::class, 'store'])->name('organizer.tournaments.store');
        Route::get('organizer/tournaments/{tournament}/brackets', [TournamentController::class, 'brackets'])->name('organizer.tournaments.brackets');
    });

    Route::middleware('role:player')->group(function () {
        Route::inertia('player/dashboard', 'player/dashboard')->name('player.dashboard');
        Route::inertia('player/profile', 'player/profile')->name('player.profile');
        Route::get('player/edit-profile', [PlayerProfileController::class, 'edit'])->name('player.edit-profile');
        Route::patch('player/profile', [PlayerProfileController::class, 'update'])->name('player.profile.update');
        Route::put('player/password', [PlayerProfileController::class, 'updatePassword'])->name('player.password.update');
        Route::get('organizer/apply', [OrganizationController::class, 'applyAsOrganizerPage'])->name('organizer.apply.page');
        Route::post('organizer/apply', [OrganizationController::class, 'applyAsOrganizer'])->name('organizer.apply');
        Route::get('organizer/application-status/{uuid}', [OrganizationController::class, 'applicationStatus'])->name('organizer.application.status');
    });
});

require __DIR__.'/auth.php';
require __DIR__.'/settings.php';
