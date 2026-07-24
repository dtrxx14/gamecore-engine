import { Head, usePage } from '@inertiajs/react';
import { Building2, ChevronRight, ShieldCheck, Clock } from 'lucide-react';

type OrganizationMembership = {
    organization_id?: number;
    organization?: {
        uuid: string;
        name: string;
        logo_image?: string;
        banner_image?: string;
        status?: {
            name?: string;
            slug?: string;
        } | null;
    };
    role?: {
        name?: string;
        slug?: string;
    } | null;
};

function roleLabel(roleSlug?: string) {
    switch (roleSlug) {
        case 'admin':
            return 'Admin';
        case 'umpire':
            return 'Umpire';
        default:
            return 'Member';
    }
}

function statusDotClass(statusSlug?: string) {
    switch (statusSlug) {
        case 'approved':
            return 'bg-emerald-500';
        case 'pending-approval':
            return 'bg-amber-500';
        default:
            return 'bg-primary';
    }
}

export default function Organizations() {
    const { props } = usePage();
    const user = props?.auth?.user;
    const memberships = (user?.organization_memberships ?? []) as OrganizationMembership[];

    if (!user) {
        return (
            <>
                <Head title="Organizations" />
                <div className="space-y-4">
                    <div className="rounded-xl border bg-card/70 p-5 shadow-sm">
                        <h2 className="text-lg font-semibold">Organizations</h2>
                        <p className="mt-2 text-sm text-muted-foreground">You must be logged in to view organizer workspaces.</p>
                    </div>
                </div>
            </>
        );
    }

    const redirectToOrganization = (membership: OrganizationMembership) => {
        const uuid = membership.organization?.uuid;
        const statusSlug = membership.organization?.status?.slug;

        if (!uuid) return;

        if (statusSlug === 'pending-approval') {
            window.location.href = `/organizer/application-status/${uuid}`;
            return;
        }

        if (statusSlug === 'approved') {
            window.location.href = `/organizer/organizations/${encodeURIComponent(uuid)}/dashboard`;
            return;
        }

        window.location.href = '/organizer/dashboard';
    };

    return (
        <>
            <Head title="Organizations" />

            <div className="space-y-6">
                <div className="rounded-xl border bg-gradient-to-br from-background via-card to-primary/10 p-6 shadow-sm">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Your Organizations</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Select an organization to manage its dashboard
                        </p>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {memberships.length > 0 ? (
                            memberships.map((m) => {
                                const orgName = m.organization?.name ?? 'Unnamed';
                                const orgStatus = m.organization?.status;
                                const roleSlug = m.role?.slug;
                                
                                return (
                                    <button
                                        key={m.organization_id}
                                        type="button"
                                        onClick={() => redirectToOrganization(m)}
                                        className="group text-left rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                                    {m.organization?.logo_image ? (
                                                        <img
                                                            src={`/storage/${m.organization.logo_image}`}
                                                            alt={`${m.organization?.name ?? 'Organization'} logo`}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <Building2 className="h-8 w-8 text-primary" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={"h-2 w-2 rounded-full " + statusDotClass(orgStatus?.slug)} />
                                                        <h3 className="font-semibold">{orgName}</h3>
                                                    </div>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {orgStatus?.name ?? '—'}
                                                    </p>
                                                </div>
                                            </div>

                                            <span className="inline-flex shrink-0 items-center rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-primary">
                                                {roleLabel(roleSlug)}
                                            </span>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                                            <span className="text-xs text-muted-foreground">
                                                Open dashboard
                                            </span>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="col-span-full rounded-lg border border-dashed bg-card/50 p-8 text-center text-sm text-muted-foreground">
                                <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                                No organizations found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

