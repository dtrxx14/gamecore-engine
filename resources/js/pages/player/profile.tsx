import { Head, Link, usePage } from '@inertiajs/react';
import { Building2, CalendarDays, Mail, Phone, UserRound, Trophy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function PlayerProfile() {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    
    const organizationMemberships = user?.organization_memberships ?? [];
    const visibleOrganizationMemberships = organizationMemberships.slice(0, 3);
    const hasMoreOrganizations = organizationMemberships.length > 3;
    const recentTournamentActivity = Array.isArray((user as any)?.recent_tournaments) ? (user as any).recent_tournaments.slice(0, 3) : [];
    const hasMoreActivity = Array.isArray((user as any)?.recent_tournaments) ? (user as any).recent_tournaments.length > 3 : false;
    const [activeTab, setActiveTab] = useState<'overview' | 'organizations' | 'activity'>('overview');

    return (
        <>
            <Head title="Player profile" />
            <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm">
                    {/* <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                                <UserRound className="size-3.5" />
                                Player profile
                            </div>
                            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                                {user?.player_profile?.first_name || 'Player'} {user?.player_profile?.last_name || ''}
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                Manage your account details, explore the organizations you’re connected to, and control where you are visible as a player.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link href="/player/edit-profile">
                                <Button variant="outline">Edit profile</Button>
                            </Link>
                        </div>
                    </div> */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                                <UserRound className="size-3.5" />
                                Player profile
                            </div>
                            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                                {user?.player_profile?.first_name || 'Player'} {user?.player_profile?.last_name || ''}
                            </h2>
                            <p className="flex items-start mt-2 text-sm text-muted-foreground">
                                <span className="mr-2">
                                    { user?.account_number }
                                </span>
                                <span className="text-base">·</span>
                                <span className="ml-2">
                                    { user?.email }
                                </span>
                            </p>
                        </div>
                        <Link href="/player/edit-profile">
                            <Button variant="outline">
                                <UserRound className="size-3.5" />
                                Edit profile
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/90 p-4 shadow-sm">
                    <div className="flex flex-wrap gap-2">
                        <Button className={`rounded-lg ${activeTab === 'overview' ? 'text-primary-foreground' : 'bg-none text-muted-foreground hover:text-primary'}`} onClick={() => setActiveTab('overview')}>Player Details</Button>
                        <Button className={`rounded-lg ${activeTab === 'organizations' ? 'text-primary-foreground' : 'bg-none text-muted-foreground hover:text-primary'}`} onClick={() => setActiveTab('organizations')}>Organizations</Button>
                        <Button className={`rounded-lg ${activeTab === 'activity' ? 'text-primary-foreground' : 'bg-none text-muted-foreground hover:text-primary'}`} onClick={() => setActiveTab('activity')}>Activity</Button>
                    </div>
                </div>

                {activeTab === 'overview' ? (
                    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                        <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-background via-background to-primary/25 p-6 shadow-sm">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <UserRound className="size-4 text-primary" />
                                Profile details
                            </div>
                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
                                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Full name</div>
                                    <div className="mt-2 text-base font-semibold text-foreground">
                                        {user?.player_profile?.first_name || 'Player'} {user?.player_profile?.last_name || ''}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
                                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Email</div>
                                    <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
                                        <Mail className="size-4 text-primary" />
                                        {user?.email || 'No email provided'}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
                                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Phone</div>
                                    <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
                                        <Phone className="size-4 text-primary" />
                                        {user?.player_profile?.contact_number || 'Not shared yet'}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
                                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Birthdate</div>
                                    <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
                                        <CalendarDays className="size-4 text-primary" />
                                        {user?.player_profile?.birthdate || 'Not provided'}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 rounded-2xl border border-border/60 bg-background/70 p-4">
                                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">About</div>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    {user?.player_profile?.bio || 'No player bio added yet. Update your profile to share more about yourself with organizers and teams.'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-sm">
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <Trophy className="size-4 text-primary" />
                                    Recent activity
                                </div>
                                {recentTournamentActivity.length > 0 ? (
                                    <div className="mt-4 space-y-3">
                                        {recentTournamentActivity.map((activity: any, index: number) => (
                                            <div key={activity.id ?? index} className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                                                <div className="font-medium text-foreground">{activity.title || 'Tournament'}</div>
                                                <div className="mt-1 text-sm text-muted-foreground">
                                                    {activity.status || 'Joined'} • {activity.date || 'Recent activity'}
                                                </div>
                                            </div>
                                        ))}
                                        {hasMoreActivity ? (
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('activity')}
                                                className="text-sm font-medium text-primary transition hover:text-primary/80"
                                            >
                                                See more activity
                                            </button>
                                        ) : null}
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-2xl border border-dashed border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                                        No tournament activity yet.
                                    </div>
                                )}
                            </div>

                            <div className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-sm">
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <Building2 className="size-4 text-primary" />
                                    Connected organizations
                                </div>
                                {visibleOrganizationMemberships.length > 0 ? (
                                    <div className="mt-4 space-y-3">
                                        {visibleOrganizationMemberships.map((membership: any, index: number) => (
                                            <div key={membership.organization_id ?? index} className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                                                <div>
                                                    <div className="font-medium text-foreground">{membership.organization?.name || 'Organization'}</div>
                                                    <div className="text-sm text-muted-foreground">{membership.role?.name || 'Member'} • {membership.organization?.status?.name || 'Status pending'}</div>
                                                </div>
                                                <div className="rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
                                                    {membership.role?.slug === 'admin' ? 'Admin' : membership.role?.slug === 'umpire' ? 'Umpire' : 'Member'}
                                                </div>
                                            </div>
                                        ))}
                                        {hasMoreOrganizations ? (
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('organizations')}
                                                className="text-sm font-medium text-primary transition hover:text-primary/80"
                                            >
                                                Check more organizations
                                            </button>
                                        ) : null}
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-2xl border border-dashed border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                                        You are not connected to any organization yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'organizations' ? (
                    <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Building2 className="size-4 text-primary" />
                            Your organizations
                        </div>
                        {organizationMemberships.length > 0 ? (
                            <div className="mt-4 space-y-3">
                                {organizationMemberships.map((membership: any, index: number) => (
                                    <div key={membership.organization_id ?? index} className="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                                        <div>
                                            <div className="font-medium text-foreground">{membership.organization?.name || 'Organization'}</div>
                                            <div className="text-sm text-muted-foreground">{membership.role?.name || 'Member'} • {membership.organization?.status?.name || 'Status pending'}</div>
                                        </div>
                                        <div className="rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
                                            {membership.role?.slug === 'admin' ? 'Admin' : membership.role?.slug === 'umpire' ? 'Umpire' : 'Member'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-4 rounded-xl border border-dashed border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                                You are not connected to any organization yet.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Trophy className="size-4 text-primary" />
                            Your activity
                        </div>
                        {Array.isArray((user as any)?.recent_tournaments) && (user as any).recent_tournaments.length > 0 ? (
                            <div className="mt-4 space-y-3">
                                {(user as any).recent_tournaments.map((activity: any, index: number) => (
                                    <div key={activity.id ?? index} className="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                                        <div>
                                            <div className="font-medium text-foreground">{activity.title || 'Tournament'}</div>
                                            <div className="text-sm text-muted-foreground">{activity.status || 'Joined'} • {activity.date || 'Recent activity'}</div>
                                        </div>
                                        <div className="rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
                                            {activity.type || 'Tournament'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-4 rounded-xl border border-dashed border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                                No recent tournament matches yet.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

PlayerProfile.layout = {
    breadcrumbs: [
        {
            title: 'Profile',
            href: '/player/profile',
        },
    ],
};
