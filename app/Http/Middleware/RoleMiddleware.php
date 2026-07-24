<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = auth()->user();

        if (! $user) {
            return $this->noStoreRedirect(route('login'));
        }

        $userRoleSlug = $user->role?->slug;

        if (! in_array($userRoleSlug, $roles, true)) {
            return $this->noStoreRedirect(route($user->dashboardRouteName()));
        }

        return $next($request);
    }

    protected function noStoreRedirect(string $target): Response
    {
        $response = redirect()->to($target);
        $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', '0');

        return $response;
    }
}
