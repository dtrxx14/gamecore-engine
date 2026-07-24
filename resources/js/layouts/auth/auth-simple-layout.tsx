import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[radial-gradient(circle_at_top,rgba(255,91,91,0.12),transparent_42%),linear-gradient(180deg,var(--background),color-mix(in_srgb,var(--background)_85%,var(--primary)_15%))] p-6 md:p-10 dark:bg-[radial-gradient(circle_at_top,rgba(255,91,91,0.2),transparent_42%),linear-gradient(180deg,#140b0b_0%,#1d1010_100%)]">
            <div className="w-full max-w-auto">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
                                <AppLogoIcon className="size-9" />
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-center text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
