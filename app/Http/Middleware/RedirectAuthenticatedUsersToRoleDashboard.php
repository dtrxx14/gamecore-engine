<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RedirectAuthenticatedUsersToRoleDashboard
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! auth()->check()) {
            return $next($request);
        }

        $routeName = $request->route()?->getName();

        if ($routeName === 'login' || $routeName === 'login.store') {
            return $this->noStoreRedirect(route(auth()->user()->dashboardRouteName()));
        }

        return $next($request);
    }

    protected function noStoreRedirect(
        mixed $target,
    ): Response {
        $response = redirect()->to($target);
        $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', '0');

        return $response;
    }
}
