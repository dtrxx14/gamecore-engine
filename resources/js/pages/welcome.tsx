import { Link, usePage } from "@inertiajs/react";
import {
    ArrowRight,
    Trophy,
    Users,
    ShieldCheck,
    Zap,
} from "lucide-react";
import AppLogoIcon from '@/components/app-logo-icon';
import { dashboard, login } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;

    const role = auth.user?.role.slug;

    const dashboards = {
        admin: dashboard(),
        player: '/player/dashboard', // or playerDashboard() if you have a Ziggy route
    };

    const dashboardUrl = dashboards[role as keyof typeof dashboards] ?? dashboard();

    return (
        <div className="min-h-screen bg-[#090909] text-white overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-red-600/20 blur-[180px]" />
                <div className="absolute bottom-0 left-0 h-[350px] w-[350px] rounded-full bg-red-700/10 blur-[150px]" />
            </div>

            {/* Navbar */}
            <header className="border-b border-white/5 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                    <div>
                        <div className="flex shadow-lg">
                            <AppLogoIcon className="size-20" />
                            <p className="flex flex-inline uppercase tracking-[4px] text-gray-500">
                                <img className="size-20 w-100"
                                    src="/application-logo/gamecore-text-logo.png"
                                    alt="GameCore Text Logo"
                                />
                            </p>
                        </div>

                        
                    </div>

                    <nav className="hidden gap-10 text-sm text-gray-400 md:flex">
                        <a href="#features" className="hover:text-white">
                            Features
                        </a>

                        <a href="#about" className="hover:text-white">
                            About
                        </a>

                        <a href="#contact" className="hover:text-white">
                            Contact
                        </a>
                    </nav>

                    {auth.user ? (
                        <Link
                            href={dashboardUrl}
                            className="inline-flex items-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-200 hover:bg-red-500 hover:shadow-red-500/30"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link
                                href={login()}
                                className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-300 backdrop-blur transition-all duration-200 hover:border-red-500/40 hover:bg-red-500/10 hover:text-white"
                            >
                                Log in
                            </Link>
                        </div>
                    )}
                </div>
            </header>

            {/* Hero */}
            <section className="mx-auto flex min-h-[80vh] max-w-7xl items-center px-6">
                <div className="grid w-full items-center gap-20 lg:grid-cols-2">
                    <div>
                        <span className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs uppercase tracking-widest text-red-400">
                            Tournament Management Platform
                        </span>

                        <h1 className="mt-8 text-5xl font-black leading-tight lg:text-7xl">
                            Build.
                            <br />
                            Manage.
                            <br />
                            <span className="bg-gradient-to-r from-red-500 via-red-400 to-white bg-clip-text text-transparent">
                                Dominate.
                            </span>
                        </h1>

                        <p className="mt-8 max-w-xl text-lg leading-8 text-gray-400">
                            GameCore Engine is a modern platform for organizing
                            tournaments, managing teams, tracking live scores,
                            and delivering a professional experience for players
                            and organizers.
                        </p>

                        <div className="mt-10 flex flex-wrap gap-4">
                            <Link
                                href="/login"
                                className="flex items-center gap-2 rounded-xl bg-red-600 px-7 py-4 font-semibold transition hover:bg-red-500"
                            >
                                Get Started
                                <ArrowRight size={18} />
                            </Link>

                            <button className="rounded-xl border border-white/10 px-7 py-4 transition hover:border-red-500">
                                Learn More
                            </button>
                        </div>
                    </div>

                    {/* Hero Card */}
                    <div className="relative">
                        <div className="rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-600/10 to-black p-8 backdrop-blur-xl">

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
                <div className="grid gap-8 md:grid-cols-3">

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

                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-10 text-center text-sm text-gray-500">
                © {new Date().getFullYear()} GameCore Engine.
                All rights reserved.
            </footer>
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
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition hover:border-red-500/30 hover:bg-white/[0.04]">
            <h3 className="mb-3 text-xl font-bold">{title}</h3>
            <p className="leading-7 text-gray-400">{text}</p>
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
        <div className="rounded-2xl border border-white/5 bg-black/40 p-6">
            <div className="mb-5 text-red-500">{icon}</div>

            <p className="text-sm text-gray-400">{title}</p>

            <h2 className="mt-2 text-2xl font-bold">{value}</h2>
        </div>
    );
}