import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, MailCheck, Pencil, Plus, RefreshCw, Search, ShieldCheck, Trash2 } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdminUser {
    id: number;
    email: string;
    email_verified_at?: string | null;
    account_number: string;
    deleted_at?: string;
    role?: {
        name: string;
        slug: string;
    };
    status?: {
        name: string;
        slug: string;
    };
}

interface PaginationLink {
    label: string;
    url: string | null;
    active: boolean;
}

interface PaginatedAdmins {
    data: AdminUser[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: PaginationLink[];
}

interface Props {
    admins: PaginatedAdmins;
    deletedAdmins: PaginatedAdmins;
    filters: {
        search: string;
        per_page: number;
    };
}

type ConfirmActionType = 'toggle-status' | 'reset-password' | 'delete' | 'recover' | 'verify-email';

type ConfirmAction = {
    type: ConfirmActionType;
    user: AdminUser;
} | null;

export default function UserManagement({ admins, deletedAdmins, filters }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [perPage, setPerPage] = useState(String(filters.per_page));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [accountType, setAccountType] = useState<'admin' | 'umpire'>('admin');
    const [accountTab, setAccountTab] = useState<'active' | 'deleted'>('active');
    const [form, setForm] = useState({
        email: '',
        firstName: '',
        lastName: '',
        gender: '',
        account_number: '',
        password: '',
        editingId: null as number | null,
    });
    const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirming, setIsConfirming] = useState<number | null>(null);

    useEffect(() => {
        setSearch(filters.search);
        setPerPage(String(filters.per_page));
    }, [filters.search, filters.per_page]);

    const activeCount = useMemo(
        () => admins.data.filter((user) => user.status?.slug === 'active').length,
        [admins.data]
    );

    const handleSearch = () => {
        setIsSearching(true);
        if (accountTab === 'deleted') {
            updateDeletedList(1, perPage);
        } else {
            updateList(1, perPage);
        }
    };

    const handlePageJump = (value: string) => {
        const page = Number(value);

        if (Number.isNaN(page)) {
            return;
        }

        if (accountTab === 'deleted') {
            updateDeletedList(page, perPage);
        } else {
            updateList(page, perPage);
        }
    };

    const updateList = (page: number, nextPerPage: string | null = null) => {
        const resolvedPerPage = nextPerPage ?? perPage;

        router.get(
            '/admin/user-management',
            { search, per_page: resolvedPerPage, page },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setIsSearching(false),
            }
        );
    };

    const updateDeletedList = (page: number, nextPerPage: string | null = null) => {
        const resolvedPerPage = nextPerPage ?? perPage;

        router.get(
            '/admin/user-management',
            { search, per_page: resolvedPerPage, deleted_page: page },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setIsSearching(false),
            },
        );
    };

    const recoverUser = (user: AdminUser) => {
        setConfirmAction({ type: 'recover', user });
    };

    const openCreateModal = (type: 'admin' | 'umpire') => {
        setModalMode('create');
        setAccountType(type);
        setForm({ email: '', firstName: '', lastName: '', gender: '', account_number: '', password: '', editingId: null });
        setIsModalOpen(true);
    };

    // const openEditModal = (user: AdminUser) => {
    //     setModalMode('edit');
    //     setForm({ email: user.email, account_number: user.account_number, password: '', editingId: user.id });
    //     setIsModalOpen(true);
    // };

    const closeModal = () => {
        setIsModalOpen(false);
        setForm({ email: '', firstName: '', lastName: '', gender: '', account_number: '', password: '', editingId: null });
    };

    const submitForm = (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);

        if (modalMode === 'edit' && form.editingId) {
            router.put(`/admin/user-management/${form.editingId}`, {
                account_number: form.account_number,
            }, {
                onSuccess: () => {
                    closeModal();
                    setIsSubmitting(false);
                },
                onError: () => {
                    setIsSubmitting(false);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            });
            return;
        }

        router.post('/admin/user-management', {
            email: form.email,
            password: form.password,
            account_type: accountType,
            first_name: form.firstName,
            last_name: form.lastName,
            gender: form.gender,
        }, {
            onSuccess: () => {
                closeModal();
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
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

        const { type, user } = confirmAction;

        setIsConfirming(user.id);

        if (type === 'reset-password') {
            router.post(`/admin/user-management/${user.id}/reset-password`, {}, {
                onFinish: () => {
                    setIsConfirming(null);
                    setConfirmAction(null);
                },
            });
            return;
        }

        if (type === 'toggle-status') {
            router.patch(`/admin/user-management/${user.id}/toggle-status`, {}, {
                onFinish: () => {
                    setIsConfirming(null);
                    setConfirmAction(null);
                },
            });
            return;
        }

        if (type === 'delete') {
            router.delete(`/admin/user-management/${user.id}`, {
                onFinish: () => {
                    setIsConfirming(null);
                    setConfirmAction(null);
                },
            });
            return;
        }

        if (type === 'recover') {
            router.post(`/admin/user-management/${user.id}/restore`, {}, {
                preserveScroll: true,
                onFinish: () => {
                    setIsConfirming(null);
                    setConfirmAction(null);
                },
            });
            return;
        }

        if (type === 'verify-email') {
            router.post(`/admin/user-management/${user.id}/verify-email`, {}, {
                onFinish: () => {
                    setIsConfirming(null);
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
            <Head title="User Management" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <div className="rounded-lg border border-border/70 bg-gradient-to-br from-background via-card to-primary/25 p-5 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.35)]">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                                <ShieldCheck className="size-4" />
                                Login users
                            </div>
                            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">User management</h1>
                            <p className="mt-1 text-sm text-muted-foreground">Search and manage administrator and umpire accounts.</p>
                        </div>
                        <div className="rounded-md border border-border/70 bg-background/80 px-3 py-2 text-sm shadow-sm">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Active users</div>
                            <div className="mt-1 text-lg font-semibold text-foreground">{activeCount}</div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button onClick={() => openCreateModal('admin')} className="inline-flex items-center gap-2" disabled={isSubmitting}>
                        <Plus className="size-4" />
                        Add admin
                    </Button>
                    <Button onClick={() => openCreateModal('umpire')} variant="outline" className="inline-flex items-center gap-2" disabled={isSubmitting}>
                        <Plus className="size-4" />
                        Add umpire
                    </Button>
                </div>

                <Tabs value={accountTab} onValueChange={(value) => setAccountTab(value as 'active' | 'deleted')} className="w-full">
                    <TabsList>
                        <TabsTrigger value="active">Active accounts</TabsTrigger>
                        <TabsTrigger value="deleted">Deleted accounts ({deletedAdmins.total})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="active">
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
                            <div className="flex items-center gap-2  rounded-md border border-border/70 bg-background/80 px-3">
                                <Search className="size-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            handleSearch();
                                        }
                                    }}
                                    placeholder="Search organizations"
                                    className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                                />
                            </div>
                            <Button className="rounded-md" onClick={handleSearch} loading={isSearching} disabled={isSearching}>Search</Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-hidden">
                            <table className="min-w-full divide-y divide-border text-sm">
                                <thead className="bg-muted/40">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Account Number</th>
                                        <th className="px-4 py-3 text-left font-medium">Verified Email</th>
                                        <th className="px-4 py-3 text-left font-medium">Email</th>
                                        <th className="px-4 py-3 text-left font-medium">Role</th>
                                        <th className="px-4 py-3 text-left font-medium">Status</th>
                                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-background/60">
                                    {admins.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                No login users found.
                                            </td>
                                        </tr>
                                    ) : (
                                        admins.data.map((user) => (
                                            <tr key={user.id} className="transition hover:bg-primary/5">
                                                <td className="px-4 py-3 font-medium text-foreground">{user.account_number}</td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {user.email_verified_at ? (
                                                        <span className="text-emerald-500">Verified</span>
                                                    ) : (
                                                        <span className="text-amber-500">Not Verified</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">{user.role?.name ?? 'Unknown'}</td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.status?.slug === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {user.status?.name ?? 'Unknown'}
                                                    </span>
                                                </td>
                                                { user.id != 1 ? (
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex flex-wrap justify-end gap-2">
                                                        {/* <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="sm" variant="outline" onClick={() => openEditModal(user)}>
                                                                    <Pencil className="size-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Edit admin account</TooltipContent>
                                                        </Tooltip> */}
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="sm" variant="outline" onClick={() => handleConfirmAction({ type: 'reset-password', user })}>
                                                                    <RefreshCw className="size-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Reset password</TooltipContent>
                                                        </Tooltip>
                                                        {!user.email_verified_at && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button size="sm" variant="outline" onClick={() => handleConfirmAction({ type: 'verify-email', user })}>
                                                                        <MailCheck className="size-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Verify email</TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="sm" variant="outline" onClick={() => handleConfirmAction({ type: 'toggle-status', user })}>
                                                                    <ShieldCheck className="size-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>{user.status?.slug === 'active' ? 'Deactivate account' : 'Activate account'}</TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-destructive hover:border-destructive"
                                                                    onClick={() => handleConfirmAction({ type: 'delete', user })}
                                                                >
                                                                    <Trash2 className="size-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Delete admin user</TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </td>
                                                ) : (
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex flex-wrap justify-end gap-2">
                                                    </div>
                                                </td>
                                                )}
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
                                        disabled={admins.current_page <= 1}
                                        onClick={() => updateList(admins.current_page - 1)}
                                    >
                                        <ChevronLeft className="mr-2 size-4" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-md border-border/70 bg-background/80"
                                        disabled={admins.current_page >= admins.last_page}
                                        onClick={() => updateList(admins.current_page + 1)}
                                    >
                                        Next
                                        <ChevronRight className="ml-2 size-4" />
                                    </Button>
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Showing {admins.from} to {admins.to} of {admins.total}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Jump to page</span>
                                <Input
                                    type="text"
                                    min="1"
                                    max={admins.last_page}
                                    defaultValue={admins.current_page}
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
                    </TabsContent>

                    <TabsContent value="deleted">
                        <Card className="border-border/70 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.35)]">
                            <CardHeader className="flex flex-col gap-3 border-b border-border/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Select value={perPage} onValueChange={(value) => {
                                        setPerPage(value);
                                        updateDeletedList(1, value);
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
                                            placeholder="Search deleted accounts"
                                            className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                                        />
                                    </div>
                                    <Button className="rounded-md" onClick={handleSearch} loading={isSearching} disabled={isSearching}>Search</Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="border-b border-border/70 px-6 py-4">
                                    <h2 className="font-semibold text-foreground">Deleted accounts</h2>
                                    <p className="text-sm text-muted-foreground">Recover deleted administrator and umpire accounts.</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-border text-sm">
                                        <thead className="bg-muted/40">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium">Account Number</th>
                                                <th className="px-4 py-3 text-left font-medium">Email</th>
                                                <th className="px-4 py-3 text-left font-medium">Role</th>
                                                <th className="px-4 py-3 text-left font-medium">Deleted At</th>
                                                <th className="px-4 py-3 text-right font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border bg-background/60">
                                            {deletedAdmins.data.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                        No deleted accounts found.
                                                    </td>
                                                </tr>
                                            ) : deletedAdmins.data.map((user) => (
                                                <tr key={user.id} className="transition hover:bg-primary/5">
                                                    <td className="px-4 py-3 font-medium text-foreground">{user.account_number}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">{user.role?.name ?? 'Unknown'}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {user.deleted_at ? new Date(user.deleted_at).toLocaleString() : 'Unknown'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button size="sm" variant="outline" onClick={() => recoverUser(user)}>
                                                            <RefreshCw className="mr-2 size-4" />
                                                            Recover
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex flex-col gap-3 border-t border-border/70 bg-background/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" disabled={deletedAdmins.current_page <= 1} onClick={() => updateDeletedList(deletedAdmins.current_page - 1)}>
                                                <ChevronLeft className="mr-2 size-4" />
                                                Previous
                                            </Button>
                                            <Button variant="outline" size="sm" disabled={deletedAdmins.current_page >= deletedAdmins.last_page} onClick={() => updateDeletedList(deletedAdmins.current_page + 1)}>
                                                Next
                                                <ChevronRight className="ml-2 size-4" />
                                            </Button>
                                        </div>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            Showing {deletedAdmins.from} to {deletedAdmins.to} of {deletedAdmins.total}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Jump to page</span>
                                        <Input
                                            type="text"
                                            min="1"
                                            max={deletedAdmins.last_page}
                                            defaultValue={deletedAdmins.current_page}
                                            className="w-24 rounded-md border-border/70"
                                            data-deleted-page-jump-input
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    const page = Number((event.target as HTMLInputElement).value);

                                                    if (!Number.isNaN(page)) {
                                                        updateDeletedList(page);
                                                    }
                                                }
                                            }}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const input = document.querySelector<HTMLInputElement>('[data-deleted-page-jump-input]');

                                                if (input) {
                                                    const page = Number(input.value);

                                                    if (!Number.isNaN(page)) {
                                                        updateDeletedList(page);
                                                    }
                                                }
                                            }}
                                        >
                                            Go
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <Dialog open={isModalOpen} onOpenChange={(value) => setIsModalOpen(value)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{modalMode === 'create' ? `Add ${accountType} account` : 'Edit admin account'}</DialogTitle>
                        <DialogDescription>
                            {modalMode === 'create'
                                ? `Create a new ${accountType} account. Email verification is automatic.`
                                : 'Update the admin account number. Email cannot be changed here.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form className="grid gap-4 py-4" onSubmit={submitForm}>
                        {modalMode === 'create' ? (
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                                />
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                <Label>Email</Label>
                                <div className="rounded-sm border border-input bg-muted/10 px-3 py-2 text-sm text-muted-foreground">{form.email}</div>
                            </div>
                        )}

                        {modalMode === 'create' && accountType === 'umpire' && (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="first-name">First name</Label>
                                    <Input
                                        id="first-name"
                                        required
                                        value={form.firstName}
                                        onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="last-name">Last name</Label>
                                    <Input
                                        id="last-name"
                                        required
                                        value={form.lastName}
                                        onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <select
                                        id="gender"
                                        required
                                        value={form.gender}
                                        onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
                                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                                    >
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {modalMode === 'create' && (
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={form.password}
                                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                                />
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeModal} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" loading={isSubmitting}>
                                {modalMode === 'create' ? (accountType === 'umpire' ? 'Create umpire' : 'Create admin') : 'Save changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={confirmAction !== null} onOpenChange={(value) => !value && closeConfirm()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {confirmAction?.type === 'delete'
                                ? 'Delete admin user'
                                : confirmAction?.type === 'recover'
                                ? 'Recover account'
                                : confirmAction?.type === 'verify-email'
                                ? 'Verify email'
                                : confirmAction?.type === 'reset-password'
                                ? 'Reset password'
                                : 'Change account status'}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmAction?.type === 'delete' && 'This action permanently removes the admin user.'}
                            {confirmAction?.type === 'recover' &&
                                `Recover ${confirmAction.user.email} and return it to the active accounts list?`}
                            {confirmAction?.type === 'verify-email' &&
                                `Verify ${confirmAction.user.email} immediately?`}
                            {confirmAction?.type === 'reset-password' &&
                                'Reset the admin password to the default temporary password.'}
                            {confirmAction?.type === 'toggle-status' &&
                                `Are you sure you want to ${confirmAction.user.status?.slug === 'active' ? 'deactivate' : 'activate'} this admin account?`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={closeConfirm}>
                            Cancel
                        </Button>
                        <Button type="button" className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={executeConfirm} loading={isConfirming !== null} disabled={isConfirming !== null}>
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
