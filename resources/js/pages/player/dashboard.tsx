import { Head, Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { dashboard as organizerDashboard } from '@/routes/organizer';

export default function PlayerDashboard() {
    const { auth } = usePage().props;
    const user = auth?.user;

    // Role gating (client-side fallback)
    const isOrganizer = user?.organization_memberships?.map((membership) => membership.role?.slug).some((role) => role === 'admin' || role === 'umpire') ?? false;

    return (
        <>
            <Head title="Player Dashboard" />
            <div className="space-y-4">
                <div className="rounded-xl border bg-card p-8 shadow-sm">
                    <h2 className="text-xl font-semibold">Player overview</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Keep track of your active tournaments, teams, and profile updates.
                    </p>
                </div>

                {!isOrganizer && (
                    <div className="rounded-xl border bg-card p-8 shadow-sm">
                        <h3 className="text-lg font-semibold">Organize Tournaments</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {user.has_approved_organization
                                ? 'You have an approved organization. Access your organization dashboard to manage tournaments.'
                                : 'Want to organize tournaments? Apply as an organizer to get started.'}
                        </p>
                        <div className="mt-4">
                            {user.has_approved_organization ? (
                                <Link href={organizerDashboard.url()}>
                                    <Button>Organization Dashboard</Button>
                                </Link>
                            ) : (
                                <Link href="/organizer/apply">
                                    <Button>Organize Tournament</Button>
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

PlayerDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/player/dashboard',
        },
    ],
};
