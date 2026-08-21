import { Head } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Trophy, TrendingUp, TrendingDown, Minus, Medal, Swords, Clock, ChevronDown, ChevronRight, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface StandingTeam {
    live_configuration_id?: number;
    category_id?: number;
    rank: number;
    team_id: number;
    team_name: string;
    court_number: number;
    matches_played: number;
    wins: number;
    losses: number;
    points_for: number;
    points_against: number;
    point_differential: number;
}

interface StandingsCategory {
    live_configuration_id?: number;
    category_id: number;
    category_name: string;
    game_to: number;
    win_by: number;
    game_time: string | null;
    game_interval: string | null;
    teams: StandingTeam[];
}

interface StandingsConfiguration {
    configuration_id: number;
    configuration_name: string;
    scoring_system: string;
    pusher_channel: string;
    categories: StandingsCategory[];
}

interface StandingsPageProps {
    configurations?: {
        id: number;
        name: string;
        scoring_system: string;
        pusher_channel: string;
    }[];
    standingsByConfig?: StandingsConfiguration[];
    configuration?: {
        id: number;
        name: string;
        slug?: string;
        scoring_system: string;
        pusher_channel: string;
    } | null;
    standingsData?: StandingsConfiguration | null;
}

export default function Standings({ configurations, standingsByConfig: initialData, configuration: singleConfig, standingsData: singleData }: StandingsPageProps) {
    // Single-config (slug) mode: use the passed configuration/standingsData directly.
    const isSingleMode = !!singleConfig && !!singleData;
    const effectiveConfigs = isSingleMode
        ? [{ id: singleConfig.id, name: singleConfig.name, scoring_system: singleConfig.scoring_system, pusher_channel: singleConfig.pusher_channel }]
        : (configurations ?? []);
    const [standingsByConfig, setStandingsByConfig] = useState<StandingsConfiguration[]>(isSingleMode ? [singleData!] : (initialData ?? []));
    const slug = singleConfig?.slug;
    const [expandedConfigs, setExpandedConfigs] = useState<Record<number, boolean>>({});
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
    const [isPolling, setIsPolling] = useState(false);
    const [connected, setConnected] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const echoRef = useRef<any>(null);
    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Toggle configuration expand
    const toggleConfig = (configId: number) => {
        setExpandedConfigs(prev => ({
            ...prev,
            [configId]: !prev[configId],
        }));
    };

    // Toggle category expand
    const toggleCategory = (key: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    // Expanded all by default
    useEffect(() => {
        const configMap: Record<number, boolean> = {};
        const catMap: Record<string, boolean> = {};
        standingsByConfig.forEach(config => {
            configMap[config.configuration_id] = true;
            config.categories.forEach(cat => {
                catMap[`${config.configuration_id}-${cat.category_id}`] = true;
            });
        });
        setExpandedConfigs(configMap);
        setExpandedCategories(catMap);
    }, [standingsByConfig]);

    // Auto-scroll to config from hash
    useEffect(() => {
        if (window.location.hash) {
            const id = window.location.hash.replace('#', '');
            setTimeout(() => {
                const el = document.getElementById(id);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
    }, [standingsByConfig]);

    // Set up Pusher real-time listeners
    useEffect(() => {
        let isSubscribed = true;

        const initEcho = async () => {
            try {
                const echoModule = await import('@/echo');
                const echo = echoModule.default;
                echoRef.current = echo;

// Subscribe to each active configuration
                effectiveConfigs.forEach(config => {
                    const channelName = `standings.${config.id}`;
                    console.log(`[Standings] Subscribing to channel: ${channelName}`);

                    const channel = echo.channel(channelName);
                    channel.listen('.standings.updated', (event: any) => {
                        console.log(`[Standings] Received update for config ${config.id}:`, event);
                        if (isSubscribed) {
                            handleStandingsUpdate(config.id, event);
                        }
                    });
                });

                setConnected(true);
            } catch (err) {
                console.warn('[Standings] Failed to initialize Echo, falling back to polling:', err);
                setConnected(false);
                startPolling();
            }
        };

        initEcho();

return () => {
            isSubscribed = false;
            if (echoRef.current) {
                effectiveConfigs.forEach(config => {
                    try {
                        echoRef.current.leave(`standings.${config.id}`);
                    } catch (e) {
                        // ignore
                    }
                });
            }
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [configurations, effectiveConfigs]);

    const handleStandingsUpdate = (configId: number, event: any) => {
        const updatedCategories: StandingsCategory[] = Array.isArray(event?.standings)
            ? event.standings
            : Array.isArray(event?.data)
                ? event.data
                : [];

        setStandingsByConfig(prev => {
            const configExists = prev.some(config => config.configuration_id === configId);

            if (!configExists && updatedCategories.length > 0) {
                return [
                    ...prev,
                    {
                        configuration_id: configId,
                        configuration_name: `Live Configuration ${configId}`,
                        scoring_system: 'side-out',
                        pusher_channel: `standings.${configId}`,
                        categories: updatedCategories,
                    },
                ];
            }

            return prev.map(config => {
                if (config.configuration_id !== configId) return config;

                const updatedByCategory = new Map<number, StandingsCategory>();
                updatedCategories.forEach((category: StandingsCategory) => {
                    updatedByCategory.set(Number(category.category_id), category);
                });

                return {
                    ...config,
                    categories: (config.categories ?? []).map(existingCat => {
                        const updatedCat = updatedByCategory.get(existingCat.category_id);
                        if (!updatedCat) {
                            return existingCat;
                        }

                        return {
                            ...existingCat,
                            category_name: updatedCat.category_name ?? existingCat.category_name,
                            game_to: updatedCat.game_to ?? existingCat.game_to,
                            win_by: updatedCat.win_by ?? existingCat.win_by,
                            game_time: updatedCat.game_time ?? existingCat.game_time,
                            game_interval: updatedCat.game_interval ?? existingCat.game_interval,
                            teams: Array.isArray(updatedCat.teams) ? updatedCat.teams : existingCat.teams,
                        };
                    }),
                };
            });
        });

        setLastUpdated(new Date());
    };

const startPolling = () => {
        if (pollingIntervalRef.current) return;
        setIsPolling(true);

        pollingIntervalRef.current = setInterval(async () => {
            try {
                const url = slug ? `/api/${slug}/standings` : '/api/standings';
                const response = await fetch(url);
                const json = await response.json();
                if (json.success && json.data) {
                    if (slug) {
                        // Single-config mode: replace the single entry with fresh data.
                        setStandingsByConfig([json.data]);
                    } else {
                        setStandingsByConfig(json.data);
                    }
                    setLastUpdated(new Date());
                }
            } catch (err) {
                console.warn('[Standings] Polling error:', err);
            }
        }, 5000);
    };

    // Format time ago
    const timeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 10) return 'just now';
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        return `${Math.floor(minutes / 60)}h ago`;
    };

    // Filter teams by search query
    const filterTeams = (teams: StandingTeam[]) => {
        if (!searchQuery.trim()) return teams;
        const q = searchQuery.toLowerCase();
        return teams.filter(team => team.team_name.toLowerCase().includes(q));
    };

    if (!standingsByConfig || standingsByConfig.length === 0) {
        return (
            <>
                <Head title="Standings" />
                <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900">
                    <div className="text-center">
                        <Trophy className="mx-auto mb-4 h-16 w-16 text-amber-400/50" />
                        <h1 className="mb-2 text-2xl font-bold text-white">No Active Standings</h1>
                        <p className="text-gray-400">There are no active live configurations with standings available.</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Live Standings" />

            <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.18),_transparent_40%),linear-gradient(180deg,#111827_0%,#0f172a_40%,#111827_100%)] text-slate-100">
                <div className="sticky top-0 z-50 border-b border-red-500/10 bg-slate-950/80 backdrop-blur-xl">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 shadow-[0_8px_30px_rgba(239,68,68,0.2)]">
                                <AppLogoIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-white sm:text-xl">Live Standings</h1>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-red-300/80">GameCore</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {connected ? (
                                <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-300">
                                    <Wifi className="h-3.5 w-3.5" />
                                    Live
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-amber-300">
                                    <WifiOff className="h-3.5 w-3.5" />
                                    Polling
                                </span>
                            )}
                            <span className="text-xs text-slate-400">
                                Updated {timeAgo(lastUpdated)}
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-red-500/10 px-4 py-3 sm:px-6 lg:px-8">
                        <div className="flex justify-center mx-auto max-w-6xl">
                            <input
                                type="text"
                                placeholder="Search teams..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="h-16 text-xl w-7xl px-4 rounded-xl border border-red-500/20 bg-white/5 text-white placeholder-slate-400 outline-none transition-all focus:border-red-400/60 focus:bg-white/10"
                            />
                        </div>
                    </div>
                </div>

                <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
                    <div className="space-y-6">
                        {standingsByConfig.map(config => {
                            const isConfigExpanded = expandedConfigs[config.configuration_id] ?? true;
                            const categoriesWithTeams = (config.categories ?? []).filter(category => category.teams?.length > 0);

                            if (categoriesWithTeams.length === 0) {
                                return null;
                            }

                            return (
                                <div
                                    key={config.configuration_id}
                                    id={`config-${config.configuration_id}`}
                                    className="overflow-hidden rounded-2xl border border-red-500/10 bg-slate-900/70 shadow-[0_18px_45px_rgba(15,23,42,0.45)] backdrop-blur-sm"
                                >
                                    <button
                                        onClick={() => toggleConfig(config.configuration_id)}
                                        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-red-500/5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
                                                <Medal className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-semibold text-white">
                                                    {config.configuration_name}
                                                </h2>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-red-300">
                                                        {config.scoring_system === 'rally-point' ? 'Rally Point' : 'Side Out'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {isConfigExpanded ? (
                                            <ChevronDown className="h-5 w-5 text-slate-400" />
                                        ) : (
                                            <ChevronRight className="h-5 w-5 text-slate-400" />
                                        )}
                                    </button>

                                    {isConfigExpanded && (
                                        <div className="border-t border-red-500/10 bg-slate-950/30">
                                            {categoriesWithTeams.map(category => {
                                                const catKey = `${config.configuration_id}-${category.category_id}`;
                                                const isCatExpanded = expandedCategories[catKey] ?? true;
                                                const filteredTeams = filterTeams(category.teams);

                                                return (
                                                    <div key={category.category_id} className="border-b border-red-500/10 last:border-b-0">
                                                        <button
                                                            onClick={() => toggleCategory(catKey)}
                                                            className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-red-500/5"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-300">
                                                                    <Swords className="h-4 w-4" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-sm font-semibold text-slate-100">{category.category_name}</h3>
                                                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                                                                        <span>First to {category.game_to}</span>
                                                                        <span>Win by {category.win_by}</span>
                                                                        {category.game_time && <span>{category.game_time} min game</span>}
                                                                        {category.game_interval && <span>{category.game_interval} interval</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-slate-400">
                                                                    {filteredTeams.length} team{filteredTeams.length !== 1 ? 's' : ''}
                                                                </span>
                                                                {isCatExpanded ? (
                                                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                                                ) : (
                                                                    <ChevronRight className="h-4 w-4 text-slate-400" />
                                                                )}
                                                            </div>
                                                        </button>

                                                        {isCatExpanded && (
                                                            <div className="overflow-x-auto px-5 pb-4">
                                                                {filteredTeams.length === 0 ? (
                                                                    <p className="py-8 text-center text-sm text-slate-400">
                                                                        {searchQuery ? 'No teams match your search.' : 'No teams in this category yet.'}
                                                                    </p>
                                                                ) : (
                                                                    <table className="w-full text-left text-sm">
                                                                        <thead>
                                                                            <tr className="border-b border-red-500/10 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                                                                                <th className="py-2 pr-2 font-medium">#</th>
                                                                                <th className="py-2 px-2 font-medium">Team</th>
                                                                                <th className="py-2 px-2 text-center font-medium">MP</th>
                                                                                <th className="py-2 px-2 text-center font-medium">W</th>
                                                                                <th className="py-2 px-2 text-center font-medium">L</th>
                                                                                <th className="py-2 px-2 text-center font-medium">PF</th>
                                                                                <th className="py-2 px-2 text-center font-medium">PA</th>
                                                                                <th className="py-2 px-2 text-center font-medium">PD</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {filteredTeams.map((team, index) => {
                                                                                const isTop3 = index < 3;
                                                                                const medalClasses = ['text-amber-300', 'text-slate-300', 'text-amber-500'];
                                                                                const rowClasses = ['bg-red-500/5', 'bg-white/5', 'bg-red-500/10'];

                                                                                return (
                                                                                    <tr
                                                                                        key={`${team.live_configuration_id}-${team.category_id}-${team.team_id}`}
                                                                                        className={`border-b border-red-500/5 transition-colors hover:bg-red-500/5 ${isTop3 ? rowClasses[index] : ''}`}
                                                                                    >
                                                                                        <td className="py-2.5 pr-2">
                                                                                            {isTop3 ? (
                                                                                                <span className={`inline-flex items-center justify-center ${medalClasses[index]}`}>
                                                                                                    {index === 0 ? (
                                                                                                        <Trophy className="h-4 w-4" />
                                                                                                    ) : (
                                                                                                        <Medal className="h-4 w-4" />
                                                                                                    )}
                                                                                                </span>
                                                                                            ) : (
                                                                                                <span className="text-slate-500">{team.rank}</span>
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="max-w-[180px] truncate px-2 font-medium text-white sm:max-w-[220px]">
                                                                                            {team.team_name}
                                                                                        </td>
                                                                                        <td className="px-2 text-center text-slate-300">{team.matches_played}</td>
                                                                                        <td className="px-2 text-center text-emerald-400">{team.wins}</td>
                                                                                        <td className="px-2 text-center text-red-400">{team.losses}</td>
                                                                                        <td className="px-2 text-center text-slate-200">{team.points_for}</td>
                                                                                        <td className="px-2 text-center text-slate-200">{team.points_against}</td>
                                                                                        <td className="px-2 text-center">
                                                                                            <span
                                                                                                className={`inline-flex items-center gap-0.5 ${
                                                                                                    team.point_differential > 0
                                                                                                        ? 'text-emerald-400'
                                                                                                        : team.point_differential < 0
                                                                                                          ? 'text-red-400'
                                                                                                          : 'text-slate-400'
                                                                                                }`}
                                                                                            >
                                                                                                {team.point_differential > 0 ? (
                                                                                                    <TrendingUp className="h-3 w-3" />
                                                                                                ) : team.point_differential < 0 ? (
                                                                                                    <TrendingDown className="h-3 w-3" />
                                                                                                ) : (
                                                                                                    <Minus className="h-3 w-3" />
                                                                                                )}
                                                                                                {team.point_differential > 0 ? '+' : ''}
                                                                                                {team.point_differential}
                                                                                            </span>
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                        </tbody>
                                                                    </table>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-red-500/10 pt-4 text-xs text-slate-500">
                        <span className="flex items-center gap-2"><AppLogoIcon className="h-4 w-4" />GameCore Live Standings</span>
                        <div className="flex items-center gap-2">
                            {isPolling && (
                                <RefreshCw className="h-3 w-3 animate-spin text-red-300" />
                            )}
                            <Clock className="h-3 w-3" />
                            <span>Updated {timeAgo(lastUpdated)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
