import { Head, Link, router } from '@inertiajs/react';
import { Activity, Swords, UserRound, Clock, ShieldHalf } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Status {
    id: number;
    name: string;
    slug: string;
}

interface LiveCategory {
    id: number;
    name: string;
    game_to: number;
    game_time: string | null;
    game_interval: string | null;
}

interface LiveTeam {
    id: number;
    name: string;
    player_ids: number[];
}

interface LiveConfiguration {
    id: number;
    name: string;
    number_of_courts: number;
    scoring_system: string;
    status: Status | null;
}

interface LiveMatchScore {
    id: number;
    live_configuration_id: number;
    court_number: number;
    category_id: number | null;
    team_a_id: number | null;
    team_b_id: number | null;
    team_a_score: number;
    team_b_score: number;
    serving_team: 'team_a' | 'team_b' | null;
    next_team_a_id: number | null;
    next_team_b_id: number | null;
    status_id: number;
    team_a?: LiveTeam | null;
    team_b?: LiveTeam | null;
    next_team_a?: LiveTeam | null;
    next_team_b?: LiveTeam | null;
    category?: LiveCategory | null;
    status?: Status | null;
    liveConfiguration?: LiveConfiguration;
}

interface GroupedAssignment {
    configuration: LiveConfiguration;
    courts: LiveMatchScore[];
}

interface Props {
    groupedAssignments: GroupedAssignment[];
}

export default function UmpireDashboard({ groupedAssignments }: Props) {
    const openMatchDetail = (match: LiveMatchScore) => {
        router.visit(`/umpire/match/${match.id}`);
    };

    const getTeamName = (team: LiveTeam | null | undefined, teamId: number | null | undefined) => {
        if (team?.name) return team.name;
        if (!teamId) return '—';
        return `Team #${teamId}`;
    };

    const getScoringBadge = (system: string) => {
        const colors: Record<string, string> = {
            'side-out': 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400',
            'rally-point': 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-400',
        };
        return <Badge variant="outline" className={colors[system] ?? ''}>{system === 'side-out' ? 'Side Out' : 'Rally Point'}</Badge>;
    };

    const getStatusBadge = (status: Status | null | undefined) => {
        if (!status) return <Badge variant="outline">—</Badge>;
        const isActive = status.slug === 'active' || status.slug === 'approved';
        return (
            <Badge
                variant="outline"
                className={
                    isActive
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                        : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
                }
            >
                {isActive ? 'Active' : 'Inactive'}
            </Badge>
        );
    };

    return (
        <>
            <Head title="Umpire Dashboard" />

            {groupedAssignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                        <ShieldHalf className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h2 className="mt-4 text-xl font-semibold text-foreground">No court assignments</h2>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                        You haven't been assigned to any courts yet. Once an admin assigns you as an umpire to a court match, it will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {groupedAssignments.map((group) => (
                        <div key={group.configuration.id} className="space-y-4">
                            {/* Configuration Header */}
                            <div className="rounded-xl border border-border/70 bg-gradient-to-br from-background via-card to-red-500/15 p-5 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.35)]">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-400 shadow-md">
                                        <Activity className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg font-semibold text-foreground">{group.configuration.name}</h2>
                                            {getStatusBadge(group.configuration.status)}
                                        </div>
                                        <div className="mt-1 flex flex-wrap items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                {group.configuration.number_of_courts} court{group.configuration.number_of_courts > 1 ? 's' : ''}
                                            </span>
                                            {getScoringBadge(group.configuration.scoring_system)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Courts Grid */}
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {group.courts.map((match) => (
                                    <div
                                        key={match.id}
                                        className="group relative cursor-pointer rounded-lg border border-border/60 bg-gradient-to-br from-background to-muted/30 p-4 transition hover:border-red-500/30 hover:shadow-md"
                                        onClick={() => openMatchDetail(match)}
                                    >
                                        {/* Court Header */}
                                        <div className="mb-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-red-500/10 text-base font-bold text-red-600 dark:text-red-400">
                                                    {match.court_number}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-foreground">Court {match.court_number}</div>
                                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                                        {match.category && (
                                                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400 text-[10px] px-1.5 py-0">
                                                                {match.category.name}
                                                            </Badge>
                                                        )}
                                                        {match.category?.game_time ? (
                                                            <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-400 text-[10px] px-1.5 py-0">
                                                                <Clock className="mr-0.5 h-2.5 w-2.5" />
                                                                {match.category.game_time} mins
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                                                                No time limit
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {match.status && (
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                        {match.status.name}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Match Content */}
                                        <div className="space-y-2">
                                            {/* Team A */}
                                            <div className="flex items-center justify-between rounded-md bg-background py-1">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-bold text-blue-600 dark:text-blue-400">A</div>
                                                    <span className="truncate text-sm font-medium text-foreground">
                                                        {getTeamName(match.team_a, match.team_a_id)}
                                                    </span>
                                                    {match.serving_team === 'team_a' && (
                                                        <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-green-500 ring-1 ring-green-300" />
                                                    )}
                                                </div>
                                                <span className="ml-2 text-lg font-bold text-foreground">{match.team_a_score ?? 0}</span>
                                            </div>

                                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                                <span className="text-[10px] uppercase tracking-wider">vs</span>
                                            </div>

                                            {/* Team B */}
                                            <div className="flex items-center justify-between rounded-md bg-background py-1">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-[10px] font-bold text-purple-600 dark:text-purple-400">B</div>
                                                    <span className="truncate text-sm font-medium text-foreground">
                                                        {getTeamName(match.team_b, match.team_b_id)}
                                                    </span>
                                                    {match.serving_team === 'team_b' && (
                                                        <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-green-500 ring-1 ring-green-300" />
                                                    )}
                                                </div>
                                                <span className="ml-2 text-lg font-bold text-foreground">{match.team_b_score ?? 0}</span>
                                            </div>
                                        </div>

                                        {/* Click hint */}
                                        <div className="mt-2 text-center text-[10px] text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Click to manage match
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

UmpireDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/umpire/dashboard',
        },
    ],
};

