import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Organizations from './partials/Organizations';

type Tournament = {
    id: number;
    title: string;
    division?: string;
    date?: string;
    entry_fee?: string;
    entries_current?: number;
    entries_max?: number;
    venue?: string;
    contact?: string;
    description?: string;
    categories?: any[];
    divisions?: any[];
};

export default function OrganizerDashboard() {
    const [selected, setSelected] = useState<Tournament | null>(null);

    const { auth } = usePage().props;
    const user = auth?.user;

    // Role gating (client-side fallback)
    const isOrganizer = user?.organization_memberships?.some(
        (membership) =>
            membership.role?.slug === 'admin' ||
            membership.role?.slug === 'umpire'
    ) ?? false;

    const isOrganizerAdmin = user?.organization_memberships?.some(
        (membership) =>
            membership.role?.slug === 'admin'
    );

    // If not a player, redirect away (lightweight fallback)
    // if (!isOrganizer) {
    //     window.location.href = '/dashboard';

    //     return null;
    // }

    const sample: Tournament[] = [
        // {
        //     id: 1,
        //     title: 'Summer Open 2026',
        //     division: 'Open Division',
        //     date: '2026-08-21',
        //     entry_fee: '$30',
        //     entries_current: 56,
        //     entries_max: 128,
        //     venue: 'City Sports Centre',
        //     contact: 'events@example.com',
        //     description: 'Annual summer tournament open to all levels.',
        //     categories: [
        //         { id: 1, title: 'Men Singles', division: 'A', date: '2026-08-21', entry_fee: '$30', entries_current: 24, entries_max: 32 },
        //         { id: 2, title: 'Women Singles', division: 'B', date: '2026-08-21', entry_fee: '$30', entries_current: 18, entries_max: 32 },
        //     ],
        //     divisions: [{ id: 1, title: 'A', description: 'Top skill level' }],
        // },
        // {
        //     id: 2,
        //     title: 'City Cup',
        //     division: 'Amateur',
        //     date: '2026-09-10',
        //     entry_fee: '$20',
        //     entries_current: 12,
        //     entries_max: 64,
        //     venue: 'Downtown Courts',
        //     contact: 'info@citycup.org',
        //     description: 'Local club event.',
        //     categories: [],
        //     divisions: [],
        // },
    ];

    return (
        <>
            <Head title="Organizer Dashboard" />
            
            <div>
                <Organizations />
            </div>

        </>
    );
}

// OrganizerDashboard.layout = {
//     breadcrumbs: [
//         {
//             title: 'Dashboard',
//             href: '/organizer/dashboard',
//         },
//     ],
// };
