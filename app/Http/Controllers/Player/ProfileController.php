<?php

namespace App\Http\Controllers\Player;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasswordUpdateRequest;
use App\Models\Country;
use App\Models\StateProvince;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('player/edit-profile', [
            'countries' => Country::query()->orderBy('name')->get(['id', 'name', 'slug', 'iso2']),
            'states' => StateProvince::query()->orderBy('name')->get(['id', 'name', 'country_id']),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => ['nullable', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:255'],
            'club' => ['nullable', 'string', 'max:255'],
            'gender' => ['nullable', 'string', 'in:Male,Female'],
            'birthdate' => ['nullable', 'date'],
            'dupr_account' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string'],
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'state_province_id' => ['nullable', 'integer', 'exists:state_provinces,id'],
        ]);

        $user = $request->user();
        $profile = $user->playerInformation()->firstOrNew();

        $profile->fill([
            'first_name' => $validated['first_name'] ?? null,
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'] ?? null,
            'contact_number' => $validated['contact_number'] ?? null,
            'club' => $validated['club'] ?? null,
            'dupr_account' => $validated['dupr_account'] ?? null,
            'bio' => $validated['bio'] ?? null,
            'nationality_id' => $validated['country_id'] ?? null,
            'state_province_id' => $validated['state_province_id'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'birthdate' => $validated['birthdate'] ?? null,
        ]);

        $profile->user_id = $user->id;
        $profile->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return back();
    }

    public function updatePassword(PasswordUpdateRequest $request): RedirectResponse
    {
        $request->user()->update([
            'password' => $request->password,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Password updated.')]);

        return back();
    }
}
