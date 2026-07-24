<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Status;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $perPage = max(1, min(50, (int) $request->input('per_page', 10)));

        $admins = User::query()
            ->with(['role', 'status'])
            ->whereHas('role', fn ($query) => $query->where('slug', 'admin'))
            ->where('id', '!=', $request->user()->id)
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery->where('email', 'like', "%{$search}%")
                        ->orWhere('account_number', 'like', "%{$search}%");
                });
            })
            ->latest('created_at')
            ->paginate($perPage)
            ->appends($request->only(['search', 'per_page']));

        return inertia('admin/user-management', [
            'admins' => $admins,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $adminRole = Role::query()->where('type', 'login')->where('slug', 'admin')->firstOrFail();
        $activeStatus = Status::query()->where('type', 'login')->where('slug', 'active')->firstOrFail();

        User::query()->create([
            'email' => $request->string('email')->trim(),
            'account_number' => $this->generateAccountNumber(),
            'password' => Hash::make($request->string('password')->value()),
            'role_id' => $adminRole->id,
            'status_id' => $activeStatus->id,
            'email_verified_at' => now(),
        ]);

        return to_route('admin.user-management.index');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        //
    }

    public function toggleStatus(User $user): RedirectResponse
    {
        $inactiveStatus = Status::query()->where('type', 'login')->where('slug', 'inactive')->firstOrFail();
        $activeStatus = Status::query()->where('type', 'login')->where('slug', 'active')->firstOrFail();

        $user->forceFill([
            'status_id' => $user->status_id === $activeStatus->id ? $inactiveStatus->id : $activeStatus->id,
        ])->save();

        return to_route('admin.user-management.index');
    }

    public function resetPassword(User $user): RedirectResponse
    {
        $user->forceFill([
            'password' => Hash::make('Test123!'),
        ])->save();

        return to_route('admin.user-management.index');
    }

    public function destroy(User $user): RedirectResponse
    {
        $user->delete();

        return to_route('admin.user-management.index');
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
