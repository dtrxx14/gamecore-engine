import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Mail, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Country {
    id: number;
    name: string;
}

interface StateProvince {
    id: number;
    name: string;
}

interface Player {
    id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    contact_number?: string;
    club?: string;
    gender?: string;
    birthdate?: string;
    nationality_id?: number;
    state_province_id?: number;
    dupr_account?: string;
    bio?: string;
    user?: {
        id: number;
        email: string;
    };
    nationality?: Country;
    stateProvince?: StateProvince;
}

interface PaginationLink {
    label: string;
    url: string | null;
    active: boolean;
}

interface PaginatedPlayers {
    data: Player[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: PaginationLink[];
}

interface Props {
    players: PaginatedPlayers;
    filters: {
        search: string;
        per_page: number;
    };
    countries: Country[];
    stateProvinces: StateProvince[];
}

type ConfirmActionType = 'delete';

type ConfirmAction = {
    type: ConfirmActionType;
    player: Player;
} | null;

export default function PlayerManagement({ players, filters, countries, stateProvinces }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [perPage, setPerPage] = useState(String(filters.per_page));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [availableStates, setAvailableStates] = useState<StateProvince[]>(stateProvinces);
    const [loadingStates, setLoadingStates] = useState(false);
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        contact_number: '',
        club: '',
        gender: '',
        birthdate: '',
        nationality_id: '',
        state_province_id: '',
        dupr_account: '',
        bio: '',
        editingId: null as number | null,
    });
    const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    useEffect(() => {
        setSearch(filters.search);
        setPerPage(String(filters.per_page));
    }, [filters.search, filters.per_page]);

    const totalPlayers = useMemo(() => players.total, [players.total]);

    const handleSearch = () => {
        setIsSearching(true);
        updateList(1, perPage);
    };

    const handleNationalityChange = async (value: string) => {
        setForm((current) => ({ ...current, nationality_id: value, state_province_id: '' }));

        if (value) {
            setLoadingStates(true);
            try {
                const response = await fetch(`/api/countries/${value}/states`);
                const data = await response.json();
                setAvailableStates(data);
            } catch (error) {
                console.error('Failed to fetch states:', error);
            } finally {
                setLoadingStates(false);
            }
        } else {
            setAvailableStates([]);
        }
    };

    const handlePageJump = (value: string) => {
        const page = Number(value);

        if (Number.isNaN(page)) {
            return;
        }

        updateList(page, perPage);
    };

    const updateList = (page: number, nextPerPage: string | null = null) => {
        const resolvedPerPage = nextPerPage ?? perPage;

        router.get(
            '/admin/player-management',
            { search, per_page: resolvedPerPage, page },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setIsSearching(false),
            }
        );
    };

    const openCreateModal = () => {
        setModalMode('create');
        setForm({
            first_name: '',
            last_name: '',
            email: '',
            contact_number: '',
            club: '',
            gender: '',
            birthdate: '',
            nationality_id: '',
            state_province_id: '',
            dupr_account: '',
            bio: '',
            editingId: null,
        });
        setAvailableStates([]);
        setIsModalOpen(true);
    };

    const openEditModal = (player: Player) => {
        router.visit(`/admin/player-management/${player.id}`);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setForm({
            first_name: '',
            last_name: '',
            email: '',
            contact_number: '',
            club: '',
            gender: '',
            birthdate: '',
            nationality_id: '',
            state_province_id: '',
            dupr_account: '',
            bio: '',
            editingId: null,
        });
    };

    const submitForm = (event: React.FormEvent) => {
        event.preventDefault();
        setIsSaving(true);

        router.post('/admin/player-management', {
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
            contact_number: form.contact_number,
            club: form.club,
            gender: form.gender,
            birthdate: form.birthdate || null,
            nationality_id: form.nationality_id ? Number(form.nationality_id) : null,
            state_province_id: form.state_province_id ? Number(form.state_province_id) : null,
            dupr_account: form.dupr_account,
            bio: form.bio,
        }, {
            onSuccess: () => {
                closeModal();
                setIsSaving(false);
            },
            onError: () => {
                setIsSaving(false);
            },
            onFinish: () => {
                setIsSaving(false);
            },
        });
    };

    const handleConfirmAction = (action: ConfirmAction) => {
        setConfirmAction(action);
    };

    const executeConfirm = () => {
        if (!confirmAction) {
            return;
        }

        const { type, player } = confirmAction;

        if (type === 'delete') {
            setIsDeleting(player.id);
            router.delete(`/admin/player-management/${player.id}`, {
                onFinish: () => {
                    setIsDeleting(null);
                    setConfirmAction(null);
                },
            });
            return;
        }

        setConfirmAction(null);
    };

    const closeConfirm = () => setConfirmAction(null);

    return (
        <>
            <Head title="Player Management" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <div className="rounded-lg border border-border/70 bg-gradient-to-br from-background via-card to-primary/25 p-5 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.35)]">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                                <Users className="size-4" />
                                Players
                            </div>
                            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">Player management</h1>
                            <p className="mt-1 text-sm text-muted-foreground">View, search, filter, and manage player profiles with detailed information.</p>
                        </div>
                        <div className="rounded-md border border-border/70 bg-background/80 px-3 py-2 text-sm shadow-sm">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Total Players</div>
                            <div className="mt-1 text-lg font-semibold text-foreground">{totalPlayers}</div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button onClick={openCreateModal} className="inline-flex items-center gap-2" disabled={isSaving}>
                        <Plus className="size-4" />
                        Add player
                    </Button>
                </div>

                <Card className="border-border/70 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.35)]">
                    <CardHeader className="flex flex-col gap-3 border-b border-border/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            <Select value={perPage} onValueChange={(value) => {
                                setPerPage(value);
                                updateList(1, value);
                            }}>
                                <SelectTrigger className="w-[140px] rounded-md border-border/70">
                                    <SelectValue placeholder="Per page" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 per page</SelectItem>
                                    <SelectItem value="25">25 per page</SelectItem>
                                    <SelectItem value="50">50 per page</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <div className="flex items-center gap-2 rounded-md border border-border/70 bg-background/80 px-3">
                                <Search className="size-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            handleSearch();
                                        }
                                    }}
                                    placeholder="Search players..."
                                    className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                                />
                            </div>
                            <Button className="rounded-md" onClick={handleSearch} loading={isSearching} disabled={isSearching}>Search</Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border text-sm">
                                <thead className="bg-muted/40">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Name</th>
                                        <th className="px-4 py-3 text-left font-medium">Email</th>
                                        <th className="px-4 py-3 text-left font-medium">Club</th>
                                        <th className="px-4 py-3 text-left font-medium">Contact</th>
                                        <th className="px-4 py-3 text-left font-medium">Location</th>
                                        <th className="px-4 py-3 text-left font-medium">DUPR</th>
                                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-background/60">
                                    {players.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                                No players found.
                                            </td>
                                        </tr>
                                    ) : (
                                        players.data.map((player) => (
                                            <tr key={player.id} className="transition hover:bg-primary/5">
                                                <td className="px-4 py-3 font-medium text-foreground">
                                                    {player.first_name} {player.last_name}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="size-3.5 text-muted-foreground" />
                                                        {player.user?.email}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {player.club || '—'}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {player.contact_number || '—'}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground text-xs">
                                                    <div className="flex flex-col">
                                                        {player.stateProvince?.name && (
                                                            <span>{player.stateProvince.name}</span>
                                                        )}
                                                        {player.nationality?.name && (
                                                            <span className="text-[10px] text-muted-foreground/70">{player.nationality.name}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {player.dupr_account || '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex flex-wrap justify-end gap-2">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="sm" variant="outline" onClick={() => openEditModal(player)}>
                                                                    <Pencil className="size-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Edit player</TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-destructive hover:border-destructive"
                                                                    onClick={() => handleConfirmAction({ type: 'delete', player })}
                                                                >
                                                                    <Trash2 className="size-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Delete player</TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-border/70 bg-background/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-md border-border/70 bg-background/80"
                                        disabled={players.current_page <= 1}
                                        onClick={() => updateList(players.current_page - 1)}
                                    >
                                        <ChevronLeft className="mr-2 size-4" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-md border-border/70 bg-background/80"
                                        disabled={players.current_page >= players.last_page}
                                        onClick={() => updateList(players.current_page + 1)}
                                    >
                                        Next
                                        <ChevronRight className="ml-2 size-4" />
                                    </Button>
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Showing {players.from} to {players.to} of {players.total}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Jump to page</span>
                                <Input
                                    type="text"
                                    min="1"
                                    max={players.last_page}
                                    defaultValue={players.current_page}
                                    className="w-24 rounded-md border-border/70"
                                    data-page-jump-input
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            handlePageJump((event.target as HTMLInputElement).value);
                                        }
                                    }}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-md border-border/70 bg-background/80"
                                    onClick={() => {
                                        const input = document.querySelector<HTMLInputElement>('[data-page-jump-input]');

                                        if (input) {
                                            handlePageJump(input.value);
                                        }
                                    }}
                                >
                                    Go
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isModalOpen} onOpenChange={(value) => setIsModalOpen(value)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add new player</DialogTitle>
                        <DialogDescription>
                            Create a new player profile with detailed information.
                        </DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={submitForm}>
                        <div className="space-y-2">
                            <Label htmlFor="first_name">First Name *</Label>
                            <Input
                                id="first_name"
                                type="text"
                                required
                                value={form.first_name}
                                onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="last_name">Last Name *</Label>
                            <Input
                                id="last_name"
                                type="text"
                                required
                                value={form.last_name}
                                onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                value={form.email}
                                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contact_number">Contact Number</Label>
                            <Input
                                id="contact_number"
                                type="tel"
                                value={form.contact_number}
                                onChange={(event) => setForm((current) => ({ ...current, contact_number: event.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="club">Club</Label>
                            <Input
                                id="club"
                                type="text"
                                value={form.club}
                                onChange={(event) => setForm((current) => ({ ...current, club: event.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select value={form.gender} onValueChange={(value) => setForm((current) => ({ ...current, gender: value }))}>
                                <SelectTrigger id="gender">
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="birthdate">Birthdate</Label>
                            <Input
                                id="birthdate"
                                type="date"
                                value={form.birthdate}
                                onChange={(event) => setForm((current) => ({ ...current, birthdate: event.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nationality_id">Nationality</Label>
                            <Select value={form.nationality_id} onValueChange={handleNationalityChange}>
                                <SelectTrigger id="nationality_id">
                                    <SelectValue placeholder="Select nationality" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {countries.map((country) => (
                                        <SelectItem key={country.id} value={String(country.id)}>
                                            {country.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="state_province_id">State/Province</Label>
                            <Select
                                value={form.state_province_id}
                                onValueChange={(value) => setForm((current) => ({ ...current, state_province_id: value }))}
                                disabled={!form.nationality_id || loadingStates}
                            >
                                <SelectTrigger id="state_province_id">
                                    <SelectValue placeholder={!form.nationality_id ? "Select nationality first" : loadingStates ? "Loading..." : "Select state/province"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {availableStates.map((state) => (
                                        <SelectItem key={state.id} value={String(state.id)}>
                                            {state.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dupr_account">DUPR Account</Label>
                            <Input
                                id="dupr_account"
                                type="text"
                                placeholder="e.g., 12345678"
                                value={form.dupr_account}
                                onChange={(event) => setForm((current) => ({ ...current, dupr_account: event.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                placeholder="Add a bio or additional information..."
                                value={form.bio}
                                onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                                rows={3}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeModal}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                Create player
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={confirmAction !== null} onOpenChange={(value) => !value && closeConfirm()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete player</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently delete this player? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={closeConfirm}>
                            Cancel
                        </Button>
                        <Button type="button" className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={executeConfirm}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
