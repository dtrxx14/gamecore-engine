<?php

namespace App\Http\Controllers\Organizer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationDashboardController extends Controller
{
    public function show(Request $request, string $organization): Response
    {
        $user = $request->user();

        $membership = $user->organizationMembers()
            ->with(['organization.status', 'role'])
            ->whereHas('organization', fn ($q) => $q->where('uuid', $organization))
            ->first();

        if (! $membership || ! $membership->organization) {
            abort(404);
        }

        // Load full organization data with all relations
        $org = $membership->organization;
        $org->load([
            'status', 
            'country', 
            'stateProvince', 
            'members.user.playerInformation', 
            'members.role',
            'tournaments',
        ]);

        return Inertia::render('organizer/organization-dashboard', [
            'organization' => $org,
            'role' => [
                'name' => $membership->role?->name,
                'slug' => $membership->role?->slug,
            ],
            'organizationUuid' => $membership->organization->uuid,
        ]);
    }

    public function edit(Request $request, string $organization): Response
    {
        $user = $request->user();

        $membership = $user->organizationMembers()
            ->with(['organization.status', 'role'])
            ->whereHas('organization', fn ($q) => $q->where('uuid', $organization))
            ->first();

        if (! $membership || ! $membership->organization) {
            abort(404);
        }

        $org = $membership->organization;
        $org->load(['status', 'country', 'stateProvince']);

        return Inertia::render('organizer/edit-organization', [
            'organization' => $org,
            'organizationUuid' => $membership->organization->uuid,
        ]);
    }

public function update(Request $request, string $organization)
    {
        $user = $request->user();

        $membership = $user->organizationMembers()
            ->whereHas('organization', fn ($q) => $q->where('uuid', $organization))
            ->first();

        if (! $membership || ! $membership->organization) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'website_url' => ['nullable', 'url', 'max:255'],
            'description' => ['nullable', 'string'],
            'address' => ['nullable', 'string', 'max:255'],
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'state_province_id' => ['nullable', 'integer', 'exists:state_provinces,id'],
            'zip_code' => ['nullable', 'string', 'max:20'],
            'logo_image' => ['nullable', 'image', 'max:2048'],
            'banner_image' => ['nullable', 'image', 'max:5120'],
        ]);

        $org = $membership->organization;

        if ($request->hasFile('logo_image')) {
            $validated['logo_image'] = $request->file('logo_image')->store('organizations/logos', 'public');
        }

        if ($request->hasFile('banner_image')) {
            $validated['banner_image'] = $request->file('banner_image')->store('organizations/banners', 'public');
        }

        $org->update($validated);

        return redirect()->route('organizer.organization.dashboard', ['organization' => $organization])
            ->with('success', 'Organization updated successfully.');
    }
}

