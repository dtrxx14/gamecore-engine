import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Clock,
    Pencil,
    Plus,
    Swords,
    Trash2,
    Trophy,
    UserRound,
    Users,
    Settings2,
    Tags,
    Target,
    Play,
    Hourglass,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PlayerSearchInput from '@/components/ui/player-search-input';

interface Status {
    id: number;
    name: string;
    slug: string;
}

interface LiveCategory {
    id: number;
    live_configuration_id: number;
    name: string;
    game_to: number;
    game_time: string | null;
    game_interval: string | null;
}

interface LiveTeam {
    id: number;
    name: string;
    category_id: number | null;
    player_ids: number[];
    category?: LiveCategory | null;
    created_at: string;
}

interface LiveMatchScore {
    id: number;
    live_configuration_id: number;
    court_number: number;
    category_id: number | null;
    next_category_id: number | null;
    team_a_id: number | null;
    team_b_id: number | null;
    team_a_score: number;
    team_b_score: number;
    serving_team: 'team_a' | 'team_b' | null;
    next_team_a_id: number | null;
    next_team_b_id: number | null;
    umpire_id: number | null;
    status_id: number;
    team_a?: LiveTeam | null;
    team_b?: LiveTeam | null;
    next_team_a?: LiveTeam | null;
    next_team_b?: LiveTeam | null;
    umpire?: Player | null;
    status?: Status | null;
    category?: LiveCategory | null;
    nextCategory?: LiveCategory | null;
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
    status: Status | null;
    match_scores: LiveMatchScore[];
    categories: LiveCategory[];
}

interface Player {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
}

interface Standing {
    id: number;
    live_configuration_id: number;
    category_id: number;
    team_id: number;
    matches_played: number;
    wins: number;
    losses: number;
    points_for: number;
    points_against: number;
    point_differential: number;
    team?: LiveTeam | null;
    category?: LiveCategory | null;
}

interface Props {
    configuration: LiveConfigurationData;
    teams: LiveTeam[];
    statuses: Status[];
    players: Player[];
    umpires: Player[];
    standings: Record<string, Standing[]>;
}

export default function LiveConfigurationShow({ configuration, teams, statuses, players, umpires, standings }: Props) {
    // ---- Category state ----
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<LiveCategory | null>(null);
    const [categoryForm, setCategoryForm] = useState({ name: '', game_to: '21', game_time: '', game_interval: '' });
    const [categoryErrors, setCategoryErrors] = useState<Record<string, string>>({});

    // ---- Team state ----
    const [teamModalOpen, setTeamModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<LiveTeam | null>(null);
    const [teamForm, setTeamForm] = useState({ name: '', category_id: '', player_ids: '' });
    const [teamErrors, setTeamErrors] = useState<Record<string, string>>({});
    const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);

    // ---- Accordion state ----
    const [categoriesOpen, setCategoriesOpen] = useState(true);
    const [teamsOpen, setTeamsOpen] = useState(true);
    const [standingsOpen, setStandingsOpen] = useState(true);

    // ---- Court state ----
    const [courtModalOpen, setCourtModalOpen] = useState(false);
    const [activeCourt, setActiveCourt] = useState<number | null>(null);
    const [courtForm, setCourtForm] = useState({
        category_id: '',
        next_category_id: '',
        team_a_id: '',
        team_b_id: '',
        next_team_a_id: '',
        next_team_b_id: '',
        umpire_id: '',
        status_id: '27',
    });
    const [courtErrors, setCourtErrors] = useState<Record<string, string>>({});

    // ---- Remove confirmations ----
    const [removeCourtTarget, setRemoveCourtTarget] = useState<LiveMatchScore | null>(null);
    const [removeCourtOpen, setRemoveCourtOpen] = useState(false);
    const [removeTeamTarget, setRemoveTeamTarget] = useState<LiveTeam | null>(null);
    const [removeTeamOpen, setRemoveTeamOpen] = useState(false);
    const [removeCategoryTarget, setRemoveCategoryTarget] = useState<LiveCategory | null>(null);
    const [removeCategoryOpen, setRemoveCategoryOpen] = useState(false);

    const activeStatus = statuses.find((s) => s.slug === 'active');

    // ---- Derived data ----
    const selectedCategoryId = courtForm.category_id ? Number(courtForm.category_id) : null;
    const selectedNextCategoryId = courtForm.next_category_id ? Number(courtForm.next_category_id) : null;
    const selectedTeamAId = courtForm.team_a_id ? Number(courtForm.team_a_id) : null;
    const selectedTeamBId = courtForm.team_b_id ? Number(courtForm.team_b_id) : null;
    const selectedNextAId = courtForm.next_team_a_id ? Number(courtForm.next_team_a_id) : null;
    const selectedNextBId = courtForm.next_team_b_id ? Number(courtForm.next_team_b_id) : null;

    // Filter teams by the selected category
    const teamsInSelectedCategory = selectedCategoryId
        ? teams.filter((t) => t.category_id === selectedCategoryId)
        : teams;

    // Filter teams by the selected next category
    const teamsInNextCategory = selectedNextCategoryId
        ? teams.filter((t) => t.category_id === selectedNextCategoryId)
        : teams;

    // Team dropdown filters (prevent duplicates)
    const teamsForTeamB = teamsInSelectedCategory.filter((t) => t.id !== selectedTeamAId);
    // Next team dropdowns: Next A shows all teams, Next B excludes the chosen Next A team
    const teamsForNextA = teamsInNextCategory;
    const teamsForNextB = teamsInNextCategory.filter((t) => t.id !== selectedNextAId);

    // Collect all player IDs already assigned to other teams (excluding the team being edited)
    const getUnavailablePlayerIds = (editingTeamId?: number | null) => {
        const ids = new Set<number>();
        teams.forEach((t) => {
            if (t.id === editingTeamId) return;
            t.player_ids?.forEach((pid) => ids.add(pid));
        });
        return Array.from(ids);
    };

    // =====================
    // Category Handlers
    // =====================

    const openCategoryModal = (category?: LiveCategory) => {
        if (category) {
            setEditingCategory(category);
            setCategoryForm({
                name: category.name,
                game_to: String(category.game_to),
                game_time: category.game_time ?? '',
                game_interval: category.game_interval ?? '',
            });
        } else {
            setEditingCategory(null);
            setCategoryForm({ name: '', game_to: '21', game_time: '', game_interval: '' });
        }
        setCategoryErrors({});
        setCategoryModalOpen(true);
    };

    const saveCategory = () => {
        const errs: Record<string, string> = {};
        if (!categoryForm.name.trim()) errs.name = 'Category name is required.';
        if (!categoryForm.game_to || Number(categoryForm.game_to) < 1) errs.game_to = 'Game to value is required.';
        if (Object.keys(errs).length > 0) { setCategoryErrors(errs); return; }

        const payload = {
            ...categoryForm,
            game_to: Number(categoryForm.game_to),
            game_time: categoryForm.game_time || null,
            game_interval: categoryForm.game_interval || null,
        };

        if (editingCategory) {
            router.put(`/admin/live-configuration/categories/${editingCategory.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => setCategoryModalOpen(false),
            });
        } else {
            router.post('/admin/live-configuration/categories', {
                ...payload,
                live_configuration_id: configuration.id,
            }, {
                preserveScroll: true,
                onSuccess: () => setCategoryModalOpen(false),
            });
        }
    };

    const confirmDeleteCategory = (category: LiveCategory) => {
        setRemoveCategoryTarget(category);
        setRemoveCategoryOpen(true);
    };

    const executeDeleteCategory = () => {
        if (!removeCategoryTarget) return;
        router.delete(`/admin/live-configuration/categories/${removeCategoryTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => { setRemoveCategoryOpen(false); setRemoveCategoryTarget(null); },
        });
    };

    // =====================
    // Team Handlers
    // =====================

    const openTeamModal = (team?: LiveTeam) => {
        if (team) {
            setEditingTeam(team);
            setTeamForm({
                name: team.name,
                category_id: String(team.category_id ?? ''),
                player_ids: (team.player_ids ?? []).join(', '),
            });
            const teamPlayers = players.filter((p) => team.player_ids?.includes(p.id));
            setSelectedPlayers(teamPlayers);
        } else {
            setEditingTeam(null);
            setTeamForm({ name: '', category_id: '', player_ids: '' });
            setSelectedPlayers([]);
        }
        setTeamErrors({});
        setTeamModalOpen(true);
    };

    const saveTeam = () => {
        const errs: Record<string, string> = {};
        if (!teamForm.name.trim()) errs.name = 'Team name is required.';
        if (Object.keys(errs).length > 0) { setTeamErrors(errs); return; }

        const playerIds = selectedPlayers.map((p) => p.id);
        const payload = {
            name: teamForm.name,
            category_id: teamForm.category_id ? Number(teamForm.category_id) : null,
            player_ids: playerIds,
        };

        if (editingTeam) {
            router.put(`/admin/live-configuration/teams/${editingTeam.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => setTeamModalOpen(false),
            });
        } else {
            router.post('/admin/live-configuration/teams', payload, {
                preserveScroll: true,
                onSuccess: () => setTeamModalOpen(false),
            });
        }
    };

    const confirmDeleteTeam = (team: LiveTeam) => {
        setRemoveTeamTarget(team);
        setRemoveTeamOpen(true);
    };

    const executeDeleteTeam = () => {
        if (!removeTeamTarget) return;
        router.delete(`/admin/live-configuration/teams/${removeTeamTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => { setRemoveTeamOpen(false); setRemoveTeamTarget(null); },
        });
    };

    // =====================
    // Court Handlers
    // =====================

    const openCourtModal = (courtNumber: number, existing?: LiveMatchScore) => {
        setActiveCourt(courtNumber);
        setCourtErrors({});
        if (existing) {
            setCourtForm({
                category_id: String(existing.category_id ?? ''),
                next_category_id: String(existing.next_category_id ?? ''),
                team_a_id: String(existing.team_a_id ?? ''),
                team_b_id: String(existing.team_b_id ?? ''),
                next_team_a_id: String(existing.next_team_a_id ?? ''),
                next_team_b_id: String(existing.next_team_b_id ?? ''),
                umpire_id: String((existing as any).umpire_id ?? ''),
                status_id: String(existing.status_id ?? activeStatus?.id ?? '27'),
            });
        } else {
            setCourtForm({ category_id: '', next_category_id: '', team_a_id: '', team_b_id: '', next_team_a_id: '', next_team_b_id: '', umpire_id: '', status_id: String(activeStatus?.id ?? '27') });
        }
        setCourtModalOpen(true);
    };

    const saveCourtMatch = () => {
        const errs: Record<string, string> = {};
        if (!courtForm.status_id) errs.status_id = 'Status is required.';

        const categoryId = courtForm.category_id ? Number(courtForm.category_id) : null;
        const teamA = courtForm.team_a_id ? Number(courtForm.team_a_id) : null;
        const teamB = courtForm.team_b_id ? Number(courtForm.team_b_id) : null;
        const nextA = courtForm.next_team_a_id ? Number(courtForm.next_team_a_id) : null;
        const nextB = courtForm.next_team_b_id ? Number(courtForm.next_team_b_id) : null;

        if (!categoryId) {
            errs.category_id = 'Category is required.';
        }
        if (!teamA) {
            errs.team_a_id = 'Team A is required.';
        }
        if (!teamB) {
            errs.team_b_id = 'Team B is required.';
        }

        // If one next team is filled, the other must also be filled
        if ((nextA && !nextB) || (!nextA && nextB)) {
            if (!nextA) errs.next_team_a_id = 'If Next Team B is set, Next Team A is also required.';
            if (!nextB) errs.next_team_b_id = 'If Next Team A is set, Next Team B is also required.';
        }

        if (teamA && teamB && teamA === teamB) {
            errs.team_b_id = 'Team B cannot be the same as Team A.';
        }
        if (teamA && nextA && teamA === nextA) {
            errs.next_team_a_id = 'Next Team A cannot be the same as Team A.';
        }
        if (teamA && nextB && teamA === nextB) {
            errs.next_team_b_id = 'Next Team B cannot be the same as Team A.';
        }
        if (teamB && nextA && teamB === nextA) {
            errs.next_team_a_id = 'Next Team A cannot be the same as Team B.';
        }
        if (teamB && nextB && teamB === nextB) {
            errs.next_team_b_id = 'Next Team B cannot be the same as Team B.';
        }
        if (nextA && nextB && nextA === nextB) {
            errs.next_team_b_id = 'Next Team B cannot be the same as Next Team A.';
        }

        if (Object.keys(errs).length > 0) { setCourtErrors(errs); return; }

        const nextCategoryId = courtForm.next_category_id ? Number(courtForm.next_category_id) : null;

        router.post('/admin/live-configuration/match-scores', {
            id: activeCourt && getMatchForCourt(activeCourt)?.id ? getMatchForCourt(activeCourt)?.id : null,
            live_configuration_id: configuration.id,
            court_number: activeCourt,
            category_id: categoryId,
            next_category_id: nextCategoryId,
            team_a_id: teamA,
            team_b_id: teamB,
            next_team_a_id: nextA,
            next_team_b_id: nextB,
            umpire_id: courtForm.umpire_id ? Number(courtForm.umpire_id) : null,
            status_id: Number(courtForm.status_id),
        }, { preserveScroll: true, onSuccess: () => setCourtModalOpen(false) });
    };

    const confirmRemoveCourt = (match: LiveMatchScore) => {
        setRemoveCourtTarget(match);
        setRemoveCourtOpen(true);
    };

    const executeRemoveCourt = () => {
        if (!removeCourtTarget) return;
        router.delete(`/admin/live-configuration/match-scores/${removeCourtTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => { setRemoveCourtOpen(false); setRemoveCourtTarget(null); },
        });
    };

    // =====================
    // Helpers
    // =====================

    const getMatchForCourt = (courtNumber: number) => {
        return configuration.match_scores?.find((m) => m.court_number === courtNumber) ?? null;
    };

    const getTeamName = (teamId: number | null | undefined) => {
        if (!teamId) return '—';
        const team = teams.find((t) => t.id === teamId);
        return team?.name ?? `Team #${teamId}`;
    };

    const getCategoryName = (categoryId: number | null | undefined) => {
        if (!categoryId) return '—';
        const cat = configuration.categories?.find((c) => c.id === categoryId);
        return cat?.name ?? `Category #${categoryId}`;
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
            <Head title={configuration.name} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                {/* Back */}
                <Link href="/admin/live-configuration" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                    Back to live configurations
                </Link>

                {/* Configuration Header */}
                <div className="rounded-xl border border-border/70 bg-gradient-to-br from-background via-card to-indigo-500/15 p-6 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.35)]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-400 shadow-md">
                                <Activity className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">{configuration.name}</h1>
                                    {getStatusBadge(configuration.status)}
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {configuration.number_of_courts} court{configuration.number_of_courts > 1 ? 's' : ''}
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    {getScoringBadge(configuration.scoring_system)}
                                    {configuration.allow_court_change && (
                                        <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-400">
                                            Court Change
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Link href={`/admin/live-configuration/${configuration.id}/edit`}>
                            <Button variant="outline" size="sm" className="inline-flex items-center gap-2">
                                <Settings2 className="h-4 w-4" />
                                Edit configuration
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Categories Section (accordion) */}
                <div className="rounded-xl border border-border/70 bg-card shadow-[0_10px_30px_-24px_rgba(0,0,0,0.35)]">
                    <div
                        className="flex cursor-pointer items-center justify-between p-6 select-none"
                        onClick={() => setCategoriesOpen((prev) => !prev)}
                    >
                        <div className="flex items-center gap-2">
                            <Tags className="h-5 w-5 text-indigo-500" />
                            <h2 className="text-lg font-semibold text-foreground">Categories</h2>
                            <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{configuration.categories?.length ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); openCategoryModal(); }}
                                className="inline-flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add category
                            </Button>
                            {categoriesOpen ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                        </div>
                    </div>

                    {categoriesOpen && (
                        <div className="px-6 pb-6">
                            {(!configuration.categories || configuration.categories.length === 0) ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <Tags className="mb-2 h-10 w-10 text-muted-foreground/40" />
                                    <p className="text-sm font-medium text-foreground">No categories yet</p>
                                    <p className="mt-1 text-xs text-muted-foreground">Create a category with game settings before adding teams to courts.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border rounded-lg border border-border/60">
                                    {configuration.categories.map((cat) => (
                                        <div key={cat.id} className="flex items-center justify-between px-4 py-3 transition hover:bg-primary/[0.02]">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-600 dark:text-amber-400">
                                                    {cat.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-foreground">{cat.name}</span>
                                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                            <Target className="mr-0.5 h-2.5 w-2.5" />
                                                            Game to {cat.game_to}
                                                        </Badge>
                                                        {cat.game_time && (
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                                <Clock className="mr-0.5 h-2.5 w-2.5" />
                                                                {cat.game_time} mins
                                                            </Badge>
                                                        )}
                                                        {cat.game_interval && (
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                                Interval {cat.game_interval} mins
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                    onClick={() => openCategoryModal(cat)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                    onClick={() => confirmDeleteCategory(cat)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Teams Section (accordion) */}
                <div className="rounded-xl border border-border/70 bg-card shadow-[0_10px_30px_-24px_rgba(0,0,0,0.35)]">
                    <div
                        className="flex cursor-pointer items-center justify-between p-6 select-none"
                        onClick={() => setTeamsOpen((prev) => !prev)}
                    >
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-500" />
                            <h2 className="text-lg font-semibold text-foreground">Teams</h2>
                            <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{teams.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); openTeamModal(); }}
                                className="inline-flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add team
                            </Button>
                            {teamsOpen ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                        </div>
                    </div>

                    {teamsOpen && (
                        <div className="px-6 pb-6">
                            {teams.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <Users className="mb-2 h-10 w-10 text-muted-foreground/40" />
                                    <p className="text-sm font-medium text-foreground">No teams yet</p>
                                    <p className="mt-1 text-xs text-muted-foreground">Add teams and assign them to a category.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border rounded-lg border border-border/60">
                                    {teams.map((team) => {
                                        const cat = team.category ?? configuration.categories?.find((c) => c.id === team.category_id);
                                        return (
                                            <div key={team.id} className="flex items-center justify-between px-4 py-3 transition hover:bg-primary/[0.02]">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                        {team.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-foreground">{team.name}</span>
                                                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                                            {cat && (
                                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
                                                                    {cat.name}
                                                                </Badge>
                                                            )}
                                                            {team.player_ids && team.player_ids.length > 0 && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    {team.player_ids.length} player{team.player_ids.length > 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                        onClick={() => openTeamModal(team)}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                        onClick={() => confirmDeleteTeam(team)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Standings Section (accordion) */}
                <div className="rounded-xl border border-border/70 bg-card shadow-[0_10px_30px_-24px_rgba(0,0,0,0.35)]">
                    <div
                        className="flex cursor-pointer items-center justify-between p-6 select-none"
                        onClick={() => setStandingsOpen((prev) => !prev)}
                    >
                        <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-amber-500" />
                            <h2 className="text-lg font-semibold text-foreground">Standings</h2>
                            <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{Object.keys(standings).length} categories</span>
                        </div>
                        {standingsOpen ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                    </div>

                    {standingsOpen && (
                        <div className="px-6 pb-6 space-y-6">
                            {Object.keys(standings).length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <Trophy className="mb-2 h-10 w-10 text-muted-foreground/40" />
                                    <p className="text-sm font-medium text-foreground">No standings yet</p>
                                    <p className="mt-1 text-xs text-muted-foreground">Standings will appear once matches are completed.</p>
                                </div>
                            ) : (
                                Object.entries(standings).map(([categoryId, categoryStandings]) => {
                                    const cat = configuration.categories?.find((c) => c.id === Number(categoryId));
                                    return (
                                        <div key={categoryId}>
                                            <div className="mb-3 flex items-center gap-2">
                                                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400 text-xs px-2 py-0.5">
                                                    {cat?.name ?? `Category #${categoryId}`}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">{categoryStandings.length} teams</span>
                                            </div>
                                            <div className="overflow-x-auto rounded-lg border border-border/60">
                                                <table className="w-full text-left text-xs">
                                                    <thead>
                                                        <tr className="border-b border-border/60 bg-muted/30">
                                                            <th className="px-3 py-2 font-semibold text-muted-foreground w-10">#</th>
                                                            <th className="px-3 py-2 font-semibold text-muted-foreground">Team</th>
                                                            <th className="px-3 py-2 font-semibold text-muted-foreground text-end w-32">MP</th>
                                                            <th className="px-3 py-2 font-semibold text-muted-foreground text-end w-32">W</th>
                                                            <th className="px-3 py-2 font-semibold text-muted-foreground text-end w-32">L</th>
                                                            <th className="px-3 py-2 font-semibold text-muted-foreground text-end w-32">PF</th>
                                                            <th className="px-3 py-2 font-semibold text-muted-foreground text-end w-32">PA</th>
                                                            <th className="px-3 py-2 font-semibold text-muted-foreground text-end w-32">PD</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {categoryStandings.map((standing, index) => {
                                                            const teamName = standing.team?.name ?? getTeamName(standing.team_id);
                                                            const isPlayingNow = configuration.match_scores?.some(
                                                                (m) => (m.team_a_id === standing.team_id || m.team_b_id === standing.team_id) && m.status?.slug !== 'completed'
                                                            );
                                                            return (
                                                                <tr
                                                                    key={standing.id}
                                                                    className={`border-b border-border/40 transition hover:bg-primary/[0.02] ${isPlayingNow ? 'bg-indigo-500/5 font-medium' : ''}`}
                                                                >
                                                                    <td className="px-3 py-2">
                                                                        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                                                            index === 0 ? 'bg-amber-500/15 text-amber-600' :
                                                                            index === 1 ? 'bg-gray-400/15 text-gray-500' :
                                                                            index === 2 ? 'bg-orange-500/10 text-orange-600' :
                                                                            'bg-muted text-muted-foreground'
                                                                        }`}>
                                                                            {index + 1}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-sm font-medium text-foreground">{teamName}</span>
                                                                            {isPlayingNow && (
                                                                                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-end text-sm tabular-nums">{standing.matches_played}</td>
                                                                    <td className="px-3 py-2 text-end text-sm tabular-nums text-emerald-600 font-medium">{standing.wins}</td>
                                                                    <td className="px-3 py-2 text-end text-sm tabular-nums text-red-500">{standing.losses}</td>
                                                                    <td className="px-3 py-2 text-end text-sm tabular-nums">{standing.points_for}</td>
                                                                    <td className="px-3 py-2 text-end text-sm tabular-nums">{standing.points_against}</td>
                                                                    <td className={`px-3 py-2 text-end text-sm tabular-nums font-medium ${
                                                                        standing.point_differential > 0 ? 'text-emerald-600' :
                                                                        standing.point_differential < 0 ? 'text-red-500' : ''
                                                                    }`}>
                                                                        {standing.point_differential > 0 ? '+' : ''}{standing.point_differential}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                {/* Courts Grid */}
                <div className="rounded-xl border border-border/70 bg-card p-6 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.35)]">
                    <div className="mb-5 flex items-center gap-2">
                        <Swords className="h-5 w-5 text-indigo-500" />
                        <h2 className="text-lg font-semibold text-foreground">Courts</h2>
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {configuration.match_scores?.length ?? 0} / {configuration.number_of_courts} assigned
                        </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: configuration.number_of_courts }, (_, i) => i + 1).map((courtNumber) => {
                            const match = getMatchForCourt(courtNumber);
                            
                            return (
                                <div
                                    key={courtNumber}
                                    className="group relative rounded-lg border border-border/60 bg-gradient-to-br from-background to-muted/30 p-4 transition hover:border-indigo-500/30 hover:shadow-md"
                                >
                                    {/* Court Header */}
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-indigo-500/10 text-base font-bold text-indigo-600 dark:text-indigo-400">
                                                {courtNumber}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-foreground">Court {courtNumber}</div>
                                                {match && match.category && (
                                                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400 text-[10px] px-1.5 py-0">
                                                        {match.category.name}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        {match ? (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                    onClick={() => openCourtModal(courtNumber, match)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                    onClick={() => confirmRemoveCourt(match)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground"
                                                onClick={() => openCourtModal(courtNumber)}
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>

                                    {match && match.umpire && match.umpire_id && (
                                        <div className="text-[10px] text-muted-foreground truncate">
                                            <span>Umpire:</span>
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-2 border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-400">
                                                {match.umpire.first_name} {match.umpire.last_name}
                                            </Badge>
                                        </div>
                                    )}

                                    {/* Match Content */}
                                    {match ? (
                                        <div className="space-y-3">
                                            {/* Team A */}
                                            <div className="flex items-center justify-between rounded-md bg-background py-1">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-bold text-blue-600 dark:text-blue-400">A</div>
                                                    <span className="truncate text-sm font-medium text-foreground">{getTeamName(match.team_a_id)}</span>
                                                    {match.serving_team === 'team_a' ? (
                                                        <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-green-500 ring-1 ring-green-300" />
                                                    ) : (
                                                        <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-muted-foreground/20" />
                                                    )}
                                                </div>
                                                <span className="ml-2 text-lg font-bold text-foreground">{match.team_a_score ?? 0}</span>
                                            </div>

                                            {/* Serving indicator */}
                                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                                <span className="text-[10px] uppercase tracking-wider">vs</span>
                                            </div>

                                            {/* Team B */}
                                            <div className="flex items-center justify-between rounded-md bg-background py-1">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-[10px] font-bold text-purple-600 dark:text-purple-400">B</div>
                                                    <span className="truncate text-sm font-medium text-foreground">{getTeamName(match.team_b_id)}</span>
                                                    {match.serving_team === 'team_b' ? (
                                                        <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-green-500 ring-1 ring-green-300" />
                                                    ) : (
                                                        <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-muted-foreground/20" />
                                                    )}
                                                </div>
                                                <span className="ml-2 text-lg font-bold text-foreground">{match.team_b_score ?? 0}</span>
                                            </div>

                                            {(match.next_team_a_id || match.next_team_b_id) && (
                                                <div className="text-[10px] text-muted-foreground truncate">
                                                    <span>Up next</span>
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 mx-2">
                                                        {getTeamName(match.next_team_a_id)}
                                                    </Badge>
                                                    vs
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-2">
                                                        {match.next_team_b_id && getTeamName(match.next_team_b_id)}
                                                    </Badge>
                                                </div>
                                            )}
                                            {match.status && (
                                                <div className="mt-1 text-right">
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                        {match.status.name}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-6 text-center">
                                            <Swords className="mb-2 h-8 w-8 text-muted-foreground/30" />
                                            <p className="text-xs text-muted-foreground">No match assigned</p>
                                            <p className="mt-1 text-[10px] text-muted-foreground/60">Click + to assign teams</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ============ Category Dialog ============ */}
            <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Edit category' : 'Add category'}</DialogTitle>
                        <DialogDescription>
                            {editingCategory
                                ? 'Update the category name and game settings.'
                                : 'Create a new category with game settings for this configuration.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="cat-name" className="text-sm font-medium">
                                Category name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="cat-name"
                                value={categoryForm.name}
                                onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g. Men's Singles, Women's Doubles"
                                className="mt-1.5"
                            />
                            {categoryErrors.name && <p className="mt-1 text-sm text-destructive">{categoryErrors.name}</p>}
                        </div>
                        <div>
                            <Label htmlFor="cat-game-to" className="text-sm font-medium">
                                Game to (points) <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="cat-game-to"
                                type="number"
                                min={1}
                                max={999}
                                value={categoryForm.game_to}
                                onChange={(e) => setCategoryForm((prev) => ({ ...prev, game_to: e.target.value }))}
                                className="mt-1.5"
                            />
                            {categoryErrors.game_to && <p className="mt-1 text-sm text-destructive">{categoryErrors.game_to}</p>}
                        </div>
                        <div>
                            <Label htmlFor="cat-game-time" className="text-sm font-medium">Game time</Label>
                            <Input
                                id="cat-game-time"
                                value={categoryForm.game_time}
                                onChange={(e) => setCategoryForm((prev) => ({ ...prev, game_time: e.target.value }))}
                                placeholder="e.g. 15:00 or 15 minutes"
                                className="mt-1.5"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">Duration of each game (e.g. 15 minutes or 15:00)</p>
                        </div>
                        <div>
                            <Label htmlFor="cat-game-interval" className="text-sm font-medium">Game interval</Label>
                            <Input
                                id="cat-game-interval"
                                value={categoryForm.game_interval}
                                onChange={(e) => setCategoryForm((prev) => ({ ...prev, game_interval: e.target.value }))}
                                placeholder="e.g. 2:00 or 2 minutes"
                                className="mt-1.5"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">Rest time between games (e.g. 2 minutes or 2:00)</p>
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-end">
                        <Button variant="outline" onClick={() => setCategoryModalOpen(false)}>Cancel</Button>
                        <Button onClick={saveCategory}>{editingCategory ? 'Update' : 'Create'} category</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ============ Team Dialog ============ */}
            <Dialog open={teamModalOpen} onOpenChange={setTeamModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingTeam ? 'Edit team' : 'Add team'}</DialogTitle>
                        <DialogDescription>
                            {editingTeam ? 'Update the team name, category, and players.' : 'Create a new team and assign it to a category.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="team-name" className="text-sm font-medium">
                                Team name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="team-name"
                                value={teamForm.name}
                                onChange={(e) => setTeamForm((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g. Team Alpha"
                                className="mt-1.5"
                            />
                            {teamErrors.name && <p className="mt-1 text-sm text-destructive">{teamErrors.name}</p>}
                        </div>
                        <div>
                            <Label htmlFor="team-category" className="text-sm font-medium">Category</Label>
                            <select
                                id="team-category"
                                value={teamForm.category_id}
                                onChange={(e) => setTeamForm((prev) => ({ ...prev, category_id: e.target.value }))}
                                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-none outline-none transition-colors focus-visible:border-primary/50"
                            >
                                <option value="">No category</option>
                                {(configuration.categories ?? []).map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label htmlFor="team-players" className="text-sm font-medium">Players</Label>
                            <div className="mt-1.5">
                                <PlayerSearchInput
                                    selectedPlayers={selectedPlayers}
                                    onPlayersChange={setSelectedPlayers}
                                    placeholder="Search players by name or email..."
                                    unavailablePlayerIds={getUnavailablePlayerIds(editingTeam?.id)}
                                />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">Search and select players to add them to this team.</p>
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-end">
                        <Button variant="outline" onClick={() => setTeamModalOpen(false)}>Cancel</Button>
                        <Button onClick={saveTeam}>{editingTeam ? 'Update' : 'Create'} team</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ============ Court Match Dialog ============ */}
            <Dialog open={courtModalOpen} onOpenChange={setCourtModalOpen}>
                <DialogContent className="sm:max-w-md max-h-[85vh]">
                    <DialogHeader>
                        <DialogTitle>Court {activeCourt} — Assign match</DialogTitle>
                        <DialogDescription>
                            Select a category first, then choose teams within that category. Optionally set a next category and next teams for the queue.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 p-4 h-100 overflow-y-auto">
                        {/* Category dropdown (required) */}
                        <div>
                            <Label htmlFor="court-category" className="text-sm font-medium">
                                Category <span className="text-destructive">*</span>
                            </Label>
                            <select
                                id="court-category"
                                value={courtForm.category_id}
                                onChange={(e) => {
                                    setCourtForm((prev) => ({
                                        ...prev,
                                        category_id: e.target.value,
                                        team_a_id: '',
                                        team_b_id: '',
                                    }));
                                }}
                                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-none outline-none transition-colors focus-visible:border-primary/50"
                            >
                                <option value="">Select category</option>
                                {(configuration.categories ?? []).map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            {courtErrors.category_id && <p className="mt-1 text-sm text-destructive">{courtErrors.category_id}</p>}
                        </div>

                        {/* Team A - filtered by category */}
                        <div>
                            <Label htmlFor="court-team-a" className="text-sm font-medium">Team A <span className="text-destructive">*</span></Label>
                            <select
                                id="court-team-a"
                                value={courtForm.team_a_id}
                                onChange={(e) => setCourtForm((prev) => ({ ...prev, team_a_id: e.target.value }))}
                                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-none outline-none transition-colors focus-visible:border-primary/50"
                            >
                                <option value="">Select team</option>
                                {teamsInSelectedCategory.map((team) => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                            {courtErrors.team_a_id && <p className="mt-1 text-sm text-destructive">{courtErrors.team_a_id}</p>}
                        </div>

                        {/* Team B - filtered by category */}
                        <div>
                            <Label htmlFor="court-team-b" className="text-sm font-medium">Team B <span className="text-destructive">*</span></Label>
                            <select
                                id="court-team-b"
                                value={courtForm.team_b_id}
                                onChange={(e) => setCourtForm((prev) => ({ ...prev, team_b_id: e.target.value }))}
                                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-none outline-none transition-colors focus-visible:border-primary/50"
                            >
                                <option value="">Select team</option>
                                {teamsForTeamB.map((team) => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                            {courtErrors.team_b_id && <p className="mt-1 text-sm text-destructive">{courtErrors.team_b_id}</p>}
                        </div>

                        {/* ---- Next Category (optional) ---- */}
                        <div className="border-t border-border/40 pt-4">
                            <div>
                                <Label htmlFor="court-next-category" className="text-sm font-medium">
                                    Next Category (queue)
                                </Label>
                                <select
                                    id="court-next-category"
                                    value={courtForm.next_category_id}
                                    onChange={(e) => {
                                        setCourtForm((prev) => ({
                                            ...prev,
                                            next_category_id: e.target.value,
                                            next_team_a_id: '',
                                            next_team_b_id: '',
                                        }));
                                    }}
                                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-none outline-none transition-colors focus-visible:border-primary/50"
                                >
                                    <option value="">No next category</option>
                                    {(configuration.categories ?? []).map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Next Team A - filtered by next category */}
                        <div>
                            <Label htmlFor="court-next-team-a" className="text-sm font-medium">Next Team A (queue)</Label>
                            <select
                                id="court-next-team-a"
                                value={courtForm.next_team_a_id}
                                onChange={(e) => setCourtForm((prev) => ({ ...prev, next_team_a_id: e.target.value }))}
                                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-none outline-none transition-colors focus-visible:border-primary/50"
                            >
                                <option value="">No next team</option>
                                {teamsForNextA.map((team) => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Next Team B - filtered by next category */}
                        <div>
                            <Label htmlFor="court-next-team-b" className="text-sm font-medium">Next Team B (queue)</Label>
                            <select
                                id="court-next-team-b"
                                value={courtForm.next_team_b_id}
                                onChange={(e) => setCourtForm((prev) => ({ ...prev, next_team_b_id: e.target.value }))}
                                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-none outline-none transition-colors focus-visible:border-primary/50"
                            >
                                <option value="">No next team</option>
                                {teamsForNextB.map((team) => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Umpire */}
                        <div>
                            <Label htmlFor="court-umpire" className="text-sm font-medium">Umpire</Label>
                            <select
                                id="court-umpire"
                                value={courtForm.umpire_id}
                                onChange={(e) => setCourtForm((prev) => ({ ...prev, umpire_id: e.target.value }))}
                                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-none outline-none transition-colors focus-visible:border-primary/50"
                            >
                                <option value="">No umpire assigned</option>
                                {umpires.map((umpire) => (
                                    <option key={umpire.id} value={umpire.id}>
                                        {umpire.first_name} {umpire.last_name} ({umpire.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <Label htmlFor="court-status" className="text-sm font-medium">Status <span className="text-destructive">*</span></Label>
                            <select
                                id="court-status"
                                value={courtForm.status_id}
                                onChange={(e) => setCourtForm((prev) => ({ ...prev, status_id: e.target.value }))}
                                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-none outline-none transition-colors focus-visible:border-primary/50"
                            >
                                <option value="">Select status</option>
                                {statuses.map((status) => (
                                    <option key={status.id} value={status.id}>{status.name}</option>
                                ))}
                            </select>
                            {courtErrors.status_id && <p className="mt-1 text-sm text-destructive">{courtErrors.status_id}</p>}
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-end">
                        <Button variant="outline" onClick={() => setCourtModalOpen(false)}>Cancel</Button>
                        <Button onClick={saveCourtMatch}>Add match</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ============ Remove Court Confirmation Dialog ============ */}
            <Dialog open={removeCourtOpen} onOpenChange={setRemoveCourtOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove match from court</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove the match on Court {removeCourtTarget?.court_number}? This will clear the team assignments and scores.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setRemoveCourtOpen(false); setRemoveCourtTarget(null); }}>Cancel</Button>
                        <Button variant="destructive" onClick={executeRemoveCourt}>Remove</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ============ Remove Team Confirmation Dialog ============ */}
            <Dialog open={removeTeamOpen} onOpenChange={setRemoveTeamOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete team</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <span className="font-semibold text-foreground">{removeTeamTarget?.name}</span>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setRemoveTeamOpen(false); setRemoveTeamTarget(null); }}>Cancel</Button>
                        <Button variant="destructive" onClick={executeDeleteTeam}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ============ Remove Category Confirmation Dialog ============ */}
            <Dialog open={removeCategoryOpen} onOpenChange={setRemoveCategoryOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete category</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <span className="font-semibold text-foreground">{removeCategoryTarget?.name}</span>? Teams assigned to this category will be unlinked.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setRemoveCategoryOpen(false); setRemoveCategoryTarget(null); }}>Cancel</Button>
                        <Button variant="destructive" onClick={executeDeleteCategory}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

LiveConfigurationShow.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Live Configuration',
            href: '/admin/live-configuration',
        },
        {
            title: 'Show',
            href: '#',
        },
    ],
};

