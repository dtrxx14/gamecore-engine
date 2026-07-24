import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, UserRound, ArrowLeft } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { profile } from '@/routes/player';
import { edit } from '@/routes/profile';
import type { User } from '@/types';


type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    const adminRole = user.role?.slug;
    const isOrganizer = user?.organization_memberships?.map((membership) => membership.role?.slug).some((role) => role === 'admin' || role === 'umpire') ?? false;
    
    const profileLink = adminRole === 'admin' ? edit() : profile();

    const { url } = usePage();

    const isOrganizerPage = url.startsWith('/organizer');

    const dashboardLink = isOrganizerPage
        ? '/player/dashboard'
        : '/organizer/dashboard';

    const dashboardLabel = isOrganizerPage
        ? 'Player Dashboard'
        : 'Organizations';

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                { isOrganizer && (
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href={dashboardLink}
                        prefetch
                        onClick={cleanup}
                    >
                        <ArrowLeft className="mr-2" />
                        {dashboardLabel}
                    </Link>
                </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href={profileLink}
                        prefetch
                        onClick={cleanup}
                    >
                        <UserRound className="mr-2" />
                        Profile
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link
                    className="block w-full cursor-pointer"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2" />
                    Log out
                </Link>
            </DropdownMenuItem>
        </>
    );
}
