import { AlertTriangle, Copy, Pencil, Trash2, Users, Coins, Layers, Swords, Shield, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CategoryForm from '@/pages/organizer/partials/create/CategoryForm';

const competitionFormatColors: Record<string, string> = {
    'round-robin': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'single-elimination': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'double-elimination': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'swiss-system': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const roundFormatLabels: Record<string, string> = {
    'preliminary': 'Prelim',
    'round-128': 'R128',
    'round-64': 'R64',
    'round-32': 'R32',
    'round-16': 'R16',
    'round-8': 'R8',
    'quarter-finals': 'QF',
    'semi-finals': 'SF',
    'battle-for-third': 'BF-3rd',
    'finals': 'Finals',
};

type CategoryFormatSummary = {
    round_format?: string;
    game_to?: number | string;
    win_by?: number | string;
    game_time?: number | string | null;
    tie_break_method?: 'serve' | 'rally';
    pool_count?: number | string;
    allow_court_change?: boolean;
    court_change_trigger?: string;
    court_change_interval?: number | null;
};

export default function CategoryList({
    categories,
    onAdd,
    onRemove,
    onUpdate,
}: {
    categories: any[];
    onAdd?: (cat: any) => void;
    onRemove: (id: number) => void;
    onUpdate: (updated: any) => void;
}) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);

    const editingCategory = useMemo(
        () => categories.find((c) => c.id === editingId) ?? null,
        [categories, editingId]
    );

    const deletingCategory = useMemo(
        () => categories.find((c) => c.id === confirmingDeleteId) ?? null,
        [categories, confirmingDeleteId]
    );

    const [open, setOpen] = useState(false);

    useEffect(() => {
        setOpen(editingId !== null);
    }, [editingId]);

    // When dialog closes, clear selection
    useEffect(() => {
        if (!open) {
            setEditingId(null);
        }
    }, [open]);

    const handleDeleteConfirm = () => {
        if (confirmingDeleteId !== null) {
            onRemove(confirmingDeleteId);
            setConfirmingDeleteId(null);
        }
    };

    const handleDuplicate = (cat: any) => {
        if (!onAdd) return;
        const duplicate = {
            ...cat,
            id: Date.now(),
            name: `${cat.name} (Copy)`,
        };
        onAdd(duplicate);
    };

    const formatCurrency = (amount: number | string, currency?: string) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(num)) return `${currency ?? 'PHP'} 0`;
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: currency ?? 'PHP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    return (
        <>
            {categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-muted/20 py-12 text-center">
                    <Swords className="mb-3 h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">No categories added yet</p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                        Add your first category using the form above.
                    </p>
                </div>
            ) : (
                <div className="mt-3 space-y-2">
                    {categories.map((c) => {
                        const formatCount = Array.isArray(c.formats) ? c.formats.length : 1;
                        const firstFormat = Array.isArray(c.formats) ? c.formats[0] : null;

                        return (
                            <div
                                key={c.id}
                                className="group relative flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-3 transition-all hover:border-border hover:shadow-sm sm:p-4 md:flex-row md:items-start md:gap-4"
                            >
                                {/* Category Icon */}
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                    <Shield className="h-5 w-5 text-primary" />
                                </div>

                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate text-sm font-semibold">{c.name}</span>
                                                <span className="shrink-0 text-xs text-muted-foreground/60">•</span>
                                                <span className="shrink-0 text-xs text-muted-foreground">{c.division}</span>
                                            </div>
                                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                                {/* Team Type Badge */}
                                                <Badge variant="secondary" className="text-[10px] font-medium">
                                                    {c.team_type} event
                                                </Badge>

                                                {/* Format Count Badge */}
                                                <Badge variant="outline" className="text-[10px] font-medium gap-1">
                                                    <Layers className="h-3 w-3" />
                                                    {formatCount} {formatCount === 1 ? 'format' : 'formats'}
                                                </Badge>

                                                {/* Competition Format Badge */}
                                                {/* {firstFormat?.competition_format && (
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${competitionFormatColors[firstFormat.competition_format] ?? 'bg-gray-100 text-gray-700'}`}>
                                                        {firstFormat.competition_format}
                                                    </span>
                                                )} */}

                                                {/* Round Format Badge */}
                                                {/* {firstFormat?.round_format && (
                                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                        {roundFormatLabels[firstFormat.round_format] ?? firstFormat.round_format}
                                                    </span>
                                                )} */}
                                            </div>

                                            {/* Description (if available) */}
                                            {c.description && (
                                                <p className="mt-1.5 line-clamp-1 text-xs text-muted-foreground/60">
                                                    {c.description}
                                                </p>
                                            )}

                                            <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs text-muted-foreground sm:grid-cols-3 lg:grid-cols-7">
                                                {Array.isArray(c.formats) && c.formats.map((format: CategoryFormatSummary, index: number) => {
                                                    const roundName = roundFormatLabels[format.round_format ?? ''] ?? format.round_format ?? `Format ${index + 1}`;
                                                    const courtRule = format.allow_court_change
                                                        ? format.court_change_trigger && format.court_change_trigger !== 'none'
                                                            ? `${format.court_change_trigger.replaceAll('_', ' ')}${format.court_change_interval ? ` (${format.court_change_interval})` : ''}`
                                                            : 'enabled'
                                                        : 'disabled';

                                                    return (
                                                        <div key={index} className="col-span-2 grid min-w-0 grid-cols-2 gap-1.5 rounded-md bg-muted/40 p-1.5 sm:col-span-3 sm:grid-cols-3 lg:col-span-7 lg:grid-cols-7">
                                                            <div className="min-w-0 rounded-sm bg-background/70 px-2 py-1.5">
                                                                <div className="text-[10px] uppercase tracking-wide text-muted-foreground/60">Round</div>
                                                                <div className="truncate font-medium text-foreground">{roundName}</div>
                                                            </div>
                                                            <div className="min-w-0 rounded-sm bg-background/70 px-2 py-1.5">
                                                                <div className="text-[10px] uppercase tracking-wide text-muted-foreground/60">Game to</div>
                                                                <div className="font-medium text-foreground">{format.game_to ?? '—'}</div>
                                                            </div>
                                                            <div className="min-w-0 rounded-sm bg-background/70 px-2 py-1.5">
                                                                <div className="text-[10px] uppercase tracking-wide text-muted-foreground/60">Win by</div>
                                                                <div className="font-medium text-foreground">{format.win_by ?? '—'}</div>
                                                            </div>
                                                            <div className="min-w-0 rounded-sm bg-background/70 px-2 py-1.5">
                                                                <div className="text-[10px] uppercase tracking-wide text-muted-foreground/60">Pools</div>
                                                                <div className="font-medium text-foreground">{format.pool_count ?? '—'}</div>
                                                            </div>
                                                            <div className="min-w-0 rounded-sm bg-background/70 px-2 py-1.5">
                                                                <div className="text-[10px] uppercase tracking-wide text-muted-foreground/60">Time</div>
                                                                <div className="font-medium text-foreground">{format.game_time ? `${format.game_time} min` : 'None'}</div>
                                                            </div>
                                                            <div className="min-w-0 rounded-sm bg-background/70 px-2 py-1.5">
                                                                <div className="text-[10px] uppercase tracking-wide text-muted-foreground/60">Tie rule</div>
                                                                <div className="font-medium capitalize text-foreground">{format.tie_break_method ?? 'rally'}</div>
                                                            </div>
                                                            <div className="min-w-0 rounded-sm bg-background/70 px-2 py-1.5">
                                                                <div className="text-[10px] uppercase tracking-wide text-muted-foreground/60">Court change</div>
                                                                <div className="truncate font-medium capitalize text-foreground">{courtRule}</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Stats - compact right side */}
                                        <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                                            <div className="hidden items-center gap-1.5 sm:flex">
                                                <Coins className="h-3.5 w-3.5" />
                                                <span className="font-medium text-foreground/80">
                                                    {formatCurrency(c.entry_fee, c.currency)}
                                                </span>
                                            </div>
                                            <div className="hidden items-center gap-1.5 md:flex">
                                                <Users className="h-3.5 w-3.5" />
                                                <span className="font-medium text-foreground/80">
                                                    {c.min_players}–{c.max_players}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions - visible on hover */}
                                <div className="hidden shrink-0 items-center gap-1 lg:flex">
                                    {onAdd && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleDuplicate(c)}
                                            title="Duplicate category"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setEditingId(c.id)}
                                        title="Edit category"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => setConfirmingDeleteId(c.id)}
                                        title="Remove category"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                {/* Always-visible mobile actions */}
                                <div className="flex shrink-0 items-center gap-1 lg:hidden">
                                    {onAdd && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleDuplicate(c)}
                                            title="Duplicate category"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setEditingId(c.id)}
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => setConfirmingDeleteId(c.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="h-[92vh] w-[calc(100%-1rem)] max-w-6xl overflow-y-auto p-3 sm:h-[90vh] sm:w-[calc(100%-2rem)] sm:p-6">
                    <DialogHeader>
                        <DialogTitle>Edit category</DialogTitle>
                        <DialogDescription>Update the category details and format steps.</DialogDescription>
                    </DialogHeader>

                    <CategoryForm
                        mode="edit"
                        initial={editingCategory}
                        onCancel={() => setOpen(false)}
                        onAdd={(draft) => {
                            if (!editingCategory) {
                                return;
                            }

                            onUpdate({
                                ...editingCategory,
                                ...draft,
                                id: editingCategory.id,
                            });

                            setOpen(false);
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={confirmingDeleteId !== null} onOpenChange={(open) => { if (!open) setConfirmingDeleteId(null); }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>
                        <DialogTitle className="text-center">Remove category</DialogTitle>
                        <DialogDescription className="text-center">
                            Are you sure you want to remove <strong className="text-foreground">{deletingCategory?.name}</strong>?
                            <br />
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setConfirmingDeleteId(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            className="flex-1"
                            onClick={handleDeleteConfirm}
                        >
                            Remove
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

