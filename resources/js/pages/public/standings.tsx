import { Head } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Medal, Swords, Clock, ChevronDown, ChevronRight, Users, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface StandingTeam {
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
    category_id: number;
    category_name: string;
    game_to: number;
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
        // The event structure from StandingsUpdated event sends:
        // { configurationId, standings: [{ category_id, category_name, game_to, teams: [...] }] }
        const updatedCategories = event.standings || event.data || [];

        setStandingsByConfig(prev => {
            return prev.map(config => {
                if (config.configuration_id !== configId) return config;

                return {
                    ...config,
                    categories: config.categories.map(existingCat => {
                        const updatedCat = updatedCategories.find(
                            (uc: any) => uc.category_id === existingCat.category_id
                        );
                        if (updatedCat) {
                            return {
                                ...existingCat,
                                teams: updatedCat.teams || existingCat.teams,
                            };
                        }
                        return existingCat;
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

            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900">
                {/* Header */}
                <div className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <Trophy className="h-7 w-7 text-amber-400" />
                            <h1 className="text-xl font-bold text-white sm:text-2xl">Live Standings</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            {connected ? (
                                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                                    <Wifi className="h-3.5 w-3.5" />
                                    Live
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-xs text-amber-400">
                                    <WifiOff className="h-3.5 w-3.5" />
                                    Polling
                                </span>
                            )}
                            <span className="text-xs text-gray-500">
                                Updated {timeAgo(lastUpdated)}
                            </span>
                        </div>
                    </div>

                    {/* Search bar */}
                    <div className="border-t border-white/5 px-4 py-2 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-7xl">
                            <input
                                type="text"
                                placeholder="Search teams..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-amber-500/50 focus:bg-white/10"
                            />
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
                    <div className="space-y-6">
                        {standingsByConfig.map(config => {
                            const isConfigExpanded = expandedConfigs[config.configuration_id] ?? true;

                            return (
                                <div
                                    key={config.configuration_id}
                                    id={`config-${config.configuration_id}`}
                                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
                                >
                                    {/* Configuration Header */}
                                    <button
                                        onClick={() => toggleConfig(config.configuration_id)}
                                        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-white/5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Medal className="h-5 w-5 text-amber-400" />
                                            <h2 className="text-lg font-semibold text-white">
                                                {config.configuration_name}
                                            </h2>
                                            <span className="rounded-full bg-amber-400/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                                                {config.scoring_system === 'rally-point' ? 'Rally Point' : 'Standard'}
                                            </span>
                                        </div>
                                        {isConfigExpanded ? (
                                            <ChevronDown className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <ChevronRight className="h-5 w-5 text-gray-400" />
                                        )}
                                    </button>

                                    {/* Categories */}
                                    {isConfigExpanded && (
                                        <div className="border-t border-white/5">
                                            {config.categories.map(category => {
                                                const catKey = `${config.configuration_id}-${category.category_id}`;
                                                const isCatExpanded = expandedCategories[catKey] ?? true;
                                                const filteredTeams = filterTeams(category.teams);

                                                return (
                                                    <div key={category.category_id} className="border-b border-white/5 last:border-b-0">
                                                        {/* Category Header */}
                                                        <button
                                                            onClick={() => toggleCategory(catKey)}
                                                            className="flex w-full items-center justify-between px-6 py-3 text-left transition-colors hover:bg-white/5"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Swords className="h-4 w-4 text-gray-400" />
                                                                <h3 className="text-sm font-medium text-gray-300">
                                                                    {category.category_name}
                                                                </h3>
                                                                <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-gray-500">
                                                                    First to {category.game_to}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-gray-500">
                                                                    {filteredTeams.length} team{filteredTeams.length !== 1 ? 's' : ''}
                                                                </span>
                                                                {isCatExpanded ? (
                                                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                                                ) : (
                                                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                                                )}
                                                            </div>
                                                        </button>

                                                        {/* Teams Table */}
                                                        {isCatExpanded && (
                                                            <div className="overflow-x-auto px-6 pb-4">
                                                                {filteredTeams.length === 0 ? (
                                                                    <p className="py-8 text-center text-sm text-gray-500">
                                                                        {searchQuery ? 'No teams match your search.' : 'No teams in this category yet.'}
                                                                    </p>
                                                                ) : (
                                                                    <table className="w-full text-left text-sm">
                                                                        <thead>
                                                                            <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-gray-500">
                                                                                <th className="py-2 pr-2 font-medium">#</th>
                                                                                <th className="py-2 px-2 font-medium">Team</th>
                                                                                <th className="py-2 px-2 font-medium text-center">MP</th>
                                                                                <th className="py-2 px-2 font-medium text-center">W</th>
                                                                                <th className="py-2 px-2 font-medium text-center">L</th>
                                                                                <th className="py-2 px-2 font-medium text-center">PF</th>
                                                                                <th className="py-2 px-2 font-medium text-center">PA</th>
                                                                                <th className="py-2 px-2 font-medium text-center">PD</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {filteredTeams.map((team, index) => {
                                                                                const isTop3 = index < 3;
                                                                                const medalColors = ['text-amber-400', 'text-gray-300', 'text-amber-700'];
                                                                                const bgColors = [
                                                                                    'bg-amber-400/5',
                                                                                    'bg-gray-300/5',
                                                                                    'bg-amber-700/5',
                                                                                ];

                                                                                return (
                                                                                    <tr
                                                                                        key={team.team_id}
                                                                                        className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${isTop3 ? bgColors[index] : ''}`}
                                                                                    >
                                                                                        <td className="py-2.5 pr-2">
                                                                                            {isTop3 ? (
                                                                                                <span className={`flex items-center justify-center ${medalColors[index]}`}>
                                                                                                    {index === 0 ? (
                                                                                                        <Trophy className="h-4 w-4" />
                                                                                                    ) : (
                                                                                                        <Medal className="h-4 w-4" />
                                                                                                    )}
                                                                                                </span>
                                                                                            ) : (
                                                                                                <span className="text-gray-500">{team.rank}</span>
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="max-w-[140px] truncate px-2 font-medium text-white sm:max-w-[200px]">
                                                                                            {team.team_name}
                                                                                        </td>
                                                                                        <td className="px-2 text-center text-gray-400">{team.matches_played}</td>
                                                                                        <td className="px-2 text-center text-emerald-400">{team.wins}</td>
                                                                                        <td className="px-2 text-center text-red-400">{team.losses}</td>
                                                                                        <td className="px-2 text-center text-gray-300">{team.points_for}</td>
                                                                                        <td className="px-2 text-center text-gray-300">{team.points_against}</td>
                                                                                        <td className="px-2 text-center">
                                                                                            <span
                                                                                                className={`inline-flex items-center gap-0.5 ${
                                                                                                    team.point_differential > 0
                                                                                                        ? 'text-emerald-400'
                                                                                                        : team.point_differential < 0
                                                                                                          ? 'text-red-400'
                                                                                                          : 'text-gray-400'
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

                    {/* Footer */}
                    <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-4 text-xs text-gray-600">
                        <span>GameCore Live Standings</span>
                        <div className="flex items-center gap-2">
                            {isPolling && (
                                <RefreshCw className="h-3 w-3 animate-spin" />
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
