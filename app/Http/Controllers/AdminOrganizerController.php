<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use Illuminate\Http\Request;

class AdminOrganizerController extends Controller
{
    public function approvals()
    {
        $organizations = Organization::query()
            ->with(['status', 'members.user.playerInformation', 'members.role'])
            ->where('status_id', function ($query) {
                $query->select('id')
                    ->from('statuses')
                    ->where('type', 'organization')
                    ->where('slug', 'pending-approval');
            })
            ->latest('created_at')
            ->get();

        return inertia('admin/organizer-approvals', [
            'organizations' => $organizations,
        ]);
    }

    public function management(Request $request)
    {
        $perPage = max(1, min(50, (int) $request->input('per_page', 10)));
        $search = trim((string) $request->input('search', ''));

        $organizations = Organization::query()
            ->with(['status', 'country', 'stateProvince', 'members.user', 'members.role', 'tournaments'])
            ->whereHas('status', fn ($query) => $query->where('slug', 'approved'))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('contact_number', 'like', "%{$search}%");
                });
            })
            ->latest('created_at')
            ->paginate($perPage)
            ->appends($request->only(['search', 'per_page']));

        return inertia('admin/organizer-management', [
            'organizations' => $organizations,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function show(Organization $organization)
    {
        $organization->load(['status', 'country', 'stateProvince', 'members.user.playerInformation', 'members.role', 'tournaments']);

        return inertia('admin/organizer-management-details', [
            'organization' => $organization,
        ]);
    }
}
