import type { ReactNode } from 'react';
import UmpireTopbar from './topbar';

export default function UmpireLayout({ children }: { children: ReactNode }) {
    return <UmpireTopbar>{children}</UmpireTopbar>;
}

