import { Head } from '@inertiajs/react';
import { useEffect, useState, useRef, useCallback } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    Trophy, Swords, Clock, Users, RefreshCw, Wifi, WifiOff, Pause
} from 'lucide-react';
import echo from '@/echo';

interface Player {
    id: number;
    first_name: string | null;
    last_name: string | null;
    profile_image: string | null;
}

interface Team {
    id: number;
    name: string;
    players: Player[];
}

interface NextTeam {
    id: number;
    name: string;
}

interface NextCategory {
    id: number;
    name: string;
}

interface Category {
    id: number;
    name: string;
    game_to: number;
    game_time: string | null;
}

interface Court {
    court_number: number;
    phase: 'idle' | 'setup' | 'playing' | 'paused' | 'finished';
    is_paused: boolean;
    category: Category | null;
    team_a: Team | null;
    team_b: Team | null;
    team_a_score: number;
    team_b_score: number;
    team_a_court: 'left' | 'right' | null;
    team_b_court: 'left' | 'right' | null;
    serving_team: 'team_a' | 'team_b' | null;
    service_number: number;
    rally_count: number;
    time_remaining: number | null;
    next_team_a: NextTeam | null;
    next_team_b: NextTeam | null;
    next_category: NextCategory | null;
}

interface Configuration {
    configuration_id: number;
    configuration_name: string;
    number_of_courts: number;
    scoring_system: string;
    pusher_channel: string;
    courts: Court[];
    recent_completed: {
        court_number: number;
        team_a_name: string;
        team_b_name: string;
        team_a_score: number;
        team_b_score: number;
        category_name: string;
    }[];
}

interface Props {
    configurations?: { id: number; name: string; number_of_courts: number; scoring_system: string; pusher_channel: string }[];
    courtsByConfig?: Configuration[];
    configuration?: { id: number; name: string; slug?: string; number_of_courts: number; scoring_system: string; pusher_channel: string } | null;
    courtsData?: Configuration | null;
}

export default function Courts({ configurations: initialConfigs, courtsByConfig: initialData, configuration: singleConfig, courtsData: singleData }: Props) {
    // Single-config (slug) mode: use the passed configuration/courtsData directly.
    const isSingleMode = !!singleConfig && !!singleData;
    const [configs, setConfigs] = useState<Configuration[]>(isSingleMode ? [singleData!] : (initialData ?? []));
    const [selectedConfigId, setSelectedConfigId] = useState<number | null>(isSingleMode ? singleData!.configuration_id : null);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'polling'>('connected');
    const [timeDisplay, setTimeDisplay] = useState<Record<string, number>>({});
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const slug = singleConfig?.slug;

    // Auto-select first configuration (multi-config mode only)
    useEffect(() => {
        if (configs.length > 0 && !selectedConfigId) {
            setSelectedConfigId(configs[0].configuration_id);
        }
    }, [configs, selectedConfigId]);

    // Live countdown timer for time_remaining.
    // Only decrements timers for courts that are actively playing.
    // When a court is paused (is_paused / phase 'paused'), its timer stays frozen
    // so it stays in sync with the umpire's pause state.
    useEffect(() => {
        const pausedKeys = new Set<string>();
        for (const config of configs) {
            for (const court of config.courts) {
                if (court.is_paused || court.phase === 'paused') {
                    pausedKeys.add(`${config.configuration_id}-${court.court_number}`);
                }
            }
        }

        const interval = setInterval(() => {
            setTimeDisplay((prev) => {
                const updated: Record<string, number> = {};
                for (const [key, value] of Object.entries(prev)) {
                    if (pausedKeys.has(key)) {
                        // Keep the paused timer frozen (do not decrement).
                        updated[key] = value;
                        continue;
                    }
                    if (value > 0) {
                        updated[key] = value - 1;
                    }
                }
                return updated;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [configs]);

    // Eagerly sync time_remaining from server data into timeDisplay
    useEffect(() => {
        setTimeDisplay((prev) => {
            const updated = { ...prev };
            for (const config of configs) {
                for (const court of config.courts) {
                    if (court.time_remaining !== null && court.phase === 'playing') {
                        const key = `${config.configuration_id}-${court.court_number}`;
                        // Only set if not already set (to avoid resetting on every data sync)
                        if (!(key in prev)) {
                            updated[key] = court.time_remaining;
                        }
                    }
                }
            }
            return updated;
        });
    }, [configs]);

    // Pull initial time_remaining into timeDisplay
    useEffect(() => {
        const initial: Record<string, number> = {};
        for (const config of configs) {
            for (const court of config.courts) {
                if (court.time_remaining !== null && court.phase === 'playing') {
                    initial[`${config.configuration_id}-${court.court_number}`] = court.time_remaining;
                }
            }
        }
        setTimeDisplay(initial);
    }, []);

    // Real-time Pusher subscriptions
    useEffect(() => {
        if (!echo) {
            setConnectionStatus('polling');
            return;
        }

        const channels: any[] = [];

        for (const config of configs) {
            const channelName = `courts.${config.configuration_id}`;
            const channel = echo.channel(channelName);

                channel.listen('.match.score.updated', (e: any) => {
                setConnectionStatus('connected');
                if (e.match) {
                    // When a match is completed (end_play_at set), the umpire may have
                    // auto-advanced a next match onto this court (a new LiveMatchScore record).
                    // Re-fetch full courts data so the court shows the new match (or becomes idle)
                    // instead of a stale "finished" state.
                    if (e.match.end_play_at) {
                        fetchData();
                        return;
                    }

                    setConfigs((prev) => {
                        return prev.map((cfg) => {
                            if (cfg.configuration_id !== e.configuration_id && cfg.configuration_id !== e.match.live_configuration_id) {
                                return cfg;
                            }
                            const configId = e.configuration_id || e.match.live_configuration_id;
                            if (cfg.configuration_id !== configId) return cfg;

                            const courtNum = e.match.court_number;
                            const updatedCourts = cfg.courts.map((court) => {
                                if (court.court_number !== courtNum) return court;

                                const phase: 'idle' | 'setup' | 'playing' | 'paused' | 'finished' = e.match.end_play_at ? 'finished'
                                    : e.match.start_play_at ? (e.match.is_paused ? 'paused' : 'playing')
                                    : 'setup';

                                const timeKey = `${cfg.configuration_id}-${courtNum}`;

                                // Update time display if available
                                if (e.match.time_remaining !== undefined && e.match.time_remaining !== null) {
                                    setTimeDisplay((prev) => ({ ...prev, [timeKey]: e.match.time_remaining }));
                                }

                                return {
                                    ...court,
                                    phase,
                                    is_paused: e.match.is_paused ?? false,
                                    team_a_score: e.match.team_a_score ?? 0,
                                    team_b_score: e.match.team_b_score ?? 0,
                                    serving_team: e.match.serving_team ?? null,
                                    service_number: e.match.service_number ?? 1,
                                    rally_count: e.match.rally_count ?? 0,
                                    team_a_court: e.match.team_a_court ?? null,
                                    team_b_court: e.match.team_b_court ?? null,
                                    time_remaining: e.match.time_remaining ?? null,
                                };
                            });

                            return { ...cfg, courts: updatedCourts };
                        });
                    });
                }
            });

            channels.push(channel);
        }

        // Connection monitoring
        const handleConnecting = () => setConnectionStatus('polling');
        const handleConnected = () => setConnectionStatus('connected');
        const handleDisconnected = () => setConnectionStatus('disconnected');

        if (echo.connector && echo.connector.pusher) {
            echo.connector.pusher.connection.bind('connecting', handleConnecting);
            echo.connector.pusher.connection.bind('connected', handleConnected);
            echo.connector.pusher.connection.bind('disconnected', handleDisconnected);
        }

        return () => {
            for (const ch of channels) {
                ch.stopListening('.match.score.updated');
                echo.leave(ch.name);
            }
            if (echo.connector && echo.connector.pusher) {
                echo.connector.pusher.connection.unbind('connecting', handleConnecting);
                echo.connector.pusher.connection.unbind('connected', handleConnected);
                echo.connector.pusher.connection.unbind('disconnected', handleDisconnected);
            }
        };
    }, [configs.map((c) => c.configuration_id).join(',')]);

    // Polling fallback
    const fetchData = useCallback(async () => {
        try {
            const url = slug ? `/api/${slug}/courts` : '/api/courts';
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' },
            });
            const json = await response.json();
            if (json.success) {
                if (slug) {
                    // Single-config mode: replace the single entry with the fresh data.
                    setConfigs([json.data]);
                } else {
                    setConfigs(json.data);
                }
                setConnectionStatus((prev) => (prev === 'disconnected' ? 'polling' : prev));
            }
        } catch {
            setConnectionStatus('disconnected');
        }
    }, [slug]);

    useEffect(() => {
        if (connectionStatus === 'polling' || connectionStatus === 'disconnected') {
            pollingRef.current = setInterval(fetchData, 5000);
            fetchData();
        }
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [connectionStatus, fetchData]);

    const selectedConfig = configs.find((c) => c.configuration_id === selectedConfigId) || configs[0];
    const formatTime = (seconds: number) => {
        const total = Math.max(0, Math.round(seconds));
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const renderPlayerAvatars = (players: Player[], maxDisplay = 4) => {
        const displayPlayers = players.slice(0, maxDisplay);
        const remaining = players.length - maxDisplay;
        return (
            <div className="flex items-center -space-x-2">
                {displayPlayers.map((player, idx) => (
                    <div
                        key={player.id}
                        className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-primary/30 to-primary/10 text-[9px] font-bold text-primary shadow-sm"
                        title={`${player.first_name ?? ''} ${player.last_name ?? ''}`}
                    >
                        {player.first_name && player.last_name
                            ? `${player.first_name[0]}${player.last_name[0]}`
                            : '??'}
                    </div>
                ))}
                {remaining > 0 && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] font-bold text-muted-foreground">
                        +{remaining}
                    </div>
                )}
            </div>
        );
    };

        const renderCourtCard = (court: Court, configId: number, scoringSystem: string) => {
        const timeKey = `${configId}-${court.court_number}`;
        const displayTime = timeDisplay[timeKey] ?? court.time_remaining;

        const isLive = court.phase === 'playing' || court.phase === 'paused';
        const isFinished = court.phase === 'finished';
        const isIdle = court.phase === 'idle';
        const isSetup = court.phase === 'setup';
        const isSideOut = scoringSystem === 'side-out';

        const getTeamInitials = (name: string) => {
            return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
        };

        // For side-out scoring with exactly 2 players in a team, we show the players
        // (avatar + full name) instead of the team initials + team name.
        const isSideOutDoubles =
            isSideOut &&
            court.team_a?.players?.length === 2 &&
            court.team_b?.players?.length === 2;

        const renderPlayerRow = (player: Player) => (
            <div key={player.id} className="flex items-center gap-1.5 min-w-0">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-gradient-to-br from-primary/30 to-primary/10 text-[8px] font-bold text-primary">
                    {player.first_name && player.last_name
                        ? `${player.first_name[0]}${player.last_name[0]}`
                        : '??'}
                </div>
                <span className="text-xs font-medium truncate text-foreground">
                    {player.first_name} {player.last_name}
                </span>
            </div>
        );

        const servingTeamName = court.serving_team === 'team_a'
            ? court.team_a?.name
            : court.serving_team === 'team_b'
                ? court.team_b?.name
                : null;

        return (
            <div
                key={court.court_number}
                className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                    isLive
                        ? 'border-primary/30 shadow-lg shadow-primary/10'
                        : isFinished
                            ? 'border-green-500/20 shadow-md'
                            : isSetup
                                ? 'border-amber-500/20 shadow-md'
                                : 'border-muted/30 shadow-sm'
                }`}
            >
                {/* Background gradient */}
                <div className={`absolute inset-0 ${
                    isLive
                        ? 'bg-gradient-to-br from-primary/10 via-background to-primary/5'
                        : isFinished
                            ? 'bg-gradient-to-br from-green-500/8 via-background to-green-500/3'
                            : isSetup
                                ? 'bg-gradient-to-br from-amber-500/8 via-background to-amber-500/3'
                                : 'bg-gradient-to-br from-muted/5 to-background'
                }`} />

                {/* Court header */}
                <div className="relative flex items-center justify-between px-3 py-2 border-b border-primary/10">
                    <div className="flex items-center gap-2">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                            isLive
                                ? 'bg-primary/20 text-primary'
                                : isFinished
                                    ? 'bg-green-500/20 text-green-500'
                                    : 'bg-muted text-muted-foreground'
                        }`}>
                            {court.court_number}
                        </div>
                        <div>
                            <span className="text-sm font-semibold">Court {court.court_number}</span>
                            {court.category && (
                                <span className="ml-2 text-[10px] text-muted-foreground">{court.category.name}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isLive && !court.is_paused && (
                            <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[9px] font-bold text-green-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                LIVE
                            </span>
                        )}
                        {court.is_paused && (
                            <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold text-amber-500">
                                <Pause className="h-2.5 w-2.5" />
                                PAUSED
                            </span>
                        )}
                        {isFinished && (
                            <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[9px] font-bold text-green-500">
                                FINISHED
                            </span>
                        )}
                        {isSetup && (
                            <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold text-amber-500">
                                UPCOMING
                            </span>
                        )}
                    </div>
                </div>

                {isIdle ? (
                    <div className="relative flex flex-col h-full items-center justify-center pb-8 text-muted-foreground">
                        <Swords className="mb-2 h-8 w-8 text-muted-foreground/30" />
                        <p className="text-xs font-medium">No Match Scheduled</p>
                    </div>
                ) : (
                    <div className="relative p-3 space-y-3">
                        {/* Team A */}
                        <div className={`relative rounded-xl p-3 transition-all ${
                            court.serving_team === 'team_a'
                                ? 'bg-primary/15 ring-1 ring-primary/30'
                                : 'bg-muted/30'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                    {isSideOutDoubles ? (
                                        // Side-out doubles: show player rows (avatar + full name) instead of team initials/name
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-col gap-1">
                                                {court.team_a?.players?.map(renderPlayerRow)}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                                                court.serving_team === 'team_a' ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                                            }`}>
                                                {court.team_a ? getTeamInitials(court.team_a.name) : 'A'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold truncate">{court.team_a?.name ?? 'Team A'}</p>
                                                {court.team_a?.players && court.team_a.players.length > 0 && (
                                                    <div className="mt-1">{renderPlayerAvatars(court.team_a.players)}</div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {court.serving_team === 'team_a' && isSideOut && (
                                        <div className="flex flex-col items-center gap-0.5">
                                            <div className="flex gap-1">
                                                <span className={`h-3 w-3 rounded-full ${(court.service_number ?? 1) >= 1 ? 'bg-red-500 dark:bg-white' : 'border-2 border-red-500/40 dark:border-white/40'}`} />
                                                <span className={`h-3 w-3 rounded-full ${(court.service_number ?? 1) === 2 ? 'bg-red-500 dark:bg-white' : 'border-2 border-red-500/40 dark:border-white/40'}`} />
                                            </div>
                                        </div>
                                    )}
                                    {court.serving_team === 'team_a' && !isSideOut && (
                                        <span className="flex h-5 items-center gap-1 rounded bg-primary/20 px-1.5 text-[8px] font-bold text-primary uppercase">
                                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse ring-1 ring-primary/50" />
                                            Serve
                                        </span>
                                    )}
                                    <span className={`font-black tabular-nums text-4xl drop-shadow-sm ${
                                        court.team_a_score > court.team_b_score && isFinished ? 'text-green-500' : 'text-foreground'
                                    }`}>
                                        {court.team_a_score}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* VS Divider */}
                        <div className="flex items-center justify-center gap-3 -my-1">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                            <span className={`text-xs font-bold uppercase tracking-widest ${
                                isFinished ? 'text-green-500/60' : 'text-primary/40'
                            }`}>
                                {isFinished ? 'Final' : 'VS'}
                            </span>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                        </div>

                        {/* Team B */}
                        <div className={`relative rounded-xl p-3 transition-all ${
                            court.serving_team === 'team_b'
                                ? 'bg-primary/15 ring-1 ring-primary/30'
                                : 'bg-muted/30'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                    {isSideOutDoubles ? (
                                        // Side-out doubles: show player rows (avatar + full name) instead of team initials/name
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-col gap-1">
                                                {court.team_b?.players?.map(renderPlayerRow)}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                                                court.serving_team === 'team_b' ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                                            }`}>
                                                {court.team_b ? getTeamInitials(court.team_b.name) : 'B'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold truncate">{court.team_b?.name ?? 'Team B'}</p>
                                                {court.team_b?.players && court.team_b.players.length > 0 && (
                                                    <div className="mt-1">{renderPlayerAvatars(court.team_b.players)}</div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {court.serving_team === 'team_b' && isSideOut && (
                                        <div className="flex flex-col items-center gap-0.5">
                                            <div className="flex gap-1">
                                                <span className={`h-3 w-3 rounded-full ${(court.service_number ?? 1) >= 1 ? 'bg-red-500 dark:bg-white' : 'border-2 border-red-500/40 dark:border-white/40'}`} />
                                                <span className={`h-3 w-3 rounded-full ${(court.service_number ?? 1) === 2 ? 'bg-red-500 dark:bg-white' : 'border-2 border-red-500/40 dark:border-white/40'}`} />
                                            </div>
                                        </div>
                                    )}
                                    {court.serving_team === 'team_b' && !isSideOut && (
                                        <span className="flex h-5 items-center gap-1 rounded bg-primary/20 px-1.5 text-[8px] font-bold text-primary uppercase">
                                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse ring-1 ring-primary/50" />
                                            Serve
                                        </span>
                                    )}
                                    <span className={`font-black tabular-nums text-4xl drop-shadow-sm ${
                                        court.team_b_score > court.team_a_score && isFinished
                                            ? 'text-green-500'
                                            : 'text-foreground'
                                    }`}>
                                        {court.team_b_score}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Match info footer */}
                        {(isLive || isSetup) && (
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                                <div className="flex items-center gap-3">
                                    {!isSideOut && (
                                        <div className="flex items-center gap-1">
                                            <Swords className="h-3 w-3" />
                                            <span>{court.rally_count} rallies</span>
                                        </div>
                                    )}
                                    {displayTime !== null && isLive && (
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span className={`font-mono font-bold ${
                                                displayTime <= 30 ? 'text-destructive' : displayTime <= 60 ? 'text-amber-500' : ''
                                            }`}>
                                                {formatTime(displayTime)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {court.category && (
                                    <span>Game to {court.category.game_to}</span>
                                )}
                            </div>
                        )}

                        {/* Next teams */}
                        {(court.next_team_a || court.next_team_b) && (
                            <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-2">
                                <div className="flex items-center gap-1.5 text-[9px] font-medium text-primary/60 uppercase tracking-wider mb-1">
                                    <Users className="h-3 w-3" />
                                    <span>Next Match</span>
                                    {court.next_category && (
                                        <span className="text-muted-foreground">· {court.next_category.name}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="font-semibold">{court.next_team_a?.name ?? '—'}</span>
                                    <span className="text-muted-foreground">vs</span>
                                    <span className="font-semibold">{court.next_team_b?.name ?? '—'}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <Head title="Live Courts" />

            <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
                {/* Header */}
                <header className="sticky top-0 z-30 border-b border-primary/10 bg-background/95 backdrop-blur-md">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/60 shadow-lg">
                                <AppLogoIcon className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold tracking-tight">Live Courts</h1>
                                <p className="text-[10px] text-muted-foreground">Real-time match scores</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Connection status */}
                            <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1">
                                {connectionStatus === 'connected' ? (
                                    <Wifi className="h-3 w-3 text-green-500" />
                                ) : connectionStatus === 'polling' ? (
                                    <RefreshCw className="h-3 w-3 text-amber-500 animate-spin" />
                                ) : (
                                    <WifiOff className="h-3 w-3 text-destructive" />
                                )}
                                <span className={`text-[10px] font-medium ${
                                    connectionStatus === 'connected' ? 'text-green-500'
                                        : connectionStatus === 'polling' ? 'text-amber-500'
                                        : 'text-destructive'
                                }`}>
                                    {connectionStatus === 'connected' ? 'Live'
                                        : connectionStatus === 'polling' ? 'Polling'
                                        : 'Offline'}
                                </span>
                            </div>

                            {/* Configuration selector */}
                            {configs.length > 1 && (
                                <select
                                    value={selectedConfigId ?? ''}
                                    onChange={(e) => setSelectedConfigId(Number(e.target.value))}
                                    className="rounded-lg border border-primary/20 bg-background px-2.5 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary/30"
                                >
                                    {configs.map((cfg) => (
                                        <option key={cfg.configuration_id} value={cfg.configuration_id}>
                                            {cfg.configuration_name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-4 py-6">
                    {!selectedConfig || selectedConfig.courts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Swords className="mb-2 h-8 w-8 text-muted-foreground/30" />
                            <p className="text-lg font-medium">No Active Courts</p>
                            <p className="text-sm">There are no active court configurations right now.</p>
                        </div>
                    ) : (
                        <>
                            {/* Configuration info */}
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold">{selectedConfig.configuration_name}</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {selectedConfig.number_of_courts} courts
                                        {selectedConfig.scoring_system === 'side-out' ? ' · Side Out Scoring' : ' · Rally Point Scoring'}
                                    </p>
                                </div>
                                {selectedConfig.recent_completed && selectedConfig.recent_completed.length > 0 && (
                                    <button
                                        onClick={() => document.getElementById('recent-results')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Trophy className="h-3.5 w-3.5" />
                                        View Recent Results
                                    </button>
                                )}
                            </div>

                            {/* Courts grid */}
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {selectedConfig.courts.map((court) => renderCourtCard(court, selectedConfig.configuration_id, selectedConfig.scoring_system))}
                            </div>

                            {/* Recent Results */}
                            {selectedConfig.recent_completed && selectedConfig.recent_completed.length > 0 && (
                                <div id="recent-results" className="mt-12">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Trophy className="h-5 w-5 text-primary" />
                                        <h3 className="text-lg font-bold">Recent Results</h3>
                                    </div>
                                    <div className="overflow-hidden rounded-xl border border-primary/10">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-primary/10 bg-muted/30">
                                                        <th className="px-4 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Court</th>
                                                        <th className="px-4 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                                                        <th className="px-4 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Team A</th>
                                                        <th className="px-4 py-2.5 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Score</th>
                                                        <th className="px-4 py-2.5 text-right text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Team B</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedConfig.recent_completed.map((result, idx) => (
                                                        <tr key={idx} className="border-b border-primary/5 last:border-none hover:bg-primary/5 transition-colors">
                                                            <td className="px-4 py-3 font-medium">Court {result.court_number}</td>
                                                            <td className="px-4 py-3 text-muted-foreground">{result.category_name}</td>
                                                            <td className="px-4 py-3">
                                                                <span className={`font-semibold ${
                                                                    result.team_a_score > result.team_b_score ? 'text-green-500' : ''
                                                                }`}>
                                                                    {result.team_a_name}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className="inline-flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1 font-mono text-sm font-bold">
                                                                    <span className={result.team_a_score > result.team_b_score ? 'text-green-500' : ''}>
                                                                        {result.team_a_score}
                                                                    </span>
                                                                    <span className="text-muted-foreground">-</span>
                                                                    <span className={result.team_b_score > result.team_a_score ? 'text-green-500' : ''}>
                                                                        {result.team_b_score}
                                                                    </span>
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <span className={`font-semibold ${
                                                                    result.team_b_score > result.team_a_score ? 'text-green-500' : ''
                                                                }`}>
                                                                    {result.team_b_name}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </>
    );
}

