import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import OrganizerLayout from '@/layouts/organizer/layout';
import PlayerLayout from '@/layouts/player/layout';
import UmpireLayout from '@/layouts/umpire/layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'GameCore Engine';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            case name === 'errors/error':
                return null;
            case name.startsWith('public/'):
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('organizer/'):
                return [OrganizerLayout];
            case name.startsWith('player/'):
                return [PlayerLayout];
            case name.startsWith('umpire/'):
                return [UmpireLayout];
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
