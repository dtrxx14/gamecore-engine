import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, Swords } from 'lucide-react';
import type { ReactNode } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { dashboard } from '@/routes';

export default function UmpireTopbar({ children }: { children: ReactNode }) {
    const page = usePage<{
        auth?: {
            user?: {
                email?: string;
                profile_image?: string;
                first_name?: string;
                last_name?: string;
                name?: string;
            };
        };
    }>();
    const user = page.props.auth?.user;

    const displayName = user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'Umpire';
    const initials = (displayName || 'U')
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border/70 bg-background/95 shadow-[0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                    <div>
                        <Link
                            href={dashboard()}
                            className="flex items-center gap-2 self-center font-medium"
                        >
                            <div className="flex h-9 w-9 items-center justify-center">
                                <AppLogoIcon className="size-9 fill-current text-black dark:text-white" />
                            </div>
                        </Link>
                    </div>

                    <nav className="hidden items-center gap-1 rounded-full border border-border/60 bg-background/70 p-1 shadow-sm md:flex">
                        <Link
                            href="/umpire/dashboard"
                            className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                        >
                            <Swords className="size-4" />
                            My Courts
                        </Link>
                    </nav>

                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-2 py-1.5 text-left shadow-sm transition hover:border-primary/25 hover:bg-accent/70">
                                    <Avatar className="size-9 rounded-full border border-border/60">
                                        <AvatarImage src={user?.profile_image} alt={displayName} />
                                        <AvatarFallback className="rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="hidden text-left sm:block">
                                        <div className="text-sm font-medium text-foreground">{displayName}</div>
                                        <div className="text-xs text-muted-foreground">Umpire</div>
                                    </div>
                                    <ChevronDown className="mr-1 size-4 text-muted-foreground" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 rounded-xl border border-border/70 bg-background/95 p-1 shadow-lg">
                                {user ? <UserMenuContent user={user as never} /> : null}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        </div>
    );
}

