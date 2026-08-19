import { Head } from '@inertiajs/react';
import { Activity, ArrowRight, CalendarRange, CheckCircle2, ShieldCheck, TrendingUp, Trophy, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';

type DashboardStats = {
    total_users: number;
    verified_users: number;
    total_organizations: number;
    approved_organizations: number;
    pending_organizations: number;
    total_tournaments: number;
    total_live_configurations: number;
    active_matches: number;
};

type RecentItem = {
    title: string;
    subtitle: string;
    timestamp: string | null;
};

type DashboardPageProps = {
    stats: DashboardStats;
    recent_activity: RecentItem[];
    recent_users: RecentItem[];
    recent_organizations: RecentItem[];
    recent_tournaments: RecentItem[];
};

const formatRelativeTime = (value: string | null) => {
    if (!value) {
        return 'Just now';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Just now';
    }

    const diff = Date.now() - date.getTime();
    const minutes = Math.max(1, Math.round(diff / 60000));

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.round(minutes / 60);
    if (hours < 24) {
        return `${hours}h ago`;
    }

    const days = Math.round(hours / 24);
    return `${days}d ago`;
};

export default function Dashboard({ stats, recent_activity, recent_users, recent_organizations, recent_tournaments }: DashboardPageProps) {
    const metrics = [
        {
            title: 'Total users',
            value: stats.total_users,
            detail: `${stats.verified_users} verified`,
            icon: Users,
        },
        {
            title: 'Organizations',
            value: stats.total_organizations,
            detail: `${stats.approved_organizations} approved`,
            icon: ShieldCheck,
        },
        {
            title: 'Tournaments',
            value: stats.total_tournaments,
            detail: `${stats.total_live_configurations} live configs`,
            icon: Trophy,
        },
        {
            title: 'Active matches',
            value: stats.active_matches,
            detail: `${stats.total_live_configurations} live configs`,
            icon: Activity,
        },
    ];

    const approvalProgress = stats.total_organizations
        ? (stats.approved_organizations / stats.total_organizations) * 100
        : 0;

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-5 overflow-x-auto p-4 lg:p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary/80">CRM overview</p>
                        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Operations dashboard</h1>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary">
                        <TrendingUp className="size-4" />
                        Live platform pulse
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {metrics.map(({ title, value, detail, icon: Icon }) => (
                        <Card key={title} className="border-border/70 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                                <div className="rounded-full bg-primary/10 p-2 text-primary">
                                    <Icon className="size-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-semibold tracking-tight text-foreground">{value}</div>
                                <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
                    <Card className="border-border/70 bg-card/95 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-base font-semibold text-foreground">Recent platform activity</CardTitle>
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                Updated now <ArrowRight className="size-3" />
                            </span>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recent_activity.length > 0 ? (
                                recent_activity.map((item) => (
                                    <div key={`${item.title}-${item.subtitle}-${item.timestamp}`} className="flex items-center justify-between gap-3 border-b border-border/60 py-2.5 last:border-b-0 last:pb-0 first:pt-0">
                                        <div>
                                            <p className="font-medium text-foreground">{item.title}</p>
                                            <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                                        </div>
                                        <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(item.timestamp)}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No activity has been logged yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 bg-card/95 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold text-foreground">Organization pipeline</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Approval rate</span>
                                    <span className="font-medium text-foreground">{Math.round(approvalProgress)}%</span>
                                </div>
                                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80" style={{ width: `${approvalProgress}%` }} />
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                                <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                                    <p className="text-sm text-muted-foreground">Approved</p>
                                    <p className="mt-1 text-2xl font-semibold text-foreground">{stats.approved_organizations}</p>
                                </div>
                                <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                                    <p className="text-sm text-muted-foreground">Pending</p>
                                    <p className="mt-1 text-2xl font-semibold text-foreground">{stats.pending_organizations}</p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border/70 bg-primary/5 p-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                                    <CheckCircle2 className="size-4" />
                                    Verification coverage
                                </div>
                                <p className="mt-2 text-2xl font-semibold text-foreground">{stats.verified_users}</p>
                                <p className="text-sm text-muted-foreground">Verified users out of {stats.total_users}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                    <Card className="border-border/70 bg-card/95 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold text-foreground">Newest users</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recent_users.map((user) => (
                                <div key={`${user.title}-${user.subtitle}`} className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-b-0 last:pb-0 first:pt-0">
                                    <div>
                                        <p className="font-medium text-foreground">{user.title}</p>
                                        <p className="text-xs text-muted-foreground">{user.subtitle}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{formatRelativeTime(user.timestamp)}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 bg-card/95 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold text-foreground">Organizations</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recent_organizations.map((organization) => (
                                <div key={`${organization.title}-${organization.subtitle}`} className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-b-0 last:pb-0 first:pt-0">
                                    <div>
                                        <p className="font-medium text-foreground">{organization.title}</p>
                                        <p className="text-xs text-muted-foreground">{organization.subtitle}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{formatRelativeTime(organization.timestamp)}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 bg-card/95 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold text-foreground">Tournaments</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recent_tournaments.map((tournament) => (
                                <div key={`${tournament.title}-${tournament.subtitle}`} className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-b-0 last:pb-0 first:pt-0">
                                    <div>
                                        <p className="font-medium text-foreground">{tournament.title}</p>
                                        <p className="text-xs text-muted-foreground">{tournament.subtitle}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{formatRelativeTime(tournament.timestamp)}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border/70 bg-card/95 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-base font-semibold text-foreground">Performance snapshot</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarRange className="size-4 text-primary" />
                            Last 30 days
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                            <p className="text-sm text-muted-foreground">Verified users</p>
                            <p className="mt-1 text-2xl font-semibold text-foreground">{stats.verified_users}</p>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                            <p className="text-sm text-muted-foreground">Live configs</p>
                            <p className="mt-1 text-2xl font-semibold text-foreground">{stats.total_live_configurations}</p>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                            <p className="text-sm text-muted-foreground">Open matches</p>
                            <p className="mt-1 text-2xl font-semibold text-foreground">{stats.active_matches}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
