<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApprovedOrganizerMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();

        if (! $user) {
            return redirect()->route('login');
        }

        $membership = $user->organizationMembers()
            // Only allow organizer roles that are attached to the organization pivot.
            // NOTE: `type` must match your Role model column; if your role rows don't use `type`, this will filter out everyone.
            ->whereHas('role', fn ($query) => $query->whereIn('slug', ['admin', 'umpire']))
            ->first();

        if (! $membership) {
            return redirect()->route('dashboard');
        }

        return $next($request);
    }
}
