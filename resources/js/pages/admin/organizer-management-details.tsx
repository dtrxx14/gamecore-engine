import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, Users, Trophy, Building2, Sparkles, Mail, Phone, MapPin, CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface OrganizationCountry {
    id: number;
    name: string;
}

interface OrganizationStateProvince {
    id: number;
    name: string;
}

interface OrganizationMember {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
    };
    role: {
        id: number;
        name: string;
        slug: string;
    };
}

interface OrganizationTournament {
    id: number;
    title: string;
    slug: string;
    start_date: string | null;
    description: string | null;
}

interface OrganizationData {
    id: number;
    name: string;
    email: string;
    contact_number: string;
    website_url: string;
    description: string;
    address: string;
    zip_code: string;
    country?: OrganizationCountry;
    state_province?: OrganizationStateProvince;
    status: {
        id: number;
        name: string;
        slug: string;
    };
    members: OrganizationMember[];
    tournaments: OrganizationTournament[];
    created_at: string;
}

interface Props {
    organization: OrganizationData;
}

type DetailsTab = 'information' | 'members' | 'tournaments';

export default function OrganizerManagementDetails({ organization }: Props) {
    const [activeTab, setActiveTab] = useState<DetailsTab>('information');

    const formatDate = (value: string | null) => {
        if (!value) {
            return 'Pending';
        }

        return new Date(value).toLocaleDateString('en', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <>
            <Head title={`${organization.name} Details`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <div className="rounded-xl border border-border/70 bg-gradient-to-br from-background via-card to-primary/25 p-5 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.35)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                                <Sparkles className="size-4" />
                                Organization overview
                            </div>
                            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                                {organization.name}
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Review the organization profile, members, and tournaments in one tidy workspace.
                            </p>
                        </div>
                        <Button variant="outline" asChild className="rounded-md border-border/70 bg-background/80 hover:border-primary/40 hover:bg-primary/10 hover:text-primary">
                            <Link href="/admin/organizer-management">
                                <ChevronLeft className="mr-2 size-4" />
                                Back to list
                            </Link>
                        </Button>
                    </div>
                </div>

                <Card className="border-border/70 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.35)]">
                    <CardHeader className="border-b border-border/70 px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant={activeTab === 'information' ? 'default' : 'outline'}
                                className={activeTab === 'information' ? 'rounded-md' : 'rounded-md border-border/70 bg-background/80 hover:border-primary/40 hover:bg-primary/10 hover:text-primary'}
                                onClick={() => setActiveTab('information')}
                            >
                                <Building2 className="mr-2 size-4" />
                                Information
                            </Button>
                            <Button
                                variant={activeTab === 'members' ? 'default' : 'outline'}
                                className={activeTab === 'members' ? 'rounded-md' : 'rounded-md border-border/70 bg-background/80 hover:border-primary/40 hover:bg-primary/10 hover:text-primary'}
                                onClick={() => setActiveTab('members')}
                            >
                                <Users className="mr-2 size-4" />
                                Members
                            </Button>
                            <Button
                                variant={activeTab === 'tournaments' ? 'default' : 'outline'}
                                className={activeTab === 'tournaments' ? 'rounded-md' : 'rounded-md border-border/70 bg-background/80 hover:border-primary/40 hover:bg-primary/10 hover:text-primary'}
                                onClick={() => setActiveTab('tournaments')}
                            >
                                <Trophy className="mr-2 size-4" />
                                Tournaments
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6">
                        {activeTab === 'information' && (
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/70 p-3">
                                            <Mail className="mt-0.5 size-4 text-primary" />
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">Email</p>
                                                <p className="text-sm text-muted-foreground">{organization.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 rounded-md border border-border/70 bg-card/70 p-3">
                                            <Phone className="mt-0.5 size-4 text-primary" />
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">Contact</p>
                                                <p className="text-sm text-muted-foreground">{organization.contact_number || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/70 p-3">
                                            <Building2 className="mt-0.5 size-4 text-primary" />
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">Website</p>
                                                <p className="text-sm text-muted-foreground">{organization.website_url || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/70 p-3">
                                            <Sparkles className="mt-0.5 size-4 text-primary" />
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">Status</p>
                                                <p className="text-sm text-muted-foreground">{organization.status.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/70 p-3">
                                            <MapPin className="mt-0.5 size-4 text-primary" />
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">Location</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {[organization.country?.name, organization.state_province?.name]
                                                        .filter(Boolean)
                                                        .join(', ') || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/70 p-3">
                                            <Building2 className="mt-0.5 size-4 text-primary" />
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">Address</p>
                                                <p className="text-sm text-muted-foreground">{organization.address || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/70 p-3">
                                            <Sparkles className="mt-0.5 size-4 text-primary" />
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">ZIP Code</p>
                                                <p className="text-sm text-muted-foreground">{organization.zip_code || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 rounded-md border border-border/70 bg-card/70 p-3">
                                            <CalendarDays className="mt-0.5 size-4 text-primary" />
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">Created</p>
                                                <p className="text-sm text-muted-foreground">{formatDate(organization.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2 rounded-lg border border-border/70 bg-background/70 p-4">
                                    <p className="text-sm font-semibold text-foreground">Description</p>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {organization.description || 'No description available.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'members' && (
                            <div className="space-y-4">
                                {organization.members.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-border/80 bg-background/70 p-8 text-center text-sm text-muted-foreground">
                                        No members recorded.
                                    </div>
                                ) : (
                                    <>
                                        {([
                                            {
                                                key: 'non-member',
                                                heading: 'Admins & Umpires',
                                                members: organization.members.filter((member) => member.role.slug !== 'member'),
                                            },
                                            {
                                                key: 'member',
                                                heading: 'Members',
                                                members: organization.members.filter((member) => member.role.slug === 'member'),
                                            },
                                        ] as const).map((group) => {
                                            if (group.members.length === 0) {
                                                return null;
                                            }

                                            return (
                                                <div key={group.key} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                                                    <div className="mb-4 flex items-center justify-between gap-3 border-b border-border/70 pb-4">
                                                        <div>
                                                            <p className="text-sm font-semibold text-foreground">{group.heading}</p>
                                                            <p className="text-sm text-muted-foreground">{group.members.length} {group.heading.toLowerCase()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid gap-3">
                                                        {group.members.map((member) => (
                                                            <div
                                                                key={member.id}
                                                                className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                                                            >
                                                                <div>
                                                                    <p className="text-sm font-medium text-foreground">{member.user.name}</p>
                                                                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                                                                </div>
                                                                <span className="rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
                                                                    {member.role.name}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'tournaments' && (
                            <div className="space-y-3">
                                {organization.tournaments.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-border/80 bg-background/70 p-8 text-center text-sm text-muted-foreground">
                                        No tournaments recorded.
                                    </div>
                                ) : (
                                    organization.tournaments.map((tournament) => (
                                        <div key={tournament.id} className="rounded-lg border border-border/70 bg-background/70 p-4">
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{tournament.title}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {tournament.description || 'No description provided.'}
                                                    </p>
                                                </div>
                                                <span className="rounded-md border border-border/70 bg-card/70 px-3 py-1 text-sm text-muted-foreground">
                                                    {formatDate(tournament.start_date)}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

OrganizerManagementDetails.layout = ({ organization }: Props) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Organizer Management',
            href: '/admin/organizer-management',
        },
        {
            title: organization.name,
            href: `/admin/organizer-management/${organization.id}`,
        },
    ],
});