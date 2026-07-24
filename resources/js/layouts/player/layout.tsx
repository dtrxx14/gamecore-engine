import type { ReactNode } from 'react';
import PlayerTopbar from './topbar';

export default function PlayerLayout({ children }: { children: ReactNode }) {
    return <PlayerTopbar>{children}</PlayerTopbar>;
}
