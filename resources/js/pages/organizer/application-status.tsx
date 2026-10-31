import { Head } from '@inertiajs/react';
import { Link as InertiaLink } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

export default function ApplicationStatus({ organization }: { organization: any }) {
    return (
        <>
            <Head title="Application Status" />
            <div className="mx-auto max-w-2xl space-y-8">
                <div className="rounded-lg border border-border bg-card p-6 shadow-[0_1px_0_rgba(15,23,42,0.03)] sm:p-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold">Application Status</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {organization.status?.slug === 'pending-approval'
                                        ? 'Your application is being reviewed'
                                        : 'Your application has been approved'}
                                </p>
                            </div>
                            <div className={`inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium ${
                                organization.status?.slug === 'pending-approval'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                            }`}>
                                {organization.status?.name}
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold mb-4">Organization Details</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Organization Name:</span>
                                    <span className="font-medium">{organization.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Email:</span>
                                    <span className="font-medium">{organization.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Applied On:</span>
                                    <span className="font-medium">
                                        {new Date(organization.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {organization.status?.slug === 'pending-approval' && (
                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
                                <p className="text-sm text-blue-900 dark:text-blue-100">
                                    Your application is being reviewed by our team. We'll send you an email confirmation once your organization is approved or if we need additional information.
                                    <br className="mt-2" />
                                    <br />
                                    You can check back here anytime to see your application status.
                                </p>
                            </div>
                        )}

                        {organization.status?.slug === 'approved' && (
                            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                                <p className="text-sm text-green-900 dark:text-green-100">
                                    Congratulations! Your organization has been approved. You now have access to the organizer dashboard to create and manage tournaments.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            {/* {organization.status?.slug === 'approved' ? (
                                <InertiaLink href="/organizer/dashboard" className="flex-1">
                                    <Button className="w-full">
                                        Go to Organizer Dashboard
                                    </Button>
                                </InertiaLink>
                            ) : (
                                <InertiaLink href="/organizer/dashboard" className="flex-1">
                                    <Button className="w-full">
                                        Back to Dashboard
                                    </Button>
                                </InertiaLink>
                            )} */}
                            <InertiaLink href="/organizer/dashboard" className="flex-1">
                                <Button className="w-full">
                                    Back to Dashboard
                                </Button>
                            </InertiaLink>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

ApplicationStatus.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/organizer/dashboard',
        },
        {
            title: 'Application Status',
            href: '/organizer/application-status',
        },
    ],
};
