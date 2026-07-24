<?php

namespace App\Http\Controllers;

use App\Http\Requests\ApplyAsOrganizerRequest;
use App\Models\Organization;
use App\Models\OrganizationMember;
use App\Models\Role;
use App\Models\Status;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrganizationController extends Controller
{
    public function applyAsOrganizerPage()
    {
        return inertia('organizer/apply');
    }

    public function applyAsOrganizer(ApplyAsOrganizerRequest $request)
    {
        $user = $request->user();

        // Check if user already has a pending or approved organization via organization_members
        $existingMembership = $user->organizationMembers()
            ->whereHas('role', fn ($query) => $query->where('type', 'organization')->where('slug', 'admin'))
            ->whereHas('organization.status', fn ($query) => $query->whereIn('slug', ['pending-approval', 'approved']))
            ->exists();

        if ($existingMembership) {
            return back()->withErrors([
                'name' => 'You already have an organization pending approval or already approved.',
            ]);
        }

        $uuid = (string) Str::uuid();

        try {
            DB::transaction(function () use ($request, $user, $uuid) {
                // Get or create pending-approval status for organizations
                $organizationStatus = Status::firstOrCreate(
                    ['type' => 'organization', 'slug' => 'pending-approval'],
                    ['name' => 'Pending Approval', 'slug' => 'pending-approval']
                );

                // Get admin role for organization
                $adminRole = Role::where('type', 'organization')
                    ->where('slug', 'admin')
                    ->first();

                if (!$adminRole) {
                    throw new \Exception('Admin role for organizations not found.');
                }

                // Get approved status for organization members
                $memberStatus = Status::firstOrCreate(
                    ['type' => 'organization-member', 'slug' => 'approved'],
                    ['name' => 'Approved', 'slug' => 'approved']
                );

                $logo = $request->file('logo_image');
                $banner = $request->file('banner_image');

                // Create the organization
                $organization = Organization::create([
                    'uuid' => $uuid,
                    'name' => $request->input('name'),
                    'slug' => Str::slug($request->input('name')),
                    'logo_image' => $logo ? $logo->store('organizations/logos', 'public') : null,
                    'banner_image' => $banner ? $banner->store('organizations/banners', 'public') : null,
                    'email' => $request->input('email'),
                    'contact_number' => $request->input('contact_number'),
                    'website_url' => $request->input('website_url'),
                    'description' => $request->input('description'),
                    'address' => $request->input('address'),
                    'country_id' => $request->input('country_id'),
                    'state_province_id' => $request->input('state_province_id'),
                    'zip_code' => $request->input('zip_code'),
                    'status_id' => $organizationStatus->id,
                ]);

                // Create organization member record - user as admin
                OrganizationMember::create([
                    'organization_id' => $organization->id,
                    'user_id' => $user->id,
                    'role_id' => $adminRole->id,
                    'status_id' => $memberStatus->id,
                ]);
            });

            return redirect()->route('organizer.application.status', ['uuid' => $uuid])->with('success', 'Your organization application has been submitted for approval.');
        } catch (\Exception $e) {
            \Log::error('Error applying as organizer: '.$e->getMessage());
            return back()->withErrors([
                'name' => 'An error occurred while submitting your application. Please try again.',
            ]);
        }
    }

    public function applicationStatus($uuid)
    {
        $user = auth()->user();

        // Get the user's pending or approved organization
        $organization = $user->organizationMembers()
            ->whereHas('role', fn ($query) => $query->where('type', 'organization')->where('slug', 'admin'))
            ->whereHas('organization.status', fn ($query) => $query->whereIn('slug', ['pending-approval', 'approved']))
            ->with('organization.status')
            ->first()?->organization;

        if (!$organization) {
            return redirect()->route('organizer.apply.page');
        }

        // $organization = [
        //     'name' => 'Acme Sports',
        //     'slug' => 'acme-sports',
        //     'email' => 'hello@acmesports.test',
        //     'contact_number' => '123456789',
        //     'website_url' => 'https://acmesports.test',
        //     'description' => 'A great sports organization.',
        //     'address' => '123 Main Street',
        //     'country_id' => 1,
        //     'state_province_id' => 1,
        //     'zip_code' => '12345',
        //     'created_at' => now(),
        //     'status' => [
        //         'name' => 'Pending Approval',
        //         'slug' => 'pending-approval',
        //     ],
        // ];

        // return inertia('organizer/application-status', [
        //     'organization' => $organization,
        // ]);

        // Important: the route is defined as:
        // organizer/application-status/{uuid}
        // The inertia page we render is `resources/js/pages/organizer/application-status.tsx`.
        // Do not include trailing slash here, and include the uuid in the props.
        return inertia('organizer/application-status', [
            'organization' => $organization->load('status'),
            'uuid' => $uuid,
        ]);
    }
}
