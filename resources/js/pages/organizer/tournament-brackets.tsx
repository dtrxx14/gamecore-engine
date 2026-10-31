import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { buildTournamentSchedule } from '@/lib/tournament-schedule';
import type { ScheduleItem } from '@/lib/tournament-schedule';

type Participant = {
    name: string;
    seed: number | null;
};

type BracketSlot = {
    match_label: string;
    name: string;
    participants: Participant[];
    winner_label: string;
};

type BracketRound = {
    label: string;
    match_count: number;
    slots: BracketSlot[];
};

type PoolInfo = {
    label: string;
    teams: { name: string; seed: number }[];
    matches: BracketSlot[];
    advance_count: number;
};

type BracketStage = {
    stage_index: number;
    round_format: string;
    competition_format: string;
    label: string;
    pool_count: number;
    advance_per_pool: number;
    placement_slots: number;
    teams_per_pool: number;
    pools: PoolInfo[];
    ranked_teams?: RankedTeam[];
    elimination_tree: BracketRound[] | { winners: BracketRound[]; losers: BracketRound[]; grand_final: BracketRound };
};

type RankedTeam = {
    rank: number;
    name: string;
    wins: number;
    losses: number;
    point_differential: number;
};

type CategoryFormat = {
    id: number;
    round_format: string;
    competition_format: string;
    scoring_format: string;
    series_format: string;
    point_system: string;
    game_to?: number | null;
    win_by?: number | null;
    game_time?: number | null;
    pool_count?: number | null;
    advance_per_pool?: number | null;
allow_draw?: boolean;
    allow_wildcard?: boolean;
    allow_court_change?: boolean;
    court_change_trigger?: 'none' | 'rally_count' | 'score_count' | 'game_end' | 'match_end';
    court_change_interval?: number | null;
};

type Category = {
    id: number;
    name: string;
    division?: string | null;
    description?: string | null;
    entry_fee?: string | null;
    currency?: string | null;
    team_type?: string | null;
    min_players?: number | null;
    max_players?: number | null;
    registrations_count: number;
    formats: CategoryFormat[];
    bracket_stages: BracketStage[];
};

type Tournament = {
    id: number;
    title: string;
    start_date?: string | null;
    description?: string | null;
    settings: {
        start_time_in_hours: string;
        end_time_in_hours: string;
        default_match_duration_minutes: number;
        default_rest_time_minutes: number;
        default_court_counts: number;
    };
};

type Props = {
    tournament: Tournament;
    categories: Category[];
};

const getFormatBadgeColor = (format: string) => {
    switch (format) {
        case 'single-elimination': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        case 'double-elimination': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
        case 'round-robin': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        case 'swiss-system': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
        default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
};

const formatScheduleTime = (value: Date): string =>
    value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const formatScheduleDateTime = (value: Date): string =>
    `${value.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} ${formatScheduleTime(value)}`;

const formatDuration = (minutes: number): string => {
    const days = Math.floor(minutes / (60 * 24));
    const hours = Math.floor((minutes % (60 * 24)) / 60);
    const remainingMinutes = minutes % 60;
    const parts = [
        days > 0 ? `${days}d` : null,
        hours > 0 ? `${hours}h` : null,
        remainingMinutes > 0 || (days === 0 && hours === 0) ? `${remainingMinutes}m` : null,
    ].filter(Boolean);

    return parts.join(' ');
};

const hasMatchOutsideDailyHours = (schedule: ScheduleItem[], tournament: Tournament): boolean => {
    const [openingHour = 9, openingMinute = 0] = tournament.settings.start_time_in_hours.split(':').map(Number);
    const [closingHour = 22, closingMinute = 0] = tournament.settings.end_time_in_hours.split(':').map(Number);
    const openingMinutes = openingHour * 60 + openingMinute;
    const closingMinutes = closingHour * 60 + closingMinute;

    return schedule.some((item) => {
        const closesAt = new Date(item.start);
        closesAt.setHours(closingHour, closingMinute, 0, 0);

        if (closingMinutes <= openingMinutes) {
            closesAt.setDate(closesAt.getDate() + 1);
        }

        return item.end > closesAt;
    });
};

const getCalendarDaysSpanned = (start: Date, finish: Date): number => {
    const startDate = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const finishDate = Date.UTC(finish.getFullYear(), finish.getMonth(), finish.getDate());

    return Math.floor((finishDate - startDate) / 86_400_000) + 1;
};

// ─── Match Card ─────────────────────────────────────────────────────────────

function MatchCard({ slot }: { slot: BracketSlot }) {
    const top = slot.participants[0];
    const bottom = slot.participants[1];
    return (
        <div className="relative flex w-56 flex-shrink-0 flex-col rounded-lg border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                    {top?.seed ?? '?'}
                </span>
                <span className="line-clamp-2 text-xs font-medium" title={top?.name}>{top?.name ?? 'TBA'}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                    {bottom?.seed ?? '?'}
                </span>
                <span className="line-clamp-2 text-xs font-medium" title={bottom?.name}>{bottom?.name ?? 'TBA'}</span>
            </div>
            <div className="absolute -top-2 left-2 rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                {slot.match_label}
            </div>
        </div>
    );
}

// ─── Bracket Tree ───────────────────────────────────────────────────────────

function BracketTreeRounds({ rounds }: { rounds: BracketRound[] }) {
    if (!rounds || rounds.length === 0) return null;
    return (
        <div className="overflow-x-auto pb-4">
            <div className="flex items-start gap-6 min-w-max">
                {rounds.map((round, i) => (
                    <div key={round.label} className="flex flex-col">
                        <div className="mb-3 text-center">
                            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{round.label}</div>
                            <div className="text-[10px] text-muted-foreground/60">{round.match_count} match{round.match_count > 1 ? 'es' : ''}</div>
                        </div>
                        <div className="flex flex-col">
                            {round.slots.map((slot, j) => (
                                <div key={j} className="flex items-center"
                                    style={{
                                        paddingTop: j === 0 ? `${(Math.pow(2, i) - 1) * 12}px` : undefined,
                                        paddingBottom: j === round.slots.length - 1 ? undefined : `${Math.pow(2, i) * 12}px`,
                                    }}
                                >
                                    <MatchCard slot={slot} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Pool View ──────────────────────────────────────────────────────────────

function PoolCard({ pool, poolIndex }: { pool: PoolInfo; poolIndex: number }) {
    return (
        <div className="rounded-lg border bg-background">
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
                <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {String.fromCharCode(65 + poolIndex)}
                    </span>
                    <span className="text-sm font-semibold">{pool.label}</span>
                    <span className="text-[10px] text-muted-foreground">({pool.teams.length} teams, top {pool.advance_count} advance)</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 border-b px-4 py-3">
                {pool.teams.map((team) => (
                    <div key={team.seed} className="flex items-center gap-2 rounded-md bg-card px-2.5 py-1.5 text-xs">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-primary/10 text-[9px] font-bold text-primary">{team.seed}</span>
                        <span className="truncate font-medium">{team.name}</span>
                    </div>
                ))}
            </div>
            {pool.matches.length > 0 && (
                <div className="px-4 py-3">
                    <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Round-Robin Matches</div>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                        {pool.matches.map((match, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-md border bg-card px-3 py-2">
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                        <span className="text-[11px] font-medium">{match.participants[0]?.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                        <span className="text-[11px] font-medium">{match.participants[1]?.name}</span>
                                    </div>
                                </div>
                                <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] text-muted-foreground">{match.match_label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Stage Renderers ────────────────────────────────────────────────────────

function RoundRobinStage({ stage }: { stage: BracketStage }) {
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
                <span>{stage.pool_count} pool{stage.pool_count > 1 ? 's' : ''}</span>
                <span className="text-muted-foreground/30">|</span>
                <span>{stage.teams_per_pool} teams per pool</span>
                <span className="text-muted-foreground/30">|</span>
                <span>Top {stage.advance_per_pool} advance from each pool</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {stage.pools.map((pool, idx) => (
                    <PoolCard key={pool.label} pool={pool} poolIndex={idx} />
                ))}
            </div>

            {stage.ranked_teams && stage.ranked_teams.length > 0 && (
                <div className="rounded-lg border bg-background p-4">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preliminary ranking</div>
                    <div className="overflow-x-auto">
                        <div className="min-w-[420px] overflow-hidden rounded-md border text-xs">
                            <div className="grid grid-cols-[48px_minmax(180px,1fr)_70px_70px_90px] gap-2 bg-muted/40 px-3 py-2 font-semibold text-muted-foreground">
                                <span>#</span><span>Qualifier</span><span>Wins</span><span>Losses</span><span>Point diff.</span>
                            </div>
                            {stage.ranked_teams.map((team) => (
                                <div key={team.rank} className="grid grid-cols-[48px_minmax(180px,1fr)_70px_70px_90px] gap-2 border-t px-3 py-2">
                                    <span className="font-semibold">{team.rank}</span>
                                    <span className="truncate">{team.name}</span>
                                    <span>{team.wins}</span>
                                    <span>{team.losses}</span>
                                    <span>{team.point_differential > 0 ? '+' : ''}{team.point_differential}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">Ranking order uses wins, then losses, then point differential. Results will replace these sample values.</p>
                </div>
            )}

            {Array.isArray(stage.elimination_tree) && stage.elimination_tree.length > 0 && (
                <div className="rounded-lg border bg-background p-4">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Elimination Bracket</div>
                    <BracketTreeRounds rounds={stage.elimination_tree as BracketRound[]} />
                </div>
            )}
        </div>
    );
}

function SingleEliminationStage({ stage }: { stage: BracketStage }) {
    const rounds = stage.elimination_tree as BracketRound[];
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
                <span>{stage.placement_slots} slots</span>
                <span className="text-muted-foreground/30">|</span>
                <span>Single Elimination</span>
            </div>
            <div className="rounded-lg border bg-background p-4">
                <BracketTreeRounds rounds={rounds} />
            </div>
        </div>
    );
}

function DoubleEliminationStage({ stage }: { stage: BracketStage }) {
    const tree = stage.elimination_tree as { winners: BracketRound[]; losers: BracketRound[]; grand_final: BracketRound };
    const [view, setView] = useState<'winners' | 'losers' | 'final'>('winners');

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
                <span>{stage.placement_slots} slots</span>
                <span className="text-muted-foreground/30">|</span>
                <span>Double Elimination</span>
            </div>
            <div className="flex gap-1 rounded-lg border bg-muted/20 p-1">
                {(['winners', 'losers', 'final'] as const).map((v) => (
                    <button key={v} onClick={() => setView(v)}
                        className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                            view === v ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}>
                        {v === 'winners' ? 'Winners' : v === 'losers' ? 'Losers' : 'Grand Final'}
                    </button>
                ))}
            </div>
            {view === 'winners' && tree.winners && <div className="rounded-lg border bg-background p-4"><BracketTreeRounds rounds={tree.winners} /></div>}
            {view === 'losers' && tree.losers && <div className="rounded-lg border bg-background p-4"><BracketTreeRounds rounds={tree.losers} /></div>}
            {view === 'final' && tree.grand_final && (
                <div className="rounded-lg border bg-background p-4">
                    <div className="flex justify-center">
                        {tree.grand_final.slots?.map((slot, idx) => (
                            <div key={idx} className="flex w-64 flex-col rounded-xl border-2 border-amber-200 bg-gradient-to-b from-amber-50 to-card p-4 shadow-lg dark:border-amber-800 dark:from-amber-950/20">
                                <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">{slot.match_label}</div>
                                <div className="space-y-1">
                                    {slot.participants.map((p, pi) => (
                                        <div key={pi} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium">
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-amber-100 text-[9px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{pi === 0 ? 'W' : 'L'}</span>
                                            <span className="truncate">{p.name}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 border-t border-dashed pt-2 text-center text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">🏆 {slot.winner_label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function SwissSystemStage({ stage }: { stage: BracketStage }) {
    const rounds = stage.elimination_tree as BracketRound[];
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
                <span>Swiss System</span>
                <span className="text-muted-foreground/30">|</span>
                <span>{rounds.length} rounds</span>
                <span className="text-muted-foreground/30">|</span>
                <span>{stage.placement_slots} participants</span>
            </div>
            <BracketTreeRounds rounds={rounds} />
        </div>
    );
}

function StageRenderer({ stage }: { stage: BracketStage }) {
    switch (stage.competition_format) {
        case 'round-robin': return <RoundRobinStage stage={stage} />;
        case 'single-elimination': return <SingleEliminationStage stage={stage} />;
        case 'double-elimination': return <DoubleEliminationStage stage={stage} />;
        case 'swiss-system': return <SwissSystemStage stage={stage} />;
        default: return (
            <div className="rounded-lg border bg-background p-4">
                <BracketTreeRounds rounds={stage.elimination_tree as BracketRound[]} />
            </div>
        );
    }
}

function SchedulePanel({
    category,
    categorySchedule,
    schedule,
    tournament,
}: {
    category: Category;
    categorySchedule: ScheduleItem[];
    schedule: ScheduleItem[];
    tournament: Tournament;
}) {
    const start = schedule[0]?.start;
    const finish = schedule.reduce<Date | undefined>(
        (latest, item) => !latest || item.end > latest ? item.end : latest,
        undefined,
    );
    const totalMinutes = start && finish ? Math.ceil((finish.getTime() - start.getTime()) / 60_000) : 0;
    const playingMinutes = schedule.reduce((total, item) => total + item.durationMinutes, 0);
    const daysSpanned = start && finish ? getCalendarDaysSpanned(start, finish) : 0;
    const runsPastHours = hasMatchOutsideDailyHours(schedule, tournament);
    const categoryStart = categorySchedule[0]?.start;
    const categoryCallTime = categoryStart
        ? new Date(categoryStart.getTime() - 60 * 60_000)
        : undefined;
    const categoryFinish = categorySchedule.reduce<Date | undefined>(
        (latest, item) => !latest || item.end > latest ? item.end : latest,
        undefined,
    );

    return (
        <div className="mt-5 rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Estimated tournament schedule</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Earlier rounds in each category get priority on all courts. The next category can begin 30 minutes after the prior category reaches quarterfinals, or semifinals when there are no quarterfinals, if a court is free.
                        All players in a category are called together one hour before its first match.
                    </p>
                </div>
                <div className={`rounded-lg border px-3 py-2 text-sm ${runsPastHours ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200' : 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'}`}>
                    {runsPastHours ? 'A match exceeds the daily hours' : `Fits daily hours${daysSpanned > 1 ? ` across ${daysSpanned} days` : ''}`}
                </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 lg:grid-cols-4">
                <div className="rounded-lg bg-background px-3 py-2"><div className="text-muted-foreground">Matches</div><div className="mt-1 font-semibold">{schedule.length}</div></div>
                <div className="rounded-lg bg-background px-3 py-2"><div className="text-muted-foreground">Courts</div><div className="mt-1 font-semibold">{tournament.settings.default_court_counts}</div></div>
                <div className="rounded-lg bg-background px-3 py-2"><div className="text-muted-foreground">Starts</div><div className="mt-1 font-semibold">{start ? formatScheduleDateTime(start) : '—'}</div></div>
                <div className="rounded-lg bg-background px-3 py-2"><div className="text-muted-foreground">Total elapsed</div><div className="mt-1 font-semibold">{formatDuration(totalMinutes)}</div></div>
                <div className="rounded-lg bg-background px-3 py-2"><div className="text-muted-foreground">Playing time</div><div className="mt-1 font-semibold">{formatDuration(playingMinutes)}</div></div>
                <div className="rounded-lg bg-background px-3 py-2"><div className="text-muted-foreground">Tournament days</div><div className="mt-1 font-semibold">{daysSpanned || '—'}</div></div>
                <div className="rounded-lg bg-background px-3 py-2"><div className="text-muted-foreground">Projected finish</div><div className="mt-1 font-semibold">{finish ? formatScheduleDateTime(finish) : '—'}</div></div>
            </div>
            {runsPastHours && (
                <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                    At least one match duration exceeds the configured daily playing window ending at {tournament.settings.end_time_in_hours}.
                </p>
            )}
            {categorySchedule.length > 0 && (
                <div className="mt-5 border-t pt-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="text-sm font-semibold">{category.name} calling times</div>
                            <p className="mt-1 text-xs text-muted-foreground">One calling time for all players in this category.</p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                            <div className="rounded-lg bg-background px-3 py-2">
                                <span className="text-muted-foreground">All players call by: </span>
                                <span className="font-semibold">{categoryCallTime ? formatScheduleDateTime(categoryCallTime) : '—'}</span>
                            </div>
                            <div className="rounded-lg bg-background px-3 py-2">
                                <span className="text-muted-foreground">Category starts: </span>
                                <span className="font-semibold">{categoryStart ? formatScheduleDateTime(categoryStart) : '—'}</span>
                            </div>
                            <div className="rounded-lg bg-background px-3 py-2">
                                <span className="text-muted-foreground">Category finish: </span>
                                <span className="font-semibold">{categoryFinish ? formatScheduleDateTime(categoryFinish) : '—'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 overflow-x-auto">
                        <div className="min-w-[740px] overflow-hidden rounded-lg border bg-background">
                            <div className="grid grid-cols-[170px_80px_minmax(200px,1fr)_100px_90px] gap-4 border-b bg-muted/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                <span>Match time</span><span>Court</span><span>Match</span><span>Stage</span><span>Duration</span>
                            </div>
                            {categorySchedule.map((item) => (
                                <div key={item.id} className="grid grid-cols-[170px_80px_minmax(200px,1fr)_100px_90px] gap-4 border-b px-3 py-2 text-xs last:border-b-0">
                                    <span className="font-semibold text-nowrap">{formatScheduleDateTime(item.start)}–{formatScheduleTime(item.end)}</span>
                                    <span className="text-muted-foreground">Court {item.court}</span>
                                    <span className="min-w-0 truncate" title={item.participants.join(' vs ')}>{item.participants.join(' vs ')}</span>
                                    <span className="truncate text-muted-foreground">{item.stage}</span>
                                    <span className="text-muted-foreground">{item.durationMinutes} min</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function TournamentBracketsPage({ tournament, categories }: Props) {
    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(
        categories.length > 0 ? categories[0].id : null
    );
    const [activeStageIndex, setActiveStageIndex] = useState(0);
    const activeCategory = categories.find((c) => c.id === activeCategoryId) || categories[0];
    const tournamentSchedule = useMemo(
        () => buildTournamentSchedule(categories, tournament),
        [categories, tournament],
    );
    const activeCategorySchedule = tournamentSchedule.filter((item) => item.categoryId === activeCategory?.id);

    // Reset stage index when category changes
    const handleCategoryChange = (id: number) => {
        setActiveCategoryId(id);
        setActiveStageIndex(0);
    };

    const handleStageChange = (stageIndex: number) => {
        setActiveStageIndex(stageIndex);
        document.getElementById(`bracket-stage-${activeCategory?.id}-${stageIndex}`)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    };

    const activeStage = activeCategory?.bracket_stages?.[activeStageIndex] ?? null;

    return (
        <>
            <Head title={`${tournament.title} Brackets`} />
            <div className="space-y-6">
                {/* Header */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Tournament bracket view</div>
                            <h2 className="text-2xl font-semibold">{tournament.title}</h2>
                            <p className="mt-2 text-sm text-muted-foreground">{tournament.description || 'No tournament description.'}</p>
                        </div>
                        <div className="rounded-lg border bg-background px-4 py-3 text-sm">
                            <div className="font-semibold">Start date</div>
                            <div className="text-muted-foreground">{tournament.start_date || 'Not set'}</div>
                        </div>
                    </div>
                </div>

                {categories.length === 0 ? (
                    <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
                        No categories were saved for this tournament yet.
                    </div>
                ) : (
                    <>
                        {/* Category Tabs */}
                        {categories.length > 1 && (
                            <div className="flex flex-wrap gap-2">
                                {categories.map((category) => {
                                    const fmt = category.formats[0];
                                    return (
                                        <button key={category.id} onClick={() => handleCategoryChange(category.id)}
                                            className={`rounded-lg border px-4 py-2 text-left text-sm transition-all ${
                                                activeCategoryId === category.id ? 'border-primary/50 bg-primary/5 shadow-sm' : 'hover:bg-accent/50'
                                            }`}>
                                            <div className="text-base font-semibold">{category.name} <span className="text-[10px] text-muted-foreground/60">{category.division}</span> </div>
                                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                <span className="text-[10px] text-muted-foreground">{category.registrations_count || category.min_players || '?'} {category.registrations_count > 0 ? 'registered' : 'min'}</span>
                                                {fmt && (
                                                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${getFormatBadgeColor(fmt.competition_format)}`}>
                                                        {fmt.competition_format}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Active Category */}
                        {activeCategory && (
                            <section className="rounded-xl border bg-card p-5 shadow-sm">
                                {/* Category Header */}
                                <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold">{activeCategory.name}</h3>
                                        <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                                            <span>{activeCategory.division || 'Unassigned division'}</span>
                                            <span className="text-muted-foreground/30">•</span>
                                            <span>{activeCategory.registrations_count || activeCategory.min_players || 0} team{(activeCategory.registrations_count || activeCategory.min_players || 0) > 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stage Tabs (for multiple formats in this category) */}
                                {activeCategory.bracket_stages && activeCategory.bracket_stages.length > 1 && (
                                    <div className="flex flex-wrap gap-1.5 mt-4">
                                        {activeCategory.bracket_stages.map((stage, idx) => (
                                            <button key={idx} onClick={() => handleStageChange(idx)}
                                                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                                                    activeStageIndex === idx ? 'border-primary/40 bg-primary/5 shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                                                }`}>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`inline-block h-2 w-2 rounded-full ${getFormatBadgeColor(stage.competition_format).split(' ')[0]}`} />
                                                    <span>{stage.label}</span>
                                                </div>
                                                <div className="text-[9px] text-muted-foreground/60 mt-0.5">
                                                    {stage.competition_format} • {stage.pool_count} pool{stage.pool_count > 1 ? 's' : ''}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Stage Content */}
                                <div className="mt-4 space-y-4">
                                    {activeStage ? (
                                        <div id={`bracket-stage-${activeCategory.id}-${activeStage.stage_index}`} className="scroll-mt-6 rounded-xl border bg-background p-4">
                                            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                <span className="font-semibold uppercase tracking-wider">{activeStage.label}</span>
                                                <span className="text-muted-foreground/30">|</span>
                                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${getFormatBadgeColor(activeStage.competition_format)}`}>
                                                    {activeStage.competition_format}
                                                </span>
                                                <span className="text-muted-foreground/30">|</span>
                                                <span>{activeStage.pool_count} pool{activeStage.pool_count > 1 ? 's' : ''}</span>
                                                {activeStage.advance_per_pool > 0 && (
                                                    <>
                                                        <span className="text-muted-foreground/30">|</span>
                                                        <span>{activeStage.advance_per_pool} advance per pool</span>
                                                    </>
                                                )}
                                            </div>
                                            <StageRenderer stage={activeStage} />
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-dashed bg-background p-8 text-center text-sm text-muted-foreground">
                                            No bracket stages configured for this category.
                                        </div>
                                    )}
                                </div>
                                {activeCategory && activeCategorySchedule.length > 0 && (
                                    <SchedulePanel
                                        category={activeCategory}
                                        categorySchedule={activeCategorySchedule}
                                        schedule={tournamentSchedule}
                                        tournament={tournament}
                                    />
                                )}
                            </section>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
