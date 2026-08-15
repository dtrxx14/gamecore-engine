import { Head, Link } from '@inertiajs/react';
import {
    Trophy,
    Zap,
    Users,
    ShieldCheck,
    Layers,
    BarChart3,
    Swords,
    Calendar,
    ArrowRight,
} from 'lucide-react';
import PublicHeader from '@/components/public/public-header';
import PublicFooter from '@/components/public/public-footer';
import { login, contact } from '@/routes';

const features = [
    {
        icon: Trophy,
        title: 'Tournament Engine',
        description:
            'Create tournaments with round robin, single elimination, double elimination, pools, and fully custom formats — all in a few clicks.',
    },
    {
        icon: Zap,
        title: 'Live Match Scoring',
        description:
            'Realtime scoreboard updates with automatic standings calculation and match progression as points are scored.',
    },
    {
        icon: Users,
        title: 'Player Management',
        description:
            'Import players, organize teams, assign categories, and manage registrations effortlessly from one dashboard.',
    },
    {
        icon: Swords,
        title: 'Open Plays Queuing',
        description:
            'Free open plays queuing with unlimited courts and no limitations of use — jump in and play anytime.',
    },
    {
        icon: BarChart3,
        title: 'Automatic Standings',
        description:
            'Standings update live as matches finish. Wins, losses, points, and differentials are computed instantly.',
    },
    {
        icon: Layers,
        title: 'Flexible Categories',
        description:
            'Organize participants into categories and formats, with full control over game-to targets and scoring rules.',
    },
    {
        icon: Calendar,
        title: 'Match Scheduling',
        description:
                        'Plan and publish match schedules with bracket generation that adapts to your tournament format.',
    },
    {
        icon: ShieldCheck,
        title: 'Role-Based Access',
        description:
            'Secure dashboards for players, umpires, organizers, and admins — everyone sees exactly what they need.',
    },
];

export default function Features() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Head title="Features" />

            <PublicHeader active="features" />

            {/* Hero */}
            <section className="mx-auto max-w-7xl px-6 pt-16 pb-20 text-center md:pt-24">
                <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs uppercase tracking-widest text-primary">
                    Features
                </span>
                <h1 className="mx-auto mt-6 max-w-3xl text-3xl font-black leading-tight text-foreground sm:text-5xl lg:text-6xl">
                    Everything you need to{' '}
                    <span className="bg-gradient-to-r from-primary via-primary/60 to-primary/30 bg-clip-text text-transparent">
                        run a tournament
                    </span>
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                    A modern platform for organizing events, managing teams, and
                    tracking live scores with a professional experience players
                    and organizers love.
                </p>
            </section>

            {/* Features Grid */}
            <section className="mx-auto max-w-7xl px-6 pb-24">
                <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="group rounded-2xl border border-border bg-card p-8 transition hover:border-primary/40 hover:bg-accent"
                        >
                            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/20">
                                <feature.icon className="size-6" />
                            </div>
                            <h2 className="mb-3 text-xl font-bold text-foreground">
                                {feature.title}
                            </h2>
                            <p className="leading-7 text-muted-foreground">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="mx-auto max-w-7xl px-6 pb-24">
                <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center md:flex-row md:p-12 md:text-left">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                            Ready to build, manage, and dominate?
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            Get started with GameCore and take your tournaments to the next level.
                        </p>
                    </div>
                    <Link
                        href={login()}
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-7 py-4 font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                        Get Started
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

        <PublicFooter />
        </div>
    );
}
