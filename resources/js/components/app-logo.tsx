import AppLogoIcon from '@/components/app-logo-icon';
const appName = import.meta.env.VITE_APP_NAME || 'GameCore Engine';

export default function AppLogo() {
    return (
        <>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/60 shadow-lg">
                <AppLogoIcon className="size-5" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    { appName }
                </span>
            </div>
        </>
    );
}
