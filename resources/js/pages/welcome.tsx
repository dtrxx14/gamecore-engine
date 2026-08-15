import { Link } from "@inertiajs/react";
import {
    ArrowRight,
    Trophy,
    Users,
    ShieldCheck,
    Zap,
} from "lucide-react";
import PublicHeader from '@/components/public/public-header';
import PublicFooter from '@/components/public/public-footer';

export default function Welcome() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
            {/* Background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[180px]" />
                <div className="absolute bottom-0 left-0 h-[350px] w-[350px] rounded-full bg-primary/10 blur-[150px]" />
            </div>

            <PublicHeader active="home" />

            {/* Hero */}
            <section className="mx-auto flex min-h-[80vh] max-w-7xl items-center px-6 pt-10 mb-4">
                <div className="grid w-full items-center gap-12 lg:grid-cols-2 lg:gap-20">
                    <div>
                        <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs uppercase tracking-widest text-primary">
                            Tournament Management Platform
                        </span>

                        <h1 className="mt-8 text-4xl font-black leading-tight sm:text-5xl lg:text-7xl">
                            Build.
                            <br />
                            Manage.
                            <br />
                            <span className="bg-gradient-to-r from-primary via-primary/60 to-foreground bg-clip-text text-transparent">
                                Dominate.
                            </span>
                        </h1>

                        <p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground">
                            GameCore Engine is a modern platform for organizing
                            tournaments, managing teams, tracking live scores,
                            and delivering a professional experience for players
                            and organizers.
                        </p>

                        <div className="mt-10 flex flex-wrap gap-4">
                            <Link
                                href="/login"
                                className="flex items-center gap-2 rounded-xl bg-primary px-7 py-4 font-semibold text-primary-foreground transition hover:bg-primary/90"
                            >
                                Get Started
                                <ArrowRight size={18} />
                            </Link>

                            <button className="rounded-xl border border-border bg-muted px-7 py-4 text-foreground transition hover:border-primary/50">
                                Learn More
                            </button>
                        </div>
                    </div>

                    {/* Hero Card */}
                    <div className="relative mb-4 lg:mb-0">
                        <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-card p-8 backdrop-blur-xl">

                            <div className="grid grid-cols-2 gap-5">
                                <StatCard
                                    icon={<Trophy size={30} />}
                                    title="Tournaments"
                                    value="Unlimited"
                                />

                                <StatCard
                                    icon={<Users size={30} />}
                                    title="Players"
                                    value="10,000+"
                                />

                                <StatCard
                                    icon={<ShieldCheck size={30} />}
                                    title="Secure"
                                    value="100%"
                                />

                                <StatCard
                                    icon={<Zap size={30} />}
                                    title="Live Scoring"
                                    value="Realtime"
                                />
                            </div>

                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section
                id="features"
                className="mx-auto max-w-7xl px-6 pb-24"
            >
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">

                    <FeatureCard
                        title="Tournament Engine"
                        text="Create tournaments with round robin, single elimination, double elimination, pools, and custom formats."
                    />

                    <FeatureCard
                        title="Live Match Scoring"
                        text="Realtime scoreboard updates with automatic standings and match progression."
                    />

                    <FeatureCard
                        title="Player Management"
                        text="Import players, organize teams, assign categories, and manage registrations effortlessly."
                    />

                    <FeatureCard
                        title="Open Plays Queuing"
                        text="Free open plays queuing with unlimited courts and no limitations of use — jump in and play anytime."
                    />

                </div>
            </section>

            <PublicFooter />
        </div>
    );
}

function FeatureCard({
    title,
    text,
}: {
    title: string;
    text: string;
}) {
    return (
        <div className="rounded-2xl border border-border bg-card p-8 transition hover:border-primary/30 hover:bg-accent/30">
            <h3 className="mb-3 text-xl font-bold">{title}</h3>
            <p className="leading-7 text-muted-foreground">{text}</p>
        </div>
    );
}

function StatCard({
    icon,
    title,
    value,
}: {
    icon: React.ReactNode;
    title: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-border bg-card/60 p-6">
            <div className="mb-5 text-primary">{icon}</div>

            <p className="text-sm text-muted-foreground">{title}</p>

            <h2 className="mt-2 text-2xl font-bold">{value}</h2>
        </div>
    );
}
