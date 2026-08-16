<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\PlayerInformation;
use App\Models\Role;
use App\Models\StateProvince;
use App\Models\Status;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Response;

class PlayerManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $perPage = max(1, min(50, (int) $request->input('per_page', 10)));

        $rolePlayer = Role::query()->where('type', 'login')->where('slug', 'player')->firstOrFail();

        $players = PlayerInformation::query()
            ->with(['user', 'nationality', 'stateProvince'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('contact_number', 'like', "%{$search}%")
                        ->orWhere('club', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($query) => $query->where('email', 'like', "%{$search}%"));
                });
            })
            ->whereHas('user', fn ($query) => $query->where('role_id', $rolePlayer->id))
            ->latest('created_at')
            ->paginate($perPage)
            ->appends($request->only(['search', 'per_page']));

        $countries = Country::query()->orderBy('name')->get(['id', 'name']);
        $stateProvinces = StateProvince::query()->orderBy('name')->get(['id', 'name']);

        return inertia('admin/player-management', [
            'players' => $players,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'countries' => $countries,
            'stateProvinces' => $stateProvinces,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'profile_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'contact_number' => ['nullable', 'string', 'max:20'],
            'club' => ['nullable', 'string', 'max:255'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'birthdate' => ['nullable', 'date'],
            'nationality_id' => ['nullable', 'exists:countries,id'],
            'state_province_id' => ['nullable', 'exists:state_provinces,id'],
            'dupr_account' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = User::query()->create([
            'email' => $request->string('email')->trim(),
            'account_number' => $this->generateAccountNumber(),
            'status_id' => Status::query()->where('type', 'login')->where('slug', 'active')->firstOrFail()->id,
            'email_verified_at' => now(),
        ]);

        $playerImagePath = null;
        if ($request->hasFile('profile_image')) {
            $playerImagePath = $this->storeProfileImage($request->file('profile_image'));
        }

        $playerInformation = PlayerInformation::query()->create([
            'user_id' => $user->id,
            'profile_image' => $playerImagePath,
            'first_name' => $request->string('first_name')->trim(),
            'last_name' => $request->string('last_name')->trim(),
            'contact_number' => $request->string('contact_number')->trim(),
            'club' => $request->string('club')->trim(),
            'gender' => $request->string('gender')->value(),
            'birthdate' => $request->date('birthdate'),
            'nationality_id' => $request->integer('nationality_id'),
            'state_province_id' => $request->integer('state_province_id'),
            'dupr_account' => $request->string('dupr_account')->trim(),
            'bio' => $request->string('bio')->trim(),
        ]);

        return to_route('admin.player-management.show', $playerInformation);
    }

    public function update(Request $request, PlayerInformation $playerInformation): RedirectResponse
    {
        // dd($request->all(), $request->hasFile('profile_image'), $request->file('profile_image'));
        $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'profile_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'contact_number' => ['nullable', 'string', 'max:20'],
            'club' => ['nullable', 'string', 'max:255'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'birthdate' => ['nullable', 'date'],
            'nationality_id' => ['nullable', 'exists:countries,id'],
            'state_province_id' => ['nullable', 'exists:state_provinces,id'],
            'dupr_account' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:1000'],
        ]);

        $playerInformation->forceFill([
            'first_name' => $request->string('first_name')->trim(),
            'last_name' => $request->string('last_name')->trim(),
            'contact_number' => $request->string('contact_number')->trim(),
            'club' => $request->string('club')->trim(),
            'gender' => $request->string('gender')->value(),
            'birthdate' => $request->date('birthdate'),
            'nationality_id' => $request->integer('nationality_id'),
            'state_province_id' => $request->integer('state_province_id'),
            'dupr_account' => $request->string('dupr_account')->trim(),
            'bio' => $request->string('bio')->trim(),
        ]);

        if ($request->hasFile('profile_image')) {
            $uploadedProfileImage = $request->file('profile_image');

            if ($uploadedProfileImage && $uploadedProfileImage->isValid()) {
                $existingProfileImage = trim((string) $playerInformation->profile_image);

                if ($existingProfileImage !== '' && Storage::disk('public')->exists($existingProfileImage)) {
                    Storage::disk('public')->delete($existingProfileImage);
                }

                $storedProfileImage = $this->storeProfileImage($uploadedProfileImage);

                if ($storedProfileImage !== null) {
                    $playerInformation->profile_image = $storedProfileImage;
                }
            }
        }

        $playerInformation->save();

        return to_route('admin.player-management.show', $playerInformation);
    }

    public function show(PlayerInformation $playerInformation): Response
    {
        $playerInformation->load(['user', 'nationality', 'stateProvince']);

        $countries = Country::query()->orderBy('name')->get(['id', 'name']);
        $stateProvinces = StateProvince::query()->orderBy('name')->get(['id', 'name']);

        return inertia('admin/player-detail', [
            'player' => $playerInformation,
            'countries' => $countries,
            'stateProvinces' => $stateProvinces,
        ]);
    }

    public function sendPasswordResetLink(PlayerInformation $playerInformation): RedirectResponse
    {
        $user = $playerInformation->user;

        Password::sendResetLink(['email' => $user->email]);

        return back()->with('success', 'Password reset link sent to '.$user->email);
    }

    public function resetPassword(Request $request, PlayerInformation $playerInformation): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $playerInformation->user()->forceFill([
            'password' => Hash::make($request->string('password')->value()),
        ])->save();

        event(new PasswordReset($playerInformation->user()));

        return back()->with('success', 'Player password has been reset successfully');
    }

    public function destroy(PlayerInformation $playerInformation): RedirectResponse
    {
        $playerInformation->user()->delete();
        $playerInformation->delete();

        return to_route('admin.player-management.index');
    }

    public function removeProfileImage(PlayerInformation $playerInformation): RedirectResponse
    {
        $existingProfileImage = trim((string) $playerInformation->profile_image);

        if ($existingProfileImage !== '' && Storage::disk('public')->exists($existingProfileImage)) {
            Storage::disk('public')->delete($existingProfileImage);
        }

        $playerInformation->forceFill([
            'profile_image' => null,
        ])->save();

        return to_route('admin.player-management.show', $playerInformation);
    }

    private function storeProfileImage(?UploadedFile $uploadedProfileImage): ?string
    {
        if (! $uploadedProfileImage || ! $uploadedProfileImage->isValid() || $uploadedProfileImage->getSize() <= 0) {
            return null;
        }

        $extension = strtolower(
            $uploadedProfileImage->getClientOriginalExtension()
            ?: $uploadedProfileImage->extension()
            ?: 'jpg'
        );

        $fileName = 'player-'.Str::uuid()->toString().'.'.$extension;
        $path = 'player-images/'.$fileName;

        $tempPath = $uploadedProfileImage->getPathname();

        if (! is_string($tempPath) || $tempPath === '' || ! file_exists($tempPath)) {
            return null;
        }

        $contents = @file_get_contents($tempPath);

        if ($contents === false || trim($contents) === '') {
            return null;
        }

        $stored = Storage::disk('public')->put($path, $contents);

        return $stored ? $path : null;
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
