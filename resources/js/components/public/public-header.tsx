import { Link } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home, login } from '@/routes';
import { cn } from '@/lib/utils';

type Props = {
    active?: 'home' | 'features' | 'about' | 'contact';
};

const navItems = [
    { label: 'Home', href: '/', key: 'home' },
    { label: 'Features', href: '/features', key: 'features' },
    { label: 'About', href: '/about', key: 'about' },
    { label: 'Contact', href: '/contact', key: 'contact' },
] as const;

export default function PublicHeader({ active }: Props) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 md:px-6 md:py-5">
                    {/* Mobile hamburger */}
                    <button
                        type="button"
                        onClick={() => setMobileOpen((v) => !v)}
                        aria-label="Toggle navigation"
                        className="inline-flex items-center justify-center rounded-xl border border-border bg-muted p-2.5 text-foreground transition hover:border-primary/40 md:hidden"
                    >
                        {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
                    </button>

                    {/* Logo */}
                    <div className="flex flex-1 md:flex-none md:justify-start">
                        <Link href={home()} className="flex items-center">
                            <AppLogoIcon className="size-10 md:size-20" />
                            <p className="flex flex-inline uppercase tracking-[4px] text-muted-foreground">
                                <img
                                    className="h-6 w-auto md:h-16 dark:hidden"
                                    src="/application-logo/gamecore-text-logo.png"
                                    alt="GameCore Text Logo"
                                />
                                <img
                                    className="hidden h-6 w-auto md:h-16 dark:block"
                                    src="/application-logo/gamecore-text-logo-light.png"
                                    alt="GameCore Text Logo"
                                />
                            </p>
                        </Link>
                    </div>

                    {/* Desktop nav */}
                    <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
                        {navItems.map((item) => (
                            <Link
                                key={item.key}
                                href={item.href}
                                className={cn(
                                    'transition hover:text-foreground',
                                    active === item.key && 'text-foreground font-medium',
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right - login */}
                    <div className="flex flex-1 justify-end md:flex-none">
                        <Link
                            href={login()}
                            className="inline-flex items-center justify-center rounded-xl border border-border bg-muted px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:text-primary md:px-5 md:py-2.5"
                        >
                            Log in
                        </Link>
                    </div>
                </div>
            </header>

            {/* Mobile drawer - rendered as sibling of header so `fixed` covers the full viewport */}
            {mobileOpen && (
                <div className="fixed inset-0 z-[100] md:hidden">
                    <div
                        className="absolute inset-0 animate-[fade-in_0.2s_ease] bg-black/40 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />
                    <div
                        className="absolute top-0 left-0 flex h-full w-72 animate-[slide-in_0.3s_ease] flex-col border-r border-border bg-background"
                        style={{ backgroundColor: 'var(--background)', backgroundImage: 'none' }}
                    >
                        <div className="flex items-center justify-between border-b border-border px-5 py-4">
                            <Link href={home()} className="flex items-center gap-2">
                                <AppLogoIcon className="size-9" />
                                <p className="flex flex-inline uppercase tracking-[3px] text-muted-foreground">
                                    <img
                                        className="h-5 w-auto dark:hidden"
                                        src="/application-logo/gamecore-text-logo.png"
                                        alt="GameCore Text Logo"
                                    />
                                    <img
                                        className="hidden h-5 w-auto dark:block"
                                        src="/application-logo/gamecore-text-logo-light.png"
                                        alt="GameCore Text Logo"
                                    />
                                </p>
                            </Link>
                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                aria-label="Close navigation"
                                className="inline-flex items-center justify-center rounded-lg border border-border bg-muted p-2 text-foreground"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <nav className="flex flex-col gap-1 p-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        'rounded-lg px-4 py-3 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground',
                                        active === item.key && 'bg-muted text-foreground font-medium',
                                    )}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        <div className="mt-auto border-t border-border p-4">
                            <Link
                                href={login()}
                                onClick={() => setMobileOpen(false)}
                                className="flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                            >
                                Log in
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

