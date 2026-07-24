import { Head, Link, router } from '@inertiajs/react';
import { Eye, Search, ChevronLeft, ChevronRight, LayoutGrid, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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

interface PaginationLink {
    label: string;
    url: string | null;
    active: boolean;
}

interface PaginatedOrganizations {
    data: OrganizationData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: PaginationLink[];
}

interface Props {
    organizations: PaginatedOrganizations;
    filters: {
        search: string;
        per_page: number;
    };
}

// Replace this with the real API response once the backend endpoint is ready.
const sampleManagementOrganizations: PaginatedOrganizations = {
    data: [
        {
            id: 1,
            name: 'Apex Sports Club',
            email: 'hello@apexsports.test',
            contact_number: '+1 555 0101',
            website_url: 'https://apexsports.test',
            description: 'Community-driven esports and badminton club based in Seattle.',
            address: '1200 Pine Street',
            zip_code: '98101',
            country: { id: 1, name: 'United States' },
            state_province: { id: 1, name: 'Washington' },
            status: { id: 2, name: 'Approved', slug: 'approved' },
            members: [
                {
                    id: 101,
                    user: { id: 11, name: 'Mina Torres', email: 'mina@apexsports.test' },
                    role: { id: 20, name: 'Admin', slug: 'admin' },
                },
            ],
            tournaments: [
                { id: 301, title: 'Summer League 2026', slug: 'summer-league-2026', start_date: '2026-08-10', description: 'Regional tournament' },
            ],
            created_at: '2026-06-01T10:00:00.000Z',
        },
        {
            id: 2,
            name: 'Northstar Gaming',
            email: 'contact@northstargaming.test',
            contact_number: '+44 7700 900123',
            website_url: 'https://northstargaming.test',
            description: 'Tournament organizer focused on amateur player development.',
            address: '45 King Street',
            zip_code: 'SW1A 1AA',
            country: { id: 2, name: 'United Kingdom' },
            state_province: { id: 2, name: 'London' },
            status: { id: 2, name: 'Approved', slug: 'approved' },
            members: [
                {
                    id: 102,
                    user: { id: 12, name: 'Jonah Blake', email: 'jonah@northstargaming.test' },
                    role: { id: 20, name: 'Admin', slug: 'admin' },
                },
            ],
            tournaments: [
                { id: 302, title: 'Winter Invitational', slug: 'winter-invitational', start_date: '2026-12-02', description: 'Open tournament' },
            ],
            created_at: '2026-06-03T14:30:00.000Z',
        },
    ],
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 2,
    from: 1,
    to: 2,
    links: [],
};

export default function OrganizerManagement({ organizations, filters }: Props) {
    // const pageOrganizations = organizations?.data?.length ? organizations : sampleManagementOrganizations;
    const pageOrganizations = organizations;

    const [search, setSearch] = useState(filters.search);
    const [perPage, setPerPage] = useState(String(filters.per_page));

    useEffect(() => {
        setSearch(filters.search);
        setPerPage(String(filters.per_page));
    }, [filters.search, filters.per_page]);

    const updateList = (page: number, nextPerPage: string | null = null) => {
        const resolvedPerPage = nextPerPage ?? perPage;

        router.get(
            '/admin/organizer-management',
            { search, per_page: resolvedPerPage, page },
            { preserveScroll: true, preserveState: true, replace: true }
        );
    };

    const handleSearch = () => {
        updateList(1, perPage);
    };

    const handlePageJump = (value: string) => {
        const page = Number(value);

        if (Number.isNaN(page)) {
            return;
        }

        updateList(page, perPage);
    };

    return (
        <>
            <Head title="Organizer Management" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <div className="rounded-lg border border-border/70 bg-gradient-to-br from-background via-card to-primary/25 p-5 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.35)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                                <Sparkles className="size-4" />
                                Approved organizations
                            </div>
                            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                                Organizer management
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Review active organizer profiles, member activity, and linked tournaments in one place.
                            </p>
                        </div>
                        <div className="rounded-md border border-border/70 bg-background/80 px-3 py-2 text-sm shadow-sm">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                                Total
                            </div>
                            <div className="mt-1 text-lg font-semibold text-foreground">
                                {pageOrganizations.total}
                            </div>
                        </div>
                    </div>
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
                            <Button className="rounded-md" onClick={handleSearch}>Search</Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-hidden">
                            <table className="min-w-full divide-y divide-border text-sm">
                                <thead className="bg-muted/40">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Name</th>
                                        <th className="px-4 py-3 text-left font-medium">Email</th>
                                        <th className="px-4 py-3 text-left font-medium">Country</th>
                                        <th className="px-4 py-3 text-left font-medium">Members</th>
                                        <th className="px-4 py-3 text-left font-medium">Tournaments</th>
                                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-background/60">
                                    {pageOrganizations.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                                                No approved organizations found.
                                            </td>
                                        </tr>
                                    ) : (
                                        pageOrganizations.data.map((organization) => (
                                            <tr key={organization.id} className="transition hover:bg-primary/5">
                                                <td className="px-4 py-3 font-medium text-foreground">{organization.name}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{organization.email}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{organization.country?.name ?? 'N/A'}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{organization.members.length}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{organization.tournaments.length}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button variant="outline" size="sm" asChild className="rounded-md border-border/70 bg-background/80 hover:border-primary/40 hover:bg-primary/10 hover:text-primary">
                                                        <Link href={`/admin/organizer-management/${organization.id}`}>
                                                            <Eye className="mr-2 size-4" />
                                                            View
                                                        </Link>
                                                    </Button>
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
                                        disabled={pageOrganizations.current_page <= 1}
                                        onClick={() => updateList(pageOrganizations.current_page - 1)}
                                    >
                                        <ChevronLeft className="mr-2 size-4" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-md border-border/70 bg-background/80"
                                        disabled={pageOrganizations.current_page >= pageOrganizations.last_page}
                                        onClick={() => updateList(pageOrganizations.current_page + 1)}
                                    >
                                        Next
                                        <ChevronRight className="ml-2 size-4" />
                                    </Button>
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Showing {pageOrganizations.from} to {pageOrganizations.to} of {pageOrganizations.total}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Jump to page</span>
                                <Input
                                    type="text"
                                    min="1"
                                    max={pageOrganizations.last_page}
                                    defaultValue={pageOrganizations.current_page}
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
        </>
    );
}

OrganizerManagement.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/player/dashboard',
        },
        {
            title: 'Organizer Management',
            href: '/admin/organizer-management',
        },
    ],
};
