import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    ArrowLeft,
    ArrowRight,
    ClipboardList,
    Clock,
    Eye,
    GripVertical,
    LoaderCircle,
    Monitor,
    Pencil,
    Plus,
    Settings2,
    ShieldCheck,
    Trash2,
    ScanEye,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface Status {
    id: number;
    name: string;
    slug: string;
}

interface LiveConfigurationData {
    id: number;
    name: string;
    number_of_courts: number;
    scoring_system: string;
    game_to: number;
    allow_court_change: boolean;
    court_change_trigger: string;
    court_change_interval: number | null;
    game_time: string | null;
    game_interval: string | null;
    status: Status;
    created_at: string;
}

interface UmpireSummary {
    id: number;
    name: string;
    email: string;
    total_matches: number;
}

interface UmpireMatch {
    id: number;
    configuration: string;
    category: string;
    status: string | null;
    scheduled_at: string | null;
    started_at: string | null;
    ended_at: string | null;
    team_a_players: string[];
    team_b_players: string[];
    score: {
        team_a: number;
        team_b: number;
    };
    sets: {
        set_number: number;
        team_a_score: number;
        team_b_score: number;
    }[];
}

interface Props {
    configurations: LiveConfigurationData[];
}

export default function LiveConfiguration({ configurations }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<LiveConfigurationData | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [umpireDialogOpen, setUmpireDialogOpen] = useState(false);
    const [umpires, setUmpires] = useState<UmpireSummary[]>([]);
    const [selectedUmpire, setSelectedUmpire] = useState<UmpireSummary | null>(null);
    const [umpireMatches, setUmpireMatches] = useState<UmpireMatch[]>([]);
    const [isLoadingUmpires, setIsLoadingUmpires] = useState(false);
    const [isLoadingMatches, setIsLoadingMatches] = useState(false);
    const [umpireError, setUmpireError] = useState<string | null>(null);
    const [matchesError, setMatchesError] = useState<string | null>(null);

    useEffect(() => {
        if (!umpireDialogOpen) {
            return;
        }

        const controller = new AbortController();
        setIsLoadingUmpires(true);
        setUmpireError(null);

        fetch('/admin/live-configuration/umpire-statistics', {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('Unable to load umpire statistics.');
                }

                const data: { umpires: UmpireSummary[] } = await response.json();
                setUmpires(data.umpires);
            })
            .catch((error: unknown) => {
                if (!controller.signal.aborted) {
                    setUmpireError(error instanceof Error ? error.message : 'Unable to load umpire statistics.');
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsLoadingUmpires(false);
                }
            });

        return () => controller.abort();
    }, [umpireDialogOpen]);

    useEffect(() => {
        if (!umpireDialogOpen || !selectedUmpire) {
            return;
        }

        const controller = new AbortController();
        setIsLoadingMatches(true);
        setMatchesError(null);

        fetch(`/admin/live-configuration/umpires/${selectedUmpire.id}/matches`, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('Unable to load this umpire’s matches.');
                }

                const data: { matches: UmpireMatch[] } = await response.json();
                setUmpireMatches(data.matches);
            })
            .catch((error: unknown) => {
                if (!controller.signal.aborted) {
                    setMatchesError(error instanceof Error ? error.message : 'Unable to load this umpire’s matches.');
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsLoadingMatches(false);
                }
            });

        return () => controller.abort();
    }, [umpireDialogOpen, selectedUmpire]);

    const confirmDelete = (config: LiveConfigurationData) => {
        setDeleteTarget(config);
        setDeleteOpen(true);
    };

    const openUmpireDialog = () => {
        setSelectedUmpire(null);
        setUmpireMatches([]);
        setUmpireDialogOpen(true);
    };

    const executeDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/admin/live-configuration/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
                setDeleteTarget(null);
            },
        });
    };

    const getScoringBadge = (system: string) => {
        switch (system) {
            case 'side-out':
                return (
                    <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950/50 dark:text-gray-400">
                        Side Out
                    </Badge>
                );
            case 'rally-point':
                return (
                    <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950/50 dark:text-gray-400">
                        Rally Point
                    </Badge>
                );
            default:
                return <Badge variant="outline">{system}</Badge>;
        }
    };

    const getStatusBadge = (status: Status) => {
        const isActive = status.slug === 'active' || status.slug === 'approved';
        return (
            <Badge
                variant="outline"
                className={
                    isActive
                        ? 'text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                        : 'text-[10px] border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
                }
            >
                {isActive ? 'Active' : 'Inactive'}
            </Badge>
        );
    };

    return (
        <>
            <Head title="Live Configuration" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                {/* Header */}
                <div className="rounded-xl border border-border/70 bg-gradient-to-br from-background via-card to-red-500/15 p-6 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.35)]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400">
                                <Activity className="size-4" />
                                Match live configuration
                            </div>
                            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                                Live configuration
                            </h1>
                            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                                Manage live match configurations — set courts, scoring systems, game limits, and court change rules for each match.
                            </p>
                        </div>
                        <div className="rounded-md border border-border/70 bg-background/80 px-3 py-2 text-sm shadow-sm">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                                Total configurations
                            </div>
                            <div className="mt-1 text-lg font-semibold text-foreground">
                                {configurations.length}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add match button */}
                <div className="flex justify-end">
                    <Link href="/admin/live-configuration/create">
                        <Button className="inline-flex items-center gap-2">
                            <Plus className="size-4" />
                            Add match
                        </Button>
                    </Link>
                </div>

                {/* Configurations list */}
                <Card className="border-border/70 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.35)]">
                    <CardHeader className="flex flex-col gap-3 border-b border-border/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <span className="text-sm font-medium text-foreground">All match configurations</span>
                            <span className="ml-2 text-sm text-muted-foreground">({configurations.length})</span>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {configurations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Monitor className="mb-3 h-12 w-12 text-muted-foreground/40" />
                                <p className="text-base font-medium text-foreground">No match configurations yet</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Click "Add match" to create your first live match configuration.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {configurations.map((config) => (
                                    <div
                                        key={config.id}
                                        className="group flex flex-col gap-4 px-6 py-5 transition hover:bg-red/[0.02] sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        {/* Left: Info */}
                                        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
                                            {/* Icon + Name */}
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-gradient-to-br from-red-500/10 to-red-500/5">
                                                    <Settings2 className="h-5 w-5 text-red-500" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg font-semibold text-foreground">{config.name}</span>
                                                        {getStatusBadge(config.status)}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {/* Badges */}
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {getScoringBadge(config.scoring_system)}
                                                            {config.allow_court_change && (
                                                                <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950/50 dark:text-gray-400">
                                                                    Allowed Change Court
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="flex items-center gap-1.5">
                                            <Link href={`/admin/live-configuration/${config.id}`}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                        >
                                                            <ScanEye className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>View configuration</TooltipContent>
                                                </Tooltip>
                                            </Link>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                        onClick={openUmpireDialog}
                                                    >
                                                        <ClipboardList className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Umpire match history</TooltipContent>
                                            </Tooltip>

                                            <Link href={`/admin/live-configuration/${config.id}/edit`}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Edit configuration</TooltipContent>
                                                </Tooltip>
                                            </Link>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                        onClick={() => confirmDelete(config)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Delete configuration</TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete confirmation dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete configuration</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <span className="font-semibold text-foreground">{deleteTarget?.name}</span>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={executeDelete}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={umpireDialogOpen}
                onOpenChange={(open) => {
                    setUmpireDialogOpen(open);
                    if (!open) {
                        setSelectedUmpire(null);
                    }
                }}
            >
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
                    <DialogHeader>
                        {selectedUmpire && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="mb-2 w-fit"
                                onClick={() => {
                                    setSelectedUmpire(null);
                                    setUmpireMatches([]);
                                }}
                            >
                                <ArrowLeft className="mr-2 size-4" />
                                All umpires
                            </Button>
                        )}
                        <DialogTitle>
                            {selectedUmpire ? `${selectedUmpire.name}’s live matches` : 'Umpire match history'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedUmpire
                                ? `${selectedUmpire.total_matches} ${selectedUmpire.total_matches === 1 ? 'match' : 'matches'} umpired.`
                                : 'Select an umpire to view the matches they have officiated.'}
                        </DialogDescription>
                    </DialogHeader>

                    {!selectedUmpire && (
                        <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Umpire</th>
                                        <th className="px-4 py-3 font-medium">Email</th>
                                        <th className="px-4 py-3 text-right font-medium">Matches umpired</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {isLoadingUmpires ? (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">
                                                <LoaderCircle className="mr-2 inline size-4 animate-spin" />
                                                Loading umpires…
                                            </td>
                                        </tr>
                                    ) : umpireError ? (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-10 text-center text-destructive">
                                                {umpireError}
                                            </td>
                                        </tr>
                                    ) : umpires.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">
                                                No umpires found.
                                            </td>
                                        </tr>
                                    ) : (
                                        umpires.map((umpire) => (
                                            <tr key={umpire.id} className="transition-colors hover:bg-muted/40">
                                                <td className="px-4 py-3">
                                                    <Button
                                                        type="button"
                                                        variant="link"
                                                        className="h-auto p-0 font-medium"
                                                        onClick={() => setSelectedUmpire(umpire)}
                                                    >
                                                        {umpire.name}
                                                    </Button>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{umpire.email}</td>
                                                <td className="px-4 py-3 text-right font-semibold">{umpire.total_matches}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {selectedUmpire && (
                        <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Configuration / category</th>
                                        <th className="px-4 py-3 font-medium">Players</th>
                                        <th className="px-4 py-3 text-center font-medium">Score</th>
                                        <th className="px-4 py-3 font-medium">Date</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {isLoadingMatches ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                                                <LoaderCircle className="mr-2 inline size-4 animate-spin" />
                                                Loading matches…
                                            </td>
                                        </tr>
                                    ) : matchesError ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-10 text-center text-destructive">
                                                {matchesError}
                                            </td>
                                        </tr>
                                    ) : umpireMatches.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                                                No live matches found for this umpire.
                                            </td>
                                        </tr>
                                    ) : (
                                        umpireMatches.map((match) => (
                                            <tr key={match.id}>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">{match.configuration}</div>
                                                    <div className="text-xs text-muted-foreground">{match.category}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>{match.team_a_players.join(' / ') || 'Team A'}</div>
                                                    <div className="text-muted-foreground">{match.team_b_players.join(' / ') || 'Team B'}</div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="font-semibold tabular-nums">
                                                        {match.score.team_a} – {match.score.team_b}
                                                    </div>
                                                    {match.sets.length > 0 && (
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            {match.sets
                                                                .map((set) => `${set.team_a_score}-${set.team_b_score}`)
                                                                .join(', ')}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                                                    {match.scheduled_at ? new Date(match.scheduled_at).toLocaleString() : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{match.status ?? '—'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

LiveConfiguration.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Live Configuration',
            href: '/admin/live-configuration',
        },
    ],
};
