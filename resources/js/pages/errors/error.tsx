import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, ShieldOff, Lock, ServerCrash, Home, ArrowLeft } from 'lucide-react';

interface Props {
    status: number;
    message?: string;
}

const errorConfig: Record<number, {
    title: string;
    description: string;
    icon: React.ReactNode;
    secondaryAction?: { label: string; href?: string; onClick?: () => void };
}> = {
    400: {
        title: 'Bad Request',
        description: 'The request could not be understood by the server. Please check your input and try again.',
        icon: <AlertTriangle className="h-16 w-16 text-amber-500" />,
    },
    401: {
        title: 'Unauthorized',
        description: 'You are not authorized to access this page. Please log in with the appropriate credentials.',
        icon: <Lock className="h-16 w-16 text-red-500" />,
        secondaryAction: { label: 'Go to Login', href: '/login' },
    },
    403: {
        title: 'Forbidden',
        description: 'You do not have permission to access this resource. Contact your administrator if you believe this is a mistake.',
        icon: <ShieldOff className="h-16 w-16 text-red-500" />,
    },
    404: {
        title: 'Page Not Found',
        description: 'The page you are looking for does not exist or has been moved. Check the URL or navigate back to the dashboard.',
        icon: <AlertTriangle className="h-16 w-16 text-amber-500" />,
    },
    419: {
        title: 'Session Expired',
        description: 'Your session has expired. Please refresh the page and try again.',
        icon: <AlertTriangle className="h-16 w-16 text-amber-500" />,
        secondaryAction: { label: 'Refresh Page', onClick: () => window.location.reload() },
    },
    429: {
        title: 'Too Many Requests',
        description: 'You have made too many requests in a short period. Please wait a moment and try again.',
        icon: <AlertTriangle className="h-16 w-16 text-amber-500" />,
    },
    500: {
        title: 'Server Error',
        description: 'Something went wrong on our end. Please try again later or contact support if the issue persists.',
        icon: <ServerCrash className="h-16 w-16 text-red-500" />,
    },
    503: {
        title: 'Service Unavailable',
        description: 'The service is temporarily unavailable. We are working to restore it as soon as possible. Please check back shortly.',
        icon: <ServerCrash className="h-16 w-16 text-red-500" />,
    },
};

export default function ErrorPage({ status, message }: Props) {
    const config = errorConfig[status] ?? {
        title: 'Error',
        description: message ?? 'An unexpected error occurred. Please try again.',
        icon: <AlertTriangle className="h-16 w-16 text-amber-500" />,
    };

    const goBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            router.visit('/');
        }
    };

    return (
        <>
            <Head title={`${status} - ${config.title}`} />

            <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 portrait:px-6">
                {/* Top accent bar */}
                <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

                <div className="w-full max-w-md text-center space-y-8">
                    {/* Status Code */}
                    <div className="relative">
                        <div className="text-[160px] font-black leading-none tracking-tighter text-primary/5 select-none">
                            {status}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
                                    {config.icon}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-3">
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">
                            {config.title}
                        </h1>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                            {config.description}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 pt-2">
                        {config.secondaryAction && (
                            <>
                                {config.secondaryAction.href ? (
                                    <Link
                                        href={config.secondaryAction.href}
                                        className="inline-flex items-center justify-center gap-2 w-full rounded-xl border border-border/60 bg-background py-3 text-sm font-semibold text-foreground hover:bg-accent/50 active:scale-[0.98] transition-all"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        {config.secondaryAction.label}
                                    </Link>
                                ) : (
                                    <button
                                        onClick={config.secondaryAction.onClick}
                                        className="inline-flex items-center justify-center gap-2 w-full rounded-xl border border-border/60 bg-background py-3 text-sm font-semibold text-foreground hover:bg-accent/50 active:scale-[0.98] transition-all"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        {config.secondaryAction.label}
                                    </button>
                                )}
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-border/40" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-3 text-muted-foreground">or</span>
                                    </div>
                                </div>
                            </>
                        )}

                        <button
                            onClick={goBack}
                            className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-primary/90 to-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:from-primary hover:to-primary/90 active:scale-[0.98] transition-all"
                        >
                            <Home className="h-4 w-4" />
                            Back to Dashboard
                        </button>

                        <button
                            onClick={() => router.visit('/')}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                        >
                            Go to Homepage
                        </button>
                    </div>
                </div>

                {/* Bottom accent */}
                <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
            </div>
        </>
    );
}
