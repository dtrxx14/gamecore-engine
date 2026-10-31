import { Head } from '@inertiajs/react';
import {
    Ban,
    Building2,
    CalendarDays,
    CheckCircle2,
    Eye,
    Globe,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    Sparkles,
    ThumbsUp,
    User,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { dashboard } from '@/routes';

interface OrganizationData {
    id: number;
    uuid: string;
    name: string;
    logo_image?: string | null;
    banner_image?: string | null;
    email: string;
    contact_number: string;
    website_url: string;
    description: string;
    address: string;
    status: {
        id: number;
        name: string;
        slug: string;
    };
    members: Array<{
        id: number;
        user_id: number;
        user: {
            id: number;
            player_information: {
                first_name: string;
                last_name: string;
            };
            email: string;
        };
        role: {
            id: number;
            slug: string;
            type: string;
        };
        created_at: string;
    }>;
    created_at: string;
}

interface Props {
    organizations: OrganizationData[];
}

export default function OrganizerApprovals({ organizations }: Props) {
    const initialApplications = organizations;

    const [pendingApprovals, setPendingApprovals] = useState(
        initialApplications.filter((org) => org.status.slug === 'pending-approval')
    );
    const [selectedOrg, setSelectedOrg] = useState<OrganizationData | null>(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [detailsModal, setDetailsModal] = useState(false);

    const getCsrfToken = () => {
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    };

    const handleApprove = async () => {
        if (!selectedOrg) return;

        setProcessing(true);

        try {
            const response = await fetch(`/api/organizer-approvals/${selectedOrg.id}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            });

            if (response.ok) {
                setPendingApprovals((prev) => prev.filter((org) => org.id !== selectedOrg.id));
                setShowApprovalModal(false);
                setSelectedOrg(null);
            }
        } catch (error) {
            console.error('Error approving organizer:', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedOrg) return;

        setProcessing(true);

        try {
            const response = await fetch(`/api/organizer-approvals/${selectedOrg.id}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ reason: rejectionReason }),
            });

            if (response.ok) {
                setPendingApprovals((prev) => prev.filter((org) => org.id !== selectedOrg.id));
                setShowRejectionModal(false);
                setRejectionReason('');
                setSelectedOrg(null);
            }
        } catch (error) {
            console.error('Error rejecting organizer:', error);
        } finally {
            setProcessing(false);
        }
    };

    const getAdminMember = (org: OrganizationData) => {
        return org.members.find((member) => member.role.slug === 'admin');
    };

    const formatDate = (value: string) => {
        return new Date(value).toLocaleDateString('en', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <TooltipProvider>
            <>
                <Head title="Organizer Approvals" />
                <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                    {/* Header */}
                    <div className="rounded-xl border border-border/70 bg-gradient-to-br from-background via-card to-primary/25 p-6 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.35)]">
                        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                                    <Sparkles className="size-4" />
                                    Needs review
                                </div>
                                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                                    Organizer approvals
                                </h1>
                                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                                    Review incoming organizer applications before they go live and keep the pipeline moving.
                                </p>
                            </div>
                            <div className="rounded-md border border-border/70 bg-background/80 px-3 py-2 text-sm shadow-sm">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                                    Pending
                                </div>
                                <div className="mt-1 text-lg font-semibold text-foreground">
                                    {pendingApprovals.length}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cards Grid */}
                    {pendingApprovals.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border/80 bg-card/70 p-12 text-center shadow-sm">
                            <p className="text-sm text-muted-foreground">
                                No pending organizer applications at this time.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {pendingApprovals.map((org) => {
                                const adminMember = getAdminMember(org);
                                const orgInitials = getInitials(org.name);

                                return (
                                    <div
                                        key={org.id}
                                        className="group relative overflow-hidden rounded-xl border border-border/60 bg-card transition-all duration-300 hover:border-red-500 hover:shadow-[0_8px_30px_-8px_rgba(239,68,68,0.25)] hover:-translate-y-1 cursor-pointer"
                                        onClick={() => {
                                            setSelectedOrg(org);
                                            setDetailsModal(true);
                                        }}
                                    >
                                        {/* Top colored bar */}
                                        <div className="h-2 w-full bg-gradient-to-r from-red-500 to-red-400" />

                                        {/* Banner image */}
                                        {org.banner_image ? (
                                            <div className="relative h-28 w-full overflow-hidden bg-muted">
                                                <img
                                                    src={`/storage/${org.banner_image}`}
                                                    alt=""
                                                    className="h-full w-full object-contain"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20">
                                                <Building2 className="h-10 w-10 text-red-300 dark:text-red-700/50" />
                                            </div>
                                        )}

                                        {/* Logo/Avatar */}
                                        <div className="relative -mt-10 px-4">
                                            <div className="flex items-end gap-3">
                                                {org.logo_image ? (
                                                    <div className="relative h-16 w-16 overflow-hidden rounded-xl border-2 border-background bg-white shadow-md">
                                                        <img
                                                            src={`/storage/${org.logo_image}`}
                                                            alt={`${org.name} logo`}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-background bg-gradient-to-br from-red-500 to-red-400 text-lg font-bold text-white shadow-md">
                                                        {orgInitials}
                                                    </div>
                                                )}
                                                <div className="pb-1">
                                                    <Badge
                                                        variant="outline"
                                                        className="border-red-200 bg-red-50 text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400"
                                                    >
                                                        Pending
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="px-4 pb-3 pt-3">
                                            <h3 className="truncate text-base font-semibold text-foreground">
                                                {org.name}
                                            </h3>
                                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                                {org.description || 'No description provided'}
                                            </p>

                                            {/* Quick info */}
                                            <div className="mt-3 space-y-1.5">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Mail className="h-3.5 w-3.5 shrink-0 text-red-400" />
                                                    <span className="truncate">{org.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-red-400" />
                                                    <span>{formatDate(org.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Overlay actions on hover */}
                                        <div className="absolute inset-0 flex items-end justify-center pb-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                            <div className="flex gap-1.5 rounded-lg border border-border/50 bg-background/90 px-2 py-1.5 shadow-lg backdrop-blur-sm">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedOrg(org);
                                                                setDetailsModal(true);
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">
                                                        View details
                                                    </TooltipContent>
                                                </Tooltip>

                                                <div className="w-px bg-border/60" />

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedOrg(org);
                                                                setShowApprovalModal(true);
                                                            }}
                                                        >
                                                            <ThumbsUp className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">
                                                        Approve
                                                    </TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedOrg(org);
                                                                setShowRejectionModal(true);
                                                            }}
                                                        >
                                                            <Ban className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">
                                                        Reject
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Details Modal */}
                    <Dialog open={detailsModal} onOpenChange={setDetailsModal}>
                        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-xl">Application details</DialogTitle>
                                <DialogDescription>
                                    Review the organization profile and account owner before decision time.
                                </DialogDescription>
                            </DialogHeader>

                            {selectedOrg && (
                                <div className="space-y-5">
                                    {/* Banner & Logo section */}
                                    <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
                                        {/* Banner */}
                                        {selectedOrg.banner_image ? (
                                            <div className="relative h-40 w-full overflow-hidden bg-muted">
                                                <img
                                                    src={`/storage/${selectedOrg.banner_image}`}
                                                    alt="Organization banner"
                                                    className="h-full w-full object-contain"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20">
                                                <Building2 className="h-12 w-12 text-red-300 dark:text-red-700/50" />
                                            </div>
                                        )}

                                        {/* Logo + Name row */}
                                        <div className={selectedOrg.banner_image ? '-mt-10 px-5 pb-4' : 'px-5 pb-4 pt-4'}>
                                            <div className="flex items-end gap-4">
                                                {selectedOrg.logo_image ? (
                                                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-background bg-white shadow-md">
                                                        <img
                                                            src={`/storage/${selectedOrg.logo_image}`}
                                                            alt={`${selectedOrg.name} logo`}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-background bg-gradient-to-br from-red-500 to-red-400 text-2xl font-bold text-white shadow-md">
                                                        {getInitials(selectedOrg.name)}
                                                    </div>
                                                )}
                                                <div className="pb-1">
                                                    <h3 className="text-lg font-semibold text-foreground">
                                                        {selectedOrg.name}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        Applied {formatDate(selectedOrg.created_at)}
                                                    </p>
                                                </div>
                                                <div className="ml-auto pb-1">
                                                    <Badge
                                                        variant="outline"
                                                        className="border-red-200 bg-red-50 text-xs font-semibold text-red-600 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400"
                                                    >
                                                        Pending
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {/* Description - full width */}
                                        <div className="md:col-span-2 rounded-xl border border-border/60 bg-card/50 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Description
                                            </p>
                                            <p className="mt-1.5 text-sm text-foreground">
                                                {selectedOrg.description || 'N/A'}
                                            </p>
                                        </div>

                                        {/* Contact info */}
                                        <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                <Mail className="h-3.5 w-3.5 text-red-400" />
                                                Email
                                            </div>
                                            <p className="mt-1.5 text-sm text-foreground">
                                                {selectedOrg.email}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                <Phone className="h-3.5 w-3.5 text-red-400" />
                                                Contact
                                            </div>
                                            <p className="mt-1.5 text-sm text-foreground">
                                                {selectedOrg.contact_number || 'N/A'}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                <Globe className="h-3.5 w-3.5 text-red-400" />
                                                Website
                                            </div>
                                            <p className="mt-1.5 text-sm text-foreground">
                                                {selectedOrg.website_url ? (
                                                    <a
                                                        href={selectedOrg.website_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary underline-offset-4 hover:underline"
                                                    >
                                                        {selectedOrg.website_url}
                                                    </a>
                                                ) : (
                                                    'N/A'
                                                )}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                <MapPin className="h-3.5 w-3.5 text-red-400" />
                                                Address
                                            </div>
                                            <p className="mt-1.5 text-sm text-foreground">
                                                {selectedOrg.address || 'N/A'}
                                            </p>
                                        </div>

                                        {/* Admin */}
                                        <div className="md:col-span-2 rounded-xl border border-border/60 bg-card/50 p-4">
                                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                <ShieldCheck className="h-3.5 w-3.5 text-red-400" />
                                                Admin contact
                                            </div>
                                            <div className="mt-2 flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-400 text-sm font-bold text-white">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">
                                                        {getAdminMember(selectedOrg)?.user?.player_information?.first_name}{' '}
                                                        {getAdminMember(selectedOrg)?.user?.player_information?.last_name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {getAdminMember(selectedOrg)?.user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex flex-wrap justify-end gap-2 border-t border-border/60 pt-4">
                                        <Button
                                            variant="ghost"
                                            className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                                            onClick={() => {
                                                setDetailsModal(false);
                                                setShowApprovalModal(true);
                                            }}
                                        >
                                            <ThumbsUp className="h-4 w-4" />
                                            Approve
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                                            onClick={() => {
                                                setDetailsModal(false);
                                                setShowRejectionModal(true);
                                            }}
                                        >
                                            <Ban className="h-4 w-4" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>

                    {/* Approval Confirmation Modal */}
                    <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
                        <DialogContent>
                            <DialogHeader>
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                    <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <DialogTitle className="text-center text-xl">Approve organization</DialogTitle>
                                <DialogDescription className="text-center">
                                    Approve{' '}
                                    <span className="font-semibold text-foreground">
                                        {selectedOrg?.name}
                                    </span>{' '}
                                    and notify the admin instantly.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="mt-2 flex justify-center gap-3">
                                <Button variant="outline" onClick={() => setShowApprovalModal(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                    onClick={handleApprove}
                                    disabled={processing}
                                >
                                    {processing ? 'Approving...' : 'Approve'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Rejection Modal */}
                    <Dialog open={showRejectionModal} onOpenChange={setShowRejectionModal}>
                        <DialogContent>
                            <DialogHeader>
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                                    <Ban className="h-7 w-7 text-destructive" />
                                </div>
                                <DialogTitle className="text-center text-xl">Reject organization</DialogTitle>
                                <DialogDescription className="text-center">
                                    Reject{' '}
                                    <span className="font-semibold text-foreground">
                                        {selectedOrg?.name}
                                    </span>{' '}
                                    and share a short reason if needed.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                                    <label className="text-sm font-semibold text-foreground">
                                        Rejection reason (optional)
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Why are you rejecting this application?"
                                        className="mt-2 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none ring-0"
                                        rows={4}
                                        disabled={processing}
                                    />
                                </div>
                                <div className="flex justify-center gap-3">
                                    <Button variant="outline" onClick={() => setShowRejectionModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="destructive" onClick={handleReject} disabled={processing}>
                                        {processing ? 'Rejecting...' : 'Reject'}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </>
        </TooltipProvider>
    );
}

OrganizerApprovals.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Organizer Approvals',
            href: '/admin/organizer-approvals',
        },
    ],
};
