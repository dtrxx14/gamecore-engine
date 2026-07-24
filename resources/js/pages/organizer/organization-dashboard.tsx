import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Building2,
    Edit,
    MapPin,
    Globe,
    Mail,
    Phone,
    CalendarDays,
    ShieldCheck,
    Users,
    Trophy,
    ChevronRight,
    Plus,
    Sparkles,
    Award,
    UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import TournamentDetails from './partials/TournamentDetails';

type OrgTab = 'details' | 'members' | 'tournaments';

export default function OrganizationDashboard({
    organization,
    role,
    organizationUuid,
}: {
    organization: any;
    role: any;
    organizationUuid: string;
}) {
    const { auth } = usePage().props;
    const user = auth?.user;

    const isAdmin = role?.slug === 'admin';

    const [activeTab, setActiveTab] = useState<OrgTab>('details');
    const [selectedTournament, setSelectedTournament] = useState<any | null>(null);

    const formatDate = (value: string | null) => {
        if (!value) return '—';
        return new Date(value).toLocaleDateString('en', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const members = organization?.members ?? [];
    const tournaments = organization?.tournaments ?? [];

    const adminMembers = members.filter((m: any) => m.role?.slug === 'admin');
    const umpireMembers = members.filter((m: any) => m.role?.slug === 'umpire');
    const regularMembers = members.filter((m: any) => m.role?.slug === 'member');

    const staffMembers = [...adminMembers, ...umpireMembers];

    return (
        <>
            <Head title={`${organization?.name ?? 'Organization'} Dashboard`} />

            <div className="space-y-6">
                {/* Banner Image - only show if exists */}
                {organization?.banner_image && (
                    <div className="relative h-48 w-full overflow-hidden rounded-xl border bg-muted">
                        <img
                            src={`/storage/${organization.banner_image}`}
                            alt={`${organization?.name ?? 'Organization'} banner`}
                            className="h-full w-full object-cover"
                        />
                    </div>
                )}

                {/* Basic Info Card */}
                <div className="rounded-xl border bg-gradient-to-br from-background via-card to-primary/10 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 overflow-hidden">
                                {organization?.logo_image ? (
                                    <img
                                        src={`/storage/${organization.logo_image}`}
                                        alt={`${organization?.name ?? 'Organization'} logo`}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <Building2 className="h-8 w-8 text-primary" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">
                                    {organization?.name ?? 'Organization'}
                                </h2>
                                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-0.5 text-xs font-medium text-primary">
                                        <ShieldCheck className="h-3 w-3" />
                                        {role?.name ?? role?.slug ?? '—'}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        {formatDate(organization?.created_at)}
                                    </span>
                                    {organization?.email && (
                                        <span className="inline-flex items-center gap-1.5">
                                            <Mail className="h-3.5 w-3.5" />
                                            {organization.email}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isAdmin && (
                            <Link
                                href={`/organizer/organizations/${encodeURIComponent(organizationUuid)}/edit`}
                                className="inline-flex"
                            >
                                <Button variant="outline" size="sm">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-1 rounded-xl border bg-card p-1 shadow-sm">
                    {([
                        { key: 'details', label: 'Details', icon: Building2 },
                        { key: 'members', label: 'Members', icon: Users },
                        { key: 'tournaments', label: 'Tournaments', icon: Trophy },
                    ] as const).map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => {
                                    setActiveTab(tab.key);
                                    setSelectedTournament(null);
                                }}
                                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                    activeTab === tab.key
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                                {tab.key === 'tournaments' && tournaments.length > 0 && (
                                    <span className="ml-1 rounded-full bg-background/20 px-1.5 py-0.5 text-[10px]">
                                        {tournaments.length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                {activeTab === 'details' && (
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border bg-card p-5 shadow-sm">
                            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                Contact Information
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                                    <Mail className="h-4 w-4 text-primary" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="text-sm font-medium">{organization?.email ?? '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                                    <Phone className="h-4 w-4 text-primary" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Contact</p>
                                        <p className="text-sm font-medium">{organization?.contact_number ?? '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                                    <Globe className="h-4 w-4 text-primary" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Website</p>
                                        <p className="text-sm font-medium">
                                            {organization?.website_url ? (
                                                <a href={organization.website_url} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">
                                                    {organization.website_url}
                                                </a>
                                            ) : '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border bg-card p-5 shadow-sm">
                            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                Location
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Address</p>
                                        <p className="text-sm font-medium">{organization?.address ?? '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                                    <Globe className="h-4 w-4 text-primary" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Country</p>
                                        <p className="text-sm font-medium">{organization?.country?.name ?? organization?.country_id ?? '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">State/Province</p>
                                        <p className="text-sm font-medium">{organization?.state_province?.name ?? '—'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {organization?.description && (
                            <div className="md:col-span-2 rounded-xl border bg-card p-5 shadow-sm">
                                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                    Description
                                </h3>
                                <p className="text-sm text-muted-foreground">{organization.description}</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'members' && (
                    <div className="space-y-6">
                        {/* Staff: Admin & Umpire together */}
                        {staffMembers.length > 0 && (
                            <div className="rounded-xl border bg-card p-5 shadow-sm">
                                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                                    <Award className="h-4 w-4 text-primary" />
                                    Staff & Management
                                </h3>
                                <div className="grid gap-3">
                                    {staffMembers.map((member: any) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between rounded-lg border bg-background/50 p-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                    <UserCheck className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {member.user?.player_information?.first_name ?? member.user?.name ?? 'User'} {member.user?.player_information?.last_name ?? ''}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {member.user?.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${
                                                member.role?.slug === 'admin'
                                                    ? 'border-primary/30 bg-primary/10 text-primary'
                                                    : 'border-amber-200 bg-amber-50 text-amber-700'
                                            }`}>
                                                {member.role?.name ?? member.role?.slug}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Regular Members */}
                        {regularMembers.length > 0 && (
                            <div className="rounded-xl border bg-card p-5 shadow-sm">
                                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                                    <Users className="h-4 w-4 text-primary" />
                                    Members ({regularMembers.length})
                                </h3>
                                <div className="grid gap-3">
                                    {regularMembers.map((member: any) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between rounded-lg border bg-background/50 p-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                                    <Users className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {member.user?.player_information?.first_name ?? member.user?.name ?? 'User'} {member.user?.player_information?.last_name ?? ''}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {member.user?.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                                                Member
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {members.length === 0 && (
                            <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
                                No members found.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'tournaments' && (
                    <div className="space-y-4">
                        {isAdmin && (
                            <div className="flex justify-end">
                                <Link href={`/organizer/organizations/${encodeURIComponent(organizationUuid)}/tournaments/create`}>
                                    <Button size="sm">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Tournament
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {selectedTournament ? (
                            <div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedTournament(null)}
                                    className="mb-4"
                                >
                                    ← Back to tournaments
                                </Button>
                                <TournamentDetails tournament={selectedTournament} />
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {tournaments.length > 0 ? (
                                    tournaments.map((t: any) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setSelectedTournament(t)}
                                            className="group text-left rounded-xl border bg-card p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                                        <Trophy className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold">{t.title}</h3>
                                                        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                                                            {t.description || 'No description'}
                                                        </p>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            <span className="inline-flex items-center gap-1 rounded-full border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground">
                                                                <CalendarDays className="h-3 w-3" />
                                                                {t.start_date ? formatDate(t.start_date) : '—'}
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 rounded-full border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground">
                                                                <Users className="h-3 w-3" />
                                                                {t.categories?.length ?? 0} categories
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="mt-2 h-5 w-5 text-muted-foreground transition group-hover:translate-x-0.5" />
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
                                        No tournaments created yet.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

OrganizationDashboard.layout = ({ organization }: {
        organization: any;
    }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/organizer/dashboard',
        },
        {
            title: organization?.name ?? 'Organization',
        },
    ],
});

