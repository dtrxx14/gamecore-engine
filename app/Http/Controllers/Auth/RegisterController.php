<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\PlayerInformation;
use App\Models\Role;
use App\Models\StateProvince;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class RegisterController extends Controller
{
    public function create()
    {
        return inertia('auth/register', [
            'countries' => Country::query()->orderBy('name')->get(['id', 'name', 'slug', 'iso2']),
            'states' => StateProvince::query()->orderBy('name')->get(['id', 'name', 'country_id']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'agree_terms' => ['accepted'],
            'profile_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'google_id' => ['nullable', 'string', 'max:255'],
        ]);

        $role = Role::query()->where('type', 'login')->where('slug', 'player')->first();
        $status = \App\Models\Status::query()->where('type', 'login')->where('slug', 'active')->first();

        $existingUser = null;
        if (! empty($data['google_id'])) {
            $existingUser = User::query()->where('google_id', $data['google_id'])->first();
        }

        $user = $existingUser ?? User::query()->create([
            'account_number' => $this->generateAccountNumber(),
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'google_id' => $data['google_id'] ?? null,
            'status_id' => $status?->id ?? 1,
            'role_id' => $role?->id ?? 0,
            'is_organizer' => false,
        ]);

        if (! empty($data['google_id'])) {
            $user->forceFill(['google_id' => $data['google_id']])->save();
        }

        if (! empty($data['email'])) {
            $user->forceFill(['email' => $data['email']])->save();
        }

        $playerData = [
            'user_id' => $user->id,
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
        ];

        if ($request->hasFile('profile_image')) {
            $path = $request->file('profile_image')->store('profile-images', 'public');
            $playerData['profile_image'] = $path;
        }

        $playerProfile = $user->playerInformation()->first();
        if ($playerProfile) {
            $playerProfile->fill($playerData)->save();
        } else {
            PlayerInformation::query()->create($playerData);
        }

        auth()->login($user);

        return redirect()->intended(route($user->dashboardRouteName()));
    }

    private function generateAccountNumber(): string
    {
        $today = now()->format('Ymd');

        $lastUser = User::latest('id')->first();
        $sequence = 1;

        if ($lastUser && $lastUser->account_number) {
            $lastSequence = (int) substr($lastUser->account_number, -4);
            $sequence = $lastSequence + 1;
        }

        return $today.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }
}
