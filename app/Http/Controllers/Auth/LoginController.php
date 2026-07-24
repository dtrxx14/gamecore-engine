<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class LoginController extends Controller
{
    /**
     * Show the login form.
     */
    public function create()
    {
        return inertia('auth/login');
    }

    /**
     * Handle the login request.
     */
    public function store(Request $request)
    {
        // Validate the request data
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        // Attempt to authenticate the user
        if (auth()->attempt($credentials)) {
            $request->session()->regenerate();

            $user = $request->user();

            return redirect()->intended(route($user->dashboardRouteName()));
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ]);
    }
}
