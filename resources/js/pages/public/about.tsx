import { Head, Link } from '@inertiajs/react';
import {
    Zap,
    Users,
    ShieldCheck,
    Target,
    Heart,
    Sparkles,
    ArrowRight,
} from 'lucide-react';
import PublicHeader from '@/components/public/public-header';
import PublicFooter from '@/components/public/public-footer';
import { contact } from '@/routes';

const stats = [
    { value: '10,000+', label: 'Players' },
    { value: '500+', label: 'Tournaments' },
    { value: 'Unlimited', label: 'Courts' },
    { value: '100%', label: 'Secure' },
];

const values = [
    {
        icon: Target,
        title: 'Precision',
        description:
            'We obsess over accuracy in scoring, standings, and scheduling so organizers can trust the data at every step.',
    },
    {
        icon: Zap,
        title: 'Speed',
        description:
            'Realtime updates keep players, umpires, and fans in sync the moment a point is won.',
    },
    {
        icon: Heart,
        title: 'Community',
        description:
            'We build tools that bring players and organizers together around the sport they love.',
    },
    {
        icon: Sparkles,
        title: 'Simplicity',
        description:
            'Powerful features wrapped in an intuitive, minimalist interface that anyone can use.',
    },
];

export default function About() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Head title="About Us" />

            <PublicHeader active="about" />

{/* Hero */}
            <section className="mx-auto max-w-7xl px-6 pt-16 pb-20 text-center md:pt-24">
                <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs uppercase tracking-widest text-primary">
                    About Us
                </span>
                <h1 className="mx-auto mt-6 max-w-3xl text-3xl font-black leading-tight text-foreground sm:text-5xl lg:text-6xl">
                    Powering the{' '}
                    <span className="bg-gradient-to-r from-primary via-primary/60 to-primary/30 bg-clip-text text-transparent">
                        game
                    </span>{' '}
                    you love
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                    GameCore Engine is a modern tournament management platform built
                    for organizers, players, and umpires. We combine live scoring,
                    realtime standings, and seamless scheduling into one professional
                    experience.
                </p>
            </section>

            {/* Stats */}
            <section className="mx-auto max-w-7xl px-6 pb-20">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-2xl border border-border bg-card p-6 text-center"
                        >
                            <div className="text-3xl font-black text-primary md:text-4xl">
                                {stat.value}
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Mission */}
            <section className="mx-auto max-w-7xl px-6 pb-20">
                <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-8 md:p-12">
                    <div className="grid items-center gap-8 md:grid-cols-2">
                        <div>
                            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <ShieldCheck className="size-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                                Our Mission
                            </h2>
                            <p className="mt-4 leading-8 text-muted-foreground">
                                To make organizing tournaments effortless and watching
                                them thrilling. From the first bracket to the final
                                point, GameCore keeps every team, match, and score in
                                perfect sync — so you can focus on the game.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-border bg-card p-8">
                            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Users className="size-6" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">
                                Built for every role
                            </h3>
                            <p className="mt-3 leading-7 text-muted-foreground">
                                Dedicated dashboards for players, umpires, organizers,
                                and admins ensure everyone sees exactly what they need
                                — nothing more, nothing less.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="mx-auto max-w-7xl px-6 pb-20">
                <h2 className="mb-10 text-center text-2xl font-bold text-foreground md:text-3xl">
                    What we stand for
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {values.map((value) => (
                        <div
                            key={value.title}
                            className="group rounded-2xl border border-border bg-card p-8 transition hover:border-primary/40 hover:bg-accent"
                        >
                            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/20">
                                <value.icon className="size-6" />
                            </div>
                            <h3 className="mb-3 text-lg font-bold text-foreground">
                                {value.title}
                            </h3>
                            <p className="leading-7 text-muted-foreground">
                                {value.description}
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
                            Want to know more?
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            Reach out to our team and let's talk about your tournament.
                        </p>
                    </div>
                    <Link
                        href={contact()}
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-7 py-4 font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                        Contact Us
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

<PublicFooter />
        </div>
    );
}
