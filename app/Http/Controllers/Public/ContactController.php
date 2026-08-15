<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    /**
     * Show the contact page.
     */
    public function create()
    {
        return inertia('public/contact');
    }

    /**
     * Handle the contact form submission.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'subject' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        // Log the contact message for now (no mailer configured for this demo).
        Log::info('Contact form submission', $data);

        return back()->with('success', 'Your message has been sent. We will get back to you soon!');
    }
}
