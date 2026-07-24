<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RedirectAuthenticatedUsersToRoleDashboard;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\ApprovedOrganizerMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'redirect.authenticated.to.role.dashboard' => RedirectAuthenticatedUsersToRoleDashboard::class,
            'approved.organizer' => ApprovedOrganizerMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Render Inertia error pages for common HTTP errors
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return null; // Let JSON handling take over
            }

            $status = $e->getStatusCode();

            if (in_array($status, [400, 401, 403, 404, 419, 429, 500, 503])) {
                return inertia('errors/error', [
                    'status' => $status,
                    'message' => $e->getMessage(),
                ])->toResponse($request)->setStatusCode($status);
            }

            return null;
        });
    })->create();
