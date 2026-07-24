<?php

namespace App\Http\Controllers\Api;

use App\Models\Organization;
use App\Models\Status;
use Illuminate\Http\Request;

class OrganizerApprovalController
{
    public function approve(Organization $organization)
    {
        if ($organization->status->slug !== 'pending-approval') {
            return response()->json(['error' => 'Organization is not pending approval'], 400);
        }

        // Get approved status
        $approvedStatus = Status::where('type', 'organization')
            ->where('slug', 'approved')
            ->firstOrCreate(['type' => 'organization', 'slug' => 'approved'], ['name' => 'Approved']);

        $organization->update(['status_id' => $approvedStatus->id]);

        // TODO: Send approval email to organization admin
        // Mail::to($organization->email)->send(new OrganizerApprovedMail($organization));

        return response()->json(['success' => true]);
    }

    public function reject(Organization $organization, Request $request)
    {
        if ($organization->status->slug !== 'pending-approval') {
            return response()->json(['error' => 'Organization is not pending approval'], 400);
        }

        // Get rejected status
        $rejectedStatus = Status::where('type', 'organization')
            ->where('slug', 'rejected')
            ->firstOrCreate(['type' => 'organization', 'slug' => 'rejected'], ['name' => 'Rejected']);

        $organization->update(['status_id' => $rejectedStatus->id]);

        // TODO: Send rejection email to organization admin with reason
        // Mail::to($organization->email)->send(new OrganizerRejectedMail($organization, $request->input('reason')));

        return response()->json(['success' => true]);
    }
}
