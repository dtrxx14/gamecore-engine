import type { ReactNode } from 'react';
import OrganizerTopbar from './topbar';
import type { BreadcrumbItem } from '@/types';

export default function OrganizerLayout({
    children,
    breadcrumbs = [],
}: {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}) {
    return <OrganizerTopbar breadcrumbs={breadcrumbs}>{children}</OrganizerTopbar>;
}
