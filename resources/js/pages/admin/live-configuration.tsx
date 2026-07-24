import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    Clock,
    Eye,
    GripVertical,
    Monitor,
    Pencil,
    Plus,
    Settings2,
    ShieldCheck,
    Trash2,
    ScanEye,
} from 'lucide-react';
import { useState } from 'react';
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

interface Props {
    configurations: LiveConfigurationData[];
}

export default function LiveConfiguration({ configurations }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<LiveConfigurationData | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const confirmDelete = (config: LiveConfigurationData) => {
        setDeleteTarget(config);
        setDeleteOpen(true);
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
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400">
                        Side Out
                    </Badge>
                );
            case 'rally-point':
                return (
                    <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-400">
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
                <div className="rounded-xl border border-border/70 bg-gradient-to-br from-background via-card to-indigo-500/15 p-6 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.35)]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
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
                                        className="group flex flex-col gap-4 px-6 py-5 transition hover:bg-primary/[0.02] sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        {/* Left: Info */}
                                        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
                                            {/* Icon + Name */}
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5">
                                                    <Settings2 className="h-5 w-5 text-indigo-500" />
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
                                                                <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-400">
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

