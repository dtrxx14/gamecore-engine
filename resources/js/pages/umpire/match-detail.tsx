import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ShieldHalf, Trophy, Swords, Check, X, Clock, Users, RotateCw, ChevronDown, ChevronRight, Maximize, Pause, Play, Plus, Minus, AlertTriangle, Gavel } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppearance } from '@/hooks/use-appearance';

interface Status {
    id: number;
    name: string;
    slug: string;
}

interface LiveCategory {
    id: number;
    name: string;
    game_to: number;
    win_by?: number;
    game_time: string | null;
    game_interval: string | null;
}

interface LiveTeamPlayer {
    id: number;
    email: string;
    first_name: string | null;
    last_name: string | null;
    profile_image: string | null;
}

interface LiveTeam {
    id: number;
    name: string;
    player_ids: number[];
    players?: LiveTeamPlayer[];
}

interface LiveConfiguration {
    id: number;
    name: string;
    number_of_courts: number;
    scoring_system: string;
    allow_court_change: boolean;
    court_change_trigger: string;
    court_change_interval: number | null;
    status: Status | null;
}

interface LiveMatchScore {
    id: number;
    live_configuration_id: number;
    court_number: number;
    category_id: number | null;
    team_a_id: number | null;
    team_b_id: number | null;
    team_a_score: number;
    team_b_score: number;
    rally_count: number;
    team_a_court: 'left' | 'right' | null;
    team_b_court: 'left' | 'right' | null;
    serving_team: 'team_a' | 'team_b' | null;
    service_number?: number;
    court_change_done?: boolean;
    status_id: number;
    start_play_at: string | null;
    end_play_at: string | null;
    is_paused: boolean;
    paused_at: string | null;
    paused_remaining: number | null;
    team_a?: LiveTeam | null;
    team_b?: LiveTeam | null;
    category?: LiveCategory | null;
    status?: Status | null;
    live_configuration?: LiveConfiguration;
}

interface Props {
    match: LiveMatchScore;
    phase?: string;
    time_remaining?: number | null;
    existing_winner?: string | null;
}

// Coin Toss States
type CoinTossPhase =
    | 'idle'
    | 'flipping'
    | 'result'
    | 'choose_winner'
    | 'choose_option'
    | 'choose_serve'
    | 'choose_court'
    | 'complete';

// Live scoring phase
type LivePhase = 'setup' | 'playing' | 'paused' | 'finished';

const API_BASE = '/umpire/match';

export default function MatchDetail({ match, phase: initialPhase, time_remaining: initialTimeRemaining, existing_winner: initialWinner }: Props) {
    // Determine if coin toss data already exists in DB (e.g., from a prior session)
    const hasPreExistingCoinTossData = Boolean(match.serving_team) && Boolean(match.team_a_court) && Boolean(match.team_b_court);

    // Pre-game setup state - skip setup if coin toss data already exists or match is in a live phase
    const initialSetupComplete = hasPreExistingCoinTossData &&
        (initialPhase === 'setup' || initialPhase === 'playing' || initialPhase === 'paused');
    const [teamAVerified, setTeamAVerified] = useState(initialPhase !== 'setup');
    const [teamBVerified, setTeamBVerified] = useState(initialPhase !== 'setup');
    const [teamAPlayersOpen, setTeamAPlayersOpen] = useState(true);
    const [teamBPlayersOpen, setTeamBPlayersOpen] = useState(true);
    // Per-player verification state (used for side-out doubles - 2 player teams)
    const [teamAPlayersVerified, setTeamAPlayersVerified] = useState<Record<number, boolean>>({});
    const [teamBPlayersVerified, setTeamBPlayersVerified] = useState<Record<number, boolean>>({});
    const [bothTeamsPresent, setBothTeamsPresent] = useState(initialPhase !== 'setup');
    const [defaultTimerActive, setDefaultTimerActive] = useState(false);
    const [defaultTimerExpired, setDefaultTimerExpired] = useState(false);
    const [defaultTimerSeconds, setDefaultTimerSeconds] = useState(300);
    const [setupComplete, setSetupComplete] = useState(initialSetupComplete);

    // Coin toss state - if data already exists, skip to complete phase
    const initialCoinPhase: CoinTossPhase = hasPreExistingCoinTossData ? 'complete' : 'idle';
    const [coinPhase, setCoinPhase] = useState<CoinTossPhase>(initialCoinPhase);
    const [coinResult, setCoinResult] = useState<'heads' | 'tails' | null>(null);
    const [coinTossWinner, setCoinTossWinner] = useState<'team_a' | 'team_b' | null>(null);
    const [coinTossChoice, setCoinTossChoice] = useState<'service' | 'court' | null>(null);
    const [servingTeam, setServingTeam] = useState<'team_a' | 'team_b' | null>(match.serving_team);
    const [teamACourt, setTeamACourt] = useState<'left' | 'right' | null>(match.team_a_court);
    const [teamBCourt, setTeamBCourt] = useState<'left' | 'right' | null>(match.team_b_court);

    // Coin flip animation
    const [flipRotation, setFlipRotation] = useState(0);
    const coinRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Live scoring state - initialized from server phase for browser refresh persistence
    const initialLivePhase = initialPhase === 'playing' || initialPhase === 'paused' || initialPhase === 'finished'
        ? (initialPhase as LivePhase)
        : 'setup';
    const [livePhase, setLivePhase] = useState<LivePhase>(initialLivePhase);
    const [scores, setScores] = useState({ team_a: match.team_a_score ?? 0, team_b: match.team_b_score ?? 0 });
    const [rallyCount, setRallyCount] = useState(match.rally_count ?? 0);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(
        initialLivePhase === 'playing' || initialLivePhase === 'paused' ? (initialTimeRemaining ?? null) : null
    );
    const [totalGameSeconds, setTotalGameSeconds] = useState<number | null>(null);
    const [isPaused, setIsPaused] = useState(match.is_paused ?? false);
    const [winner, setWinner] = useState<string | null>(initialWinner ?? null);
    const [showPlayerChangeModal, setShowPlayerChangeModal] = useState(false);
    const [showWinnerConfirmation, setShowWinnerConfirmation] = useState(false);
    const [showEndMatchConfirmation, setShowEndMatchConfirmation] = useState(false);
    const [scoringTeam, setScoringTeam] = useState<'team_a' | 'team_b' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Side-out scoring state (standard pickleball side-out rules)
    const isSideOut = match.live_configuration?.scoring_system === 'side-out';
    // serviceNumber: which server within the serving team is serving (1 or 2).
    // The game starts at 0-0-2 → the initial serving team begins on their 2nd server.
    const [serviceNumber, setServiceNumber] = useState<1 | 2>(isSideOut ? 2 : 1);
    // courtChangeDone: for side-out, the court change (change sides) is only allowed ONCE per match.
    const [courtChangeDone, setCourtChangeDone] = useState(false);

    const gameTo = match.category?.game_to ?? 21;
    const winBy = match.category?.win_by ?? 1;

    const { resolvedAppearance } = useAppearance();

    // Detect orientation for layout adjustments
    const [isLandscape, setIsLandscape] = useState(false);
    useEffect(() => {
        const checkOrientation = () => {
            setIsLandscape(window.matchMedia('(orientation: landscape)').matches);
        };
        checkOrientation();
        window.matchMedia('(orientation: landscape)').addEventListener('change', checkOrientation);
        return () => window.matchMedia('(orientation: landscape)').removeEventListener('change', checkOrientation);
    }, []);

    // Request fullscreen on mobile for immersive experience
    const requestLandscape = async () => {
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }
            if (screen.orientation && 'lock' in screen.orientation) {
                await (screen.orientation as any).lock('landscape');
            }
        } catch (e) {
            console.log('Orientation lock not supported');
        }
    };

    const goBack = () => {
        router.visit('/umpire/dashboard');
    };

    const isMatchLive = livePhase === 'playing' || livePhase === 'paused' || livePhase === 'finished';
    const isLow = timeRemaining !== null && timeRemaining <= 60;
    const isCritical = timeRemaining !== null && timeRemaining <= 30;

    // If there's already an existing winner from server, show confirmation modal
    useEffect(() => {
        if (initialWinner && initialLivePhase === 'playing') {
            setShowWinnerConfirmation(true);
        }
    }, []);

    // Countdown timer interval reference
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Polling for match state
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const getTeamName = (team: LiveTeam | null | undefined, teamId: number | null | undefined) => {
        if (team?.name) return team.name;
        if (!teamId) return '—';
        return `Team #${teamId}`;
    };

const teamAName = getTeamName(match.team_a, match.team_a_id);
    const teamBName = getTeamName(match.team_b, match.team_b_id);

    // Side-out doubles: verify each player individually (when a team has exactly 2 players)
    const teamAPlayers = match.team_a?.players ?? [];
    const teamBPlayers = match.team_b?.players ?? [];
    const usePlayerVerifyA = isSideOut && teamAPlayers.length === 2;
    const usePlayerVerifyB = isSideOut && teamBPlayers.length === 2;

    // A team is "ready" when all of its players are verified (in player-verify mode)
    // or when the whole team was verified via the single toggle (otherwise).
    const teamAReady = usePlayerVerifyA
        ? teamAPlayers.length > 0 && teamAPlayers.every((p) => teamAPlayersVerified[p.id])
        : teamAVerified;
    const teamBReady = usePlayerVerifyB
        ? teamBPlayers.length > 0 && teamBPlayers.every((p) => teamBPlayersVerified[p.id])
        : teamBVerified;

    const toggleTeamAPlayerVerified = (playerId: number) => {
        if (bothTeamsPresent) return;
        setTeamAPlayersVerified((prev) => ({ ...prev, [playerId]: !prev[playerId] }));
    };
    const toggleTeamBPlayerVerified = (playerId: number) => {
        if (bothTeamsPresent) return;
        setTeamBPlayersVerified((prev) => ({ ...prev, [playerId]: !prev[playerId] }));
    };

    // Initialize game_time from category
    useEffect(() => {
        if (match.category?.game_time) {
            const mins = parseInt(match.category.game_time, 10);
            if (!isNaN(mins)) {
                setTotalGameSeconds(mins * 60);
            }
        }
    }, []);

    // Default timer countdown
    useEffect(() => {
        if (defaultTimerActive && defaultTimerSeconds > 0) {
            timerRef.current = setInterval(() => {
                setDefaultTimerSeconds((prev) => {
                    if (prev <= 1) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        setDefaultTimerExpired(true);
                        setDefaultTimerActive(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [defaultTimerActive, defaultTimerSeconds]);

    // Countdown timer for live match
    useEffect(() => {
        if (livePhase === 'playing' && timeRemaining !== null && timeRemaining > 0 && !isPaused) {
            countdownRef.current = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev === null || prev <= 1) {
                        if (countdownRef.current) clearInterval(countdownRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
            }
        };
    }, [livePhase, timeRemaining, isPaused]);

    // Poll for match state updates from backend
    useEffect(() => {
        if (livePhase === 'playing' || livePhase === 'paused') {
            pollingRef.current = setInterval(() => {
                fetchMatchState();
            }, 3000);

            // Also immediately fetch
            fetchMatchState();
        }

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [livePhase]);

    const fetchMatchState = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/${match.id}/state`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
            });
            const data = await response.json();
            if (data.success) {
                // Update scores from backend
                setScores({
                    team_a: data.match.team_a_score ?? 0,
                    team_b: data.match.team_b_score ?? 0,
                });
                setRallyCount(data.match.rally_count ?? 0);
                setIsPaused(data.match.is_paused ?? false);
                setServingTeam(data.match.serving_team ?? servingTeam);

                // Sync side-out scoring state from backend (service number + court change)
                if (data.match.service_number) {
                    setServiceNumber(data.match.service_number === 2 ? 2 : 1);
                }
                if (typeof data.match.court_change_done === 'boolean') {
                    setCourtChangeDone(data.match.court_change_done);
                }

                // Update court sides from backend (important after player changes)
                if (data.match.team_a_court) {
                    setTeamACourt(data.match.team_a_court);
                }
                if (data.match.team_b_court) {
                    setTeamBCourt(data.match.team_b_court);
                }

                // Update timer from server-calculated value (persists across sessions)
                if (data.time_remaining !== null) {
                    setTimeRemaining(data.time_remaining);
                }

                // Check for winner from server - show confirmation, don't auto-finish
                if (data.winner && !showWinnerConfirmation) {
                    setWinner(data.winner);
                    setShowWinnerConfirmation(true);
                    setShowPlayerChangeModal(false);
                } else if (!data.winner && showWinnerConfirmation) {
                    setWinner(null);
                    setShowWinnerConfirmation(false);
                }

                // Check for player change trigger
                if (data.needs_player_change && !showPlayerChangeModal && livePhase === 'playing') {
                    setShowPlayerChangeModal(true);
                }
            }
        } catch (error) {
            console.error('Failed to fetch match state:', error);
        }
    }, [match.id, livePhase, showPlayerChangeModal, showWinnerConfirmation, servingTeam]);

    const formatTime = (seconds: number) => {
        const totalSeconds = Math.max(0, Math.round(seconds));

        const minutes = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;

        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    // Reset coin toss
    const resetCoinToss = () => {
        setCoinPhase('idle');
        setCoinResult(null);
        setCoinTossWinner(null);
        setCoinTossChoice(null);
        setFlipRotation(0);
    };

    // Handle coin tap
    const handleCoinTap = () => {
        if (coinPhase !== 'idle') return;
        setCoinPhase('flipping');
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        setCoinResult(result);
        const spins = 5;
        const baseRotation = result === 'heads' ? 0 : 180;
        const totalRotation = spins * 360 + baseRotation;
        setFlipRotation(totalRotation);
        setTimeout(() => { setCoinPhase('result'); }, 3000);
    };

    const proceedToChooseWinner = () => setCoinPhase('choose_winner');
    const handleWinnerSelect = (w: 'team_a' | 'team_b') => {
        setCoinTossWinner(w);
        setCoinPhase('choose_option');
    };

    const handleChoiceSelect = (choice: 'service' | 'court') => {
        setCoinTossChoice(choice);
        if (choice === 'service') {
            // Toss winner chose service → toss winner serves, other team chooses court
            setServingTeam(coinTossWinner);
        } else {
            // Toss winner chose court → toss winner picks court side, other team serves
            setServingTeam(coinTossWinner === 'team_a' ? 'team_b' : 'team_a');
        }
        setCoinPhase('choose_court');
    };

    const handleCourtSelect = (side: 'left' | 'right') => {
        const oppositeSide = side === 'left' ? 'right' : 'left';

        if (coinTossChoice === 'court') {
            // Toss winner chose court → they pick the side, other team serves
            if (coinTossWinner === 'team_a') {
                setTeamACourt(side);
                setTeamBCourt(oppositeSide);
            } else {
                setTeamBCourt(side);
                setTeamACourt(oppositeSide);
            }
        } else {
            // Toss winner chose service → other team picks the court side
            const otherTeam = coinTossWinner === 'team_a' ? 'team_b' : 'team_a';
            if (otherTeam === 'team_a') {
                setTeamACourt(side);
                setTeamBCourt(oppositeSide);
            } else {
                setTeamBCourt(side);
                setTeamACourt(oppositeSide);
            }
        }
        setCoinPhase('complete');
    };

    // START MATCH
    const startMatch = async () => {
        if (!servingTeam || !teamACourt || !teamBCourt) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/${match.id}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                body: JSON.stringify({ serving_team: servingTeam, team_a_court: teamACourt, team_b_court: teamBCourt }),
            });
            const data = await response.json();
            if (data.success) {
                setLivePhase('playing');
                setIsPaused(false);
                if (match.category?.game_time) {
                    const mins = parseInt(match.category.game_time, 10);
                    if (!isNaN(mins)) { setTotalGameSeconds(mins * 60); setTimeRemaining(mins * 60); }
                }
                await fetchMatchState();
            }
        } catch (error) {
            console.error('Failed to start match:', error);
        } finally { setIsSubmitting(false); }
    };

    // UPDATE SCORE
    const updateScore = async (team: 'team_a' | 'team_b', action: 'increment' | 'decrement') => {
        if (livePhase !== 'playing' || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/${match.id}/score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                body: JSON.stringify({ team, action }),
            });
            const data = await response.json();
            if (data.success) {
                setScores({ team_a: data.match.team_a_score ?? 0, team_b: data.match.team_b_score ?? 0 });
                setRallyCount(data.match.rally_count ?? 0);
                setServingTeam(data.match.serving_team ?? servingTeam);
                // Sync side-out service number immediately after a score update
                if (data.match.service_number) {
                    setServiceNumber(data.match.service_number === 2 ? 2 : 1);
                }
                setScoringTeam(team);
                setTimeout(() => setScoringTeam(null), 1000);

                // Check for winner - show confirmation instead of auto-finishing
                if (data.winner) {
                    setWinner(data.winner);
                    setShowWinnerConfirmation(true);
                    setShowPlayerChangeModal(false);
                } else {
                    setWinner(null);
                    setShowWinnerConfirmation(false);
                }

                if (data.needs_player_change) {
                    setShowPlayerChangeModal(true);
                }
            }
        } catch (error) {
            console.error('Failed to update score:', error);
        } finally { setIsSubmitting(false); }
    };

    // TOGGLE PAUSE
    const togglePause = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/${match.id}/pause`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                body: JSON.stringify({}),
            });
            const data = await response.json();
            if (data.success) { setIsPaused(data.is_paused); setLivePhase(data.is_paused ? 'paused' : 'playing'); }
        } catch (error) {
            console.error('Failed to toggle pause:', error);
        } finally { setIsSubmitting(false); }
    };

    // CHANGE PLAYERS - resets rally count to 0 on backend
    // Only swaps court sides when trigger is 'score-count' (not 'rally-count')
    // Undo will go back to 9 (handled by backend decrement logic)
    const confirmPlayerChange = async () => {
        setIsSubmitting(true);
        try {
            const courtChangeTrigger = match.live_configuration?.court_change_trigger;
            const shouldSwapCourts = courtChangeTrigger === 'score-count';

            const body: Record<string, any> = {};
            if (shouldSwapCourts) {
                body.swap_courts = true;
                body.team_a_court = teamBCourt;
                body.team_b_court = teamACourt;
            }

            const response = await fetch(`${API_BASE}/${match.id}/change-players`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (data.success) {
                setRallyCount(0);
                if (shouldSwapCourts) {
                    // Swap court sides in local state so the score display maps correctly
                    setTeamACourt(data.match.team_a_court ?? teamBCourt);
                    setTeamBCourt(data.match.team_b_court ?? teamACourt);
                }
                setShowPlayerChangeModal(false);
            }
        } catch (error) {
            console.error('Failed to confirm player change:', error);
        } finally { setIsSubmitting(false); }
    };

    // CONFIRM WINNER - end match and redirect to summary
    const confirmWinner = async () => {
        setIsSubmitting(true);
        try {
            // End the match first
            const response = await fetch(`${API_BASE}/${match.id}/end`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                body: JSON.stringify({}),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error ?? 'The match could not be ended.');
            }
            setLivePhase('finished');
            setShowWinnerConfirmation(false);
            // Redirect to summary page
            router.visit(`/umpire/match/${match.id}/summary`);
        } catch (error) {
            console.error('Failed to confirm winner:', error);
        } finally { setIsSubmitting(false); }
    };

    // CANCEL WINNER - undo last point and resume playing
    const cancelWinner = async () => {
        if (!winner) return;
        setShowWinnerConfirmation(false);
        setLivePhase('playing');
        // Update local state to decrement immediately for responsiveness
        setScores((prev) => ({
            ...prev,
            [winner === 'team_a' ? 'team_a' : 'team_b']: Math.max(0, prev[winner === 'team_a' ? 'team_a' : 'team_b'] - 1),
        }));
        // Decrement on backend
        await updateScore(winner as 'team_a' | 'team_b', 'decrement');
    };

    // END MATCH (for manual end match button)
    const endMatch = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/${match.id}/end`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                body: JSON.stringify({}),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error ?? 'The match could not be ended.');
            }
            if (data.success) { 
                setLivePhase('finished');
                setShowWinnerConfirmation(false);
                router.visit(`/umpire/match/${match.id}/summary`);
            }
        } catch (error) {
            console.error('Failed to end match:', error);
        } finally { setIsSubmitting(false); }
    };

    // State for the default winner selection modal
    const [showDefaultWinnerPicker, setShowDefaultWinnerPicker] = useState(false);

    // Declare a default winner (51-0) when timer expires
    const handleDeclareDefaultWinner = async (winnerTeam: 'team_a' | 'team_b') => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/${match.id}/default-winner`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                body: JSON.stringify({ winner_team: winnerTeam }),
            });
            const data = await response.json();
            if (data.success) {
                setLivePhase('finished');
                setShowDefaultWinnerPicker(false);
                router.visit(`/umpire/match/${match.id}/summary`);
            }
        } catch (error) {
            console.error('Failed to declare default winner:', error);
        } finally { setIsSubmitting(false); }
    };

    // Smart default winner handler - checks which teams verified
    const handleDefaultTimerExpiredAction = () => {
        // If exactly one team verified, auto-declare that team winner
        if (teamAVerified && !teamBVerified) {
            handleDeclareDefaultWinner('team_a');
            return;
        }
        if (!teamAVerified && teamBVerified) {
            handleDeclareDefaultWinner('team_b');
            return;
        }
        // If neither or both verified, show picker modal
        setShowDefaultWinnerPicker(true);
    };


    const handlePlayAnyway = () => {
        setDefaultTimerExpired(false);
        setSetupComplete(true);
        setCoinPhase('idle');
    };

    // Extract score display IIFE to avoid duplication
    const renderScoreCards = () => {
        const leftTeam = teamACourt === 'left' ? 'team_a' : 'team_b';
        const rightTeam = teamACourt === 'left' ? 'team_b' : 'team_a';

        const leftTeamScores = leftTeam === 'team_a' ? scores.team_a : scores.team_b;
        const rightTeamScores = rightTeam === 'team_a' ? scores.team_a : scores.team_b;
        const leftTeamName = leftTeam === 'team_a' ? teamAName : teamBName;
        const rightTeamName = rightTeam === 'team_a' ? teamAName : teamBName;
        const leftTeamCourt = leftTeam === 'team_a' ? teamACourt : teamBCourt;
        const rightTeamCourt = rightTeam === 'team_a' ? teamACourt : teamBCourt;

        const renderTeamCard = (side: 'left' | 'right') => {
            const isLeft = side === 'left';
            const team = isLeft ? leftTeam : rightTeam;
            const teamScores = isLeft ? leftTeamScores : rightTeamScores;
            const teamName = isLeft ? leftTeamName : rightTeamName;
            const teamCourt = isLeft ? leftTeamCourt : rightTeamCourt;
            const teamLetter = isLeft ? 'A' : 'B';
            const canUndoServiceTransition = isSideOut && rallyCount > 0 && (
                (team === servingTeam && serviceNumber === 1) ||
                (team !== servingTeam && serviceNumber === 2)
            );
            const canUndo = teamScores > 0 || canUndoServiceTransition;

            return (
                <div className={`flex justify-center items-center relative overflow-hidden rounded-2xl shadow-xl transition-all duration-200 border border-primary/10 ${servingTeam === team ? 'scale-[1.02] ring-1 ring-primary/30' : ''}`}
                    style={{
                        background: team === 'team_a'
                            ? (resolvedAppearance === 'dark'
                                ? 'linear-gradient(180deg, color-mix(in srgb, var(--primary) 30%, #000) 0%, color-mix(in srgb, var(--primary) 15%, #000) 100%)'
                                : 'linear-gradient(180deg, color-mix(in srgb, var(--primary) 12%, #fff) 0%, color-mix(in srgb, var(--primary) 6%, #fff) 100%)')
                            : (resolvedAppearance === 'dark'
                                ? 'linear-gradient(180deg, color-mix(in srgb, var(--primary) 25%, #0a0a0a) 0%, color-mix(in srgb, var(--primary) 10%, #000) 100%)'
                                : 'linear-gradient(180deg, color-mix(in srgb, var(--primary) 10%, #fff) 0%, color-mix(in srgb, var(--primary) 4%, #f5f5f5) 100%)')
                    }}>
                    <div className="absolute inset-0 opacity-[0.05] shimmer-overlay" />
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-primary via-primary/60 to-primary/20" />
                    {servingTeam === team && (
                        <div className="absolute right-2 top-2 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse ring-1 ring-primary/50" />
                            <span className="text-[8px] font-bold uppercase tracking-wider text-primary/80">Serve</span>
                        </div>
                    )}
                    <div className="px-3 pt-4 pb-2 sm:px-4 sm:pt-5 sm:pb-3 text-center flex items-center flex-col justify-center w-full h-full">
                        <p className={`text-[10px] sm:text-xs font-bold truncate max-w-full mb-0.5 tracking-wide ${resolvedAppearance === 'dark' ? 'text-white/90' : 'text-foreground/90'}`}>
                            {teamName}
                        </p>
                        {/* <p className={`text-[8px] uppercase tracking-wider mb-0.5 ${resolvedAppearance === 'dark' ? 'text-white/40' : 'text-muted-foreground'}`}>{teamCourt || ''} court</p> */}
                        <div className={`font-black tabular-nums tracking-tight leading-none transition-all duration-150 drop-shadow-[0_0_12px_rgba(var(--primary),0.3)] ${scoringTeam === team ? 'scale-110' : ''}`}
                            style={{ fontSize: 'clamp(7rem, 15vw, 15rem)', color: 'var(--primary)' }}>
                            {teamScores}
                        </div>
                        {livePhase === 'playing' && (
                            <div className="w-full mt-3 grid grid-cols-2 gap-2 opacity-90 hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => updateScore(team as 'team_a' | 'team_b', 'increment')}
                                    disabled={isSubmitting}
                                    aria-label={`Add point for ${teamName}`}
                                    title={`Add point for ${teamName}`}
                                    className="flex items-center justify-center gap-1 rounded-xl bg-primary/20 py-4 text-primary hover:bg-primary/30 active:scale-95 transition-all disabled:opacity-40 font-black backdrop-blur-sm">
                                    <Plus className="h-6 w-6 sm:h-7 sm:w-7" />
                                </button>
                                <button
                                    onClick={() => updateScore(team as 'team_a' | 'team_b', 'decrement')}
                                    disabled={isSubmitting || !canUndo}
                                    aria-label={`Undo point for ${teamName}`}
                                    title={`Undo point for ${teamName}`}
                                    className="flex items-center justify-center gap-1 rounded-xl bg-destructive/20 py-4 text-destructive hover:bg-destructive/30 active:scale-95 transition-all disabled:opacity-40 font-black backdrop-blur-sm">
                                    <Minus className="h-6 w-6 sm:h-7 sm:w-7" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            );
        };

        return (
            <div className="grid grid-cols-2 gap-2 w-full">
                {renderTeamCard('left')}
                {renderTeamCard('right')}
            </div>
        );
    };

    return (
        <>
            <Head title={`Court ${match.court_number} - ${isMatchLive ? 'Live Match' : 'Match Setup'}`} />

            {/* Main container */}
            <div className={`flex min-h-dvh flex-col bg-gradient-to-b from-background to-primary/5 ${isMatchLive ? 'fixed inset-0 z-40 overflow-hidden' : ''}`}>
                {/* Header */}
                <header className={`shrink-0 border-b border-primary/10 bg-background/90 backdrop-blur-md overflow-x-hidden`}>
                    <div className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5">
                        {!isMatchLive && (
                            <button onClick={goBack} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-primary/10 transition-colors shrink-0">
                                <ArrowLeft className="h-4 w-4 text-primary" />
                            </button>
                        )}
                        <div className="flex-1 min-w-0">
                            <h1 className={`font-semibold truncate ${isMatchLive ? 'text-sm leading-tight' : 'text-base'}`}>
                                Court {match.court_number}
                            </h1>
                            {!isMatchLive && (
                                <p className="text-xs text-muted-foreground truncate">
                                    {match.live_configuration?.name} {match.category ? `· ${match.category.name}` : ''}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                            {/* Landscape orientation button - shown in portrait on mobile */}
                            {isMatchLive && !isLandscape && (
                                <button
                                    onClick={requestLandscape}
                                    className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1.5 text-[10px] font-bold text-primary hover:bg-primary/20 transition-all active:scale-95"
                                    title="Rotate to landscape for better view"
                                >
                                    <Maximize className="h-3 w-3" />
                                    <span className="hidden sm:inline">Landscape</span>
                                </button>
                            )}
                            {isMatchLive && (
                                <Badge variant="outline" className={`text-[10px] leading-none py-0.5 ${isPaused ? 'border-primary/30 bg-primary/10 text-primary/80' : 'border-primary/40 bg-primary/15 text-primary'}`}>
                                    <span className={`mr-1 h-1.5 w-1.5 rounded-full inline-block animate-pulse ${isPaused ? 'bg-primary/60' : 'bg-primary'}`} />
                                    {isPaused ? 'PAUSED' : 'LIVE'}
                                </Badge>
                            )}
                            {!isMatchLive && (
                                <Badge variant="outline" className="shrink-0 text-[10px] border-primary/20 text-primary/70">
                                    {match.status?.name ?? '—'}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent shimmer-slide" />
                </header>

                {/* LIVE SCORING - Full screen fixed */}
                {isMatchLive && (
                    <div className="flex-1 flex flex-col min-h-0 px-2 sm:px-3 py-1.5 gap-1.5 overflow-hidden">
                        {/* Countdown Timer - Compact */}
                        <div className={`shrink-0 relative overflow-hidden rounded-xl shadow-lg text-center border ${isPaused ? 'border-primary/40' : 'border-primary/20'}`}
                            style={{
                                background: isPaused
                                    ? (resolvedAppearance === 'dark'
                                        ? 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 35%, #000) 0%, color-mix(in srgb, var(--primary) 20%, #000) 50%, color-mix(in srgb, var(--primary) 35%, #000) 100%)'
                                        : 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 15%, #fff) 0%, color-mix(in srgb, var(--primary) 8%, #fff) 50%, color-mix(in srgb, var(--primary) 12%, #fff) 100%)')
                                    : (resolvedAppearance === 'dark'
                                        ? 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 40%, #000) 0%, color-mix(in srgb, var(--primary) 25%, #000) 40%, color-mix(in srgb, var(--primary) 35%, #000) 100%)'
                                        : 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 18%, #fff) 0%, color-mix(in srgb, var(--primary) 10%, #fff) 40%, color-mix(in srgb, var(--primary) 14%, #fff) 100%)')
                            }}>
                            <div className="absolute inset-0 opacity-[0.07] shimmer-overlay" />
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent shimmer-slide" />
                            
                            <div className="relative px-3 py-1.5 sm:py-2 flex items-center justify-center gap-3">
                                {/* Game to badge */}
                                <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ring-1 ${resolvedAppearance === 'dark' ? 'bg-white/5 text-white/50 ring-white/10' : 'bg-primary/5 text-primary/60 ring-primary/10'}`}>
                                    Game to {match.category?.game_to}
                                </span>
                                <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ring-1 ${resolvedAppearance === 'dark' ? 'bg-white/5 text-white/50 ring-white/10' : 'bg-primary/5 text-primary/60 ring-primary/10'}`}>
                                    Win by {match.category?.win_by ?? 1}
                                </span>

                                {/* Timer */}
                                {timeRemaining !== null && totalGameSeconds !== null ? (
                                    <div className={`font-mono font-black tracking-tight leading-none ${isCritical ? 'text-destructive animate-pulse' : isLow ? 'text-primary' : (resolvedAppearance === 'dark' ? 'text-white' : 'text-foreground')}`}
                                        style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)' }}>
                                        {formatTime(timeRemaining)}
                                    </div>
                                ) : (
                                    <div className={`font-mono font-black tracking-tight leading-none text-3xl ${resolvedAppearance === 'dark' ? 'text-white/30' : 'text-muted-foreground/50'}`}>--:--</div>
                                )}

                                {/* Optional progress dot */}
                                {/* {timeRemaining !== null && totalGameSeconds !== null && (
                                    <div className="flex-1 max-w-[60px] sm:max-w-[100px] h-1 rounded-full overflow-hidden bg-primary/10">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-linear ${isCritical ? 'bg-destructive' : isLow ? 'bg-primary' : (resolvedAppearance === 'dark' ? 'bg-white/40' : 'bg-primary/30')}`}
                                            style={{ width: `${totalGameSeconds > 0 ? (timeRemaining / totalGameSeconds) * 100 : 0}%` }}
                                        />
                                    </div>
                                )} */}

                                {/* Rally counter - only shown for non-side-out (rally point) scoring */}
                                {!isSideOut && (
                                    <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ring-1 ${resolvedAppearance === 'dark' ? 'bg-white/5 text-white/50 ring-white/10' : 'bg-primary/5 text-primary/60 ring-primary/10'}`}>
                                        <span className={rallyCount > 0 ? 'text-primary/80 font-bold' : ''}>{rallyCount}</span> rally
                                    </span>
                                )}
                                {/* Service number badge - only shown for side-out scoring */}
                                {isSideOut && (
                                    <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ring-1 ${resolvedAppearance === 'dark' ? 'bg-white/5 text-white/50 ring-white/10' : 'bg-primary/5 text-primary/60 ring-primary/10'}`}>
                                        
                                        <span className='text-primary/80 font-bold'>Serve {serviceNumber}</span>
                                    </span>
                                )}
                                {/* <div className={`flex items-center gap-1 text-[9px] font-medium ${resolvedAppearance === 'dark' ? 'text-white/40' : 'text-muted-foreground'}`}>
                                    <RotateCw className={`h-2.5 w-2.5 ${rallyCount > 0 ? 'text-primary/80' : ''}`} />
                                    <span className={rallyCount > 0 ? 'text-primary/80 font-bold' : ''}>{rallyCount}</span>
                                </div> */}
                            </div>
                        </div>

                        {/* Score Cards - Flex to fill available space */}
                        <div className="flex-1 flex items-stretch min-h-0">
                            <div className="flex w-full gap-1.5">
                                {renderScoreCards()}
                            </div>
                        </div>

                        {/* Status bar for paused */}
                        {/* {isPaused && (
                            <div className="shrink-0 flex items-center justify-center gap-2 py-1 px-3 rounded-lg bg-primary/10 border border-primary/20">
                                <Pause className="h-3.5 w-3.5 text-primary/80" />
                                <span className="text-xs font-semibold text-primary/80 uppercase tracking-wider">Match Paused</span>
                            </div>
                        )} */}

                        {/* Control Buttons - Fixed at bottom */}
                        <div className="shrink-0">
                            {livePhase === 'playing' || livePhase === 'paused' ? (
                                <div className="grid grid-cols-2 gap-2 pb-safe">
                                    <button onClick={togglePause} disabled={isSubmitting}
                                        className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold uppercase tracking-wider transition-all active:scale-[0.97] shadow-lg ${
                                            isPaused
                                                ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:brightness-110 shadow-primary/30'
                                                : 'bg-gradient-to-r from-primary/80 to-primary/60 text-primary-foreground hover:brightness-110 shadow-primary/30'
                                        }`}>
                                        {isPaused ? <><Play className="h-5 w-5" /> Resume</> : <><Pause className="h-5 w-5" /> Pause</>}
                                    </button>
                                    <button onClick={() => setShowEndMatchConfirmation(true)} disabled={isSubmitting}
                                        className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold uppercase tracking-wider transition-all active:scale-[0.97] shadow-lg bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground hover:brightness-110 shadow-destructive/30">
                                        <Trophy className="h-5 w-5" /> End
                                    </button>
                                </div>
                            ) : livePhase === 'finished' && (
                                <button onClick={goBack} className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-lg shadow-primary/30">
                                    Back to Dashboard
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* PRE-GAME SETUP */}
                {!isMatchLive && (
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 portrait:mx-auto landscape:mx-auto w-full">
                        {/* Match Info Card */}
                        <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-background to-primary/5 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2"><ShieldHalf className="h-4 w-4 text-primary" /><span className="text-sm font-semibold">Match Details</span></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 flex flex-col items-center rounded-lg bg-primary/5 p-3 border border-primary/10">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary mb-1">A</div>
                                    <span className="text-sm font-medium text-center leading-tight">{teamAName}</span>
                                    {teamACourt && <span className="text-[10px] text-muted-foreground mt-0.5 capitalize">{teamACourt} court</span>}
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-xs font-bold text-primary/50">VS</span>
                                {match.category?.game_time
                                    ? <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1"><Clock className="h-3 w-3 text-primary/50" />{match.category.game_time} mins</span>
                                    : <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1"><Clock className="h-3 w-3 text-muted-foreground/40" /> - - </span>
                                }
                                </div>
                                <div className="flex-1 flex flex-col items-center rounded-lg bg-primary/5 p-3 border border-primary/10">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary mb-1">B</div>
                                    <span className="text-sm font-medium text-center leading-tight">{teamBName}</span>
                                    {teamBCourt && <span className="text-[10px] text-muted-foreground mt-0.5 capitalize">{teamBCourt} court</span>}
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-center gap-2">
                                <Badge variant="outline" className="text-[10px] border-primary/20 text-primary/70">{match.live_configuration?.scoring_system === 'side-out' ? 'Side Out Scoring' : 'Rally Point Scoring'}</Badge>
                                {servingTeam && <Badge variant="outline" className="text-[10px] border-primary/20 bg-primary/10 text-primary">Serving: {servingTeam === 'team_a' ? teamAName : teamBName}</Badge>}
                            </div>
                        </div>

                        {/* Pre-game setup steps */}
                        {!setupComplete && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2"><Swords className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Pre-Game Setup</h2></div>

                                {/* Step 1: Team Verification */}
                                <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-card to-primary/5 p-4 space-y-3">
                                    <h3 className="text-sm font-medium flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">1</span>Verify Teams</h3>

                                    {/* Team A */}
                                    <div className="rounded-lg border border-primary/10 bg-background/50">
                                        <div className="flex items-center justify-between p-3">
                                            <button onClick={() => setTeamAPlayersOpen(!teamAPlayersOpen)} className="flex items-center gap-2 min-w-0">
                                                {teamAPlayersOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">A</div>
                                                <div className="min-w-0"><p className="text-sm font-medium truncate">{teamAName}</p><p className="text-[10px] flex justify-start text-muted-foreground">{match.team_a?.players?.length ?? match.team_a?.player_ids?.length ?? 0} player(s)</p></div>
                                            </button>
                                            {!usePlayerVerifyA ? (
                                                <button onClick={() => { if (!bothTeamsPresent) setTeamAVerified(!teamAVerified); }} disabled={bothTeamsPresent} className={`flex h-8 w-8 items-center justify-center rounded-full transition-all shrink-0 ml-2 ${teamAVerified ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'bg-muted/30 text-muted-foreground hover:bg-accent'} ${bothTeamsPresent ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                                    {teamAVerified ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                                </button>
                                            ) : (
                                                <span className={`flex h-8 items-center justify-center gap-1 rounded-full px-3 text-[10px] font-bold shrink-0 ml-2 transition-all ${teamAReady ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'bg-muted/30 text-muted-foreground'}`}>
                                                    {teamAReady ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                                                    {teamAReady ? 'Verified' : `${(teamAPlayers.filter((p) => teamAPlayersVerified[p.id]).length)}/${teamAPlayers.length}`}
                                                </span>
                                            )}
                                        </div>
                                        {teamAPlayersOpen && (
                                            <div className="border-t border-primary/10 px-3 py-2 space-y-2">
                                                {match.team_a?.players && match.team_a.players.length > 0 ? (
                                                    match.team_a.players.map((player) => (
                                                        <div key={player.id} className="flex items-center gap-2 rounded-md bg-background/50 px-2 py-1.5">
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarImage src={player.profile_image ?? ''} />
                                                                <AvatarFallback className="text-[8px] bg-primary/15 text-primary">
                                                                    {player.first_name?.[0]}{player.last_name?.[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-medium truncate text-foreground">
                                                                    {player.first_name} {player.last_name}
                                                                </p>
                                                                <p className="text-[10px] text-muted-foreground truncate">{player.email}</p>
                                                            </div>
                                                            {usePlayerVerifyA ? (
                                                                <button onClick={() => toggleTeamAPlayerVerified(player.id)} disabled={bothTeamsPresent} className={`flex h-7 w-7 items-center justify-center rounded-full transition-all shrink-0 ml-1 ${bothTeamsPresent ? 'opacity-60 cursor-not-allowed' : ''} ${teamAPlayersVerified[player.id] ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'bg-muted/30 text-muted-foreground hover:bg-accent'}`}>
                                                                    {teamAPlayersVerified[player.id] ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                                                                </button>
                                                            ) : (
                                                                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold shrink-0 ml-1 ${teamAVerified ? 'bg-primary/20 text-primary' : 'bg-muted/30 text-muted-foreground'}`}>
                                                                    {teamAVerified ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-muted-foreground text-center py-1">No player details available</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Team B */}
                                    <div className="rounded-lg border border-primary/10 bg-background/50">
                                        <div className="flex items-center justify-between p-3">
                                            <button onClick={() => setTeamBPlayersOpen(!teamBPlayersOpen)} className="flex items-center gap-2 min-w-0">
                                                {teamBPlayersOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">B</div>
                                                <div className="min-w-0"><p className="text-sm font-medium truncate">{teamBName}</p><p className="text-[10px] flex justify-start text-muted-foreground">{match.team_b?.players?.length ?? match.team_b?.player_ids?.length ?? 0} player(s)</p></div>
                                            </button>
                                            {!usePlayerVerifyB ? (
                                                <button onClick={() => { if (!bothTeamsPresent) setTeamBVerified(!teamBVerified); }} disabled={bothTeamsPresent} className={`flex h-8 w-8 items-center justify-center rounded-full transition-all shrink-0 ml-2 ${teamBVerified ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'bg-muted/30 text-muted-foreground hover:bg-accent'} ${bothTeamsPresent ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                                    {teamBVerified ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                                </button>
                                            ) : (
                                                <span className={`flex h-8 items-center justify-center gap-1 rounded-full px-3 text-[10px] font-bold shrink-0 ml-2 transition-all ${teamBReady ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'bg-muted/30 text-muted-foreground'}`}>
                                                    {teamBReady ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                                                    {teamBReady ? 'Verified' : `${(teamBPlayers.filter((p) => teamBPlayersVerified[p.id]).length)}/${teamBPlayers.length}`}
                                                </span>
                                            )}
                                        </div>
                                        {teamBPlayersOpen && (
                                            <div className="border-t border-primary/10 px-3 py-2 space-y-2">
                                                {match.team_b?.players && match.team_b.players.length > 0 ? (
                                                    match.team_b.players.map((player) => (
                                                        <div key={player.id} className="flex items-center gap-2 rounded-md bg-background/50 px-2 py-1.5">
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarImage src={player.profile_image ?? ''} />
                                                                <AvatarFallback className="text-[8px] bg-primary/15 text-primary">
                                                                    {player.first_name?.[0]}{player.last_name?.[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-medium truncate text-foreground">
                                                                    {player.first_name} {player.last_name}
                                                                </p>
                                                                <p className="text-[10px] text-muted-foreground truncate">{player.email}</p>
                                                            </div>
                                                            {usePlayerVerifyB ? (
                                                                <button onClick={() => toggleTeamBPlayerVerified(player.id)} disabled={bothTeamsPresent} className={`flex h-7 w-7 items-center justify-center rounded-full transition-all shrink-0 ml-1 ${bothTeamsPresent ? 'opacity-60 cursor-not-allowed' : ''} ${teamBPlayersVerified[player.id] ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'bg-muted/30 text-muted-foreground hover:bg-accent'}`}>
                                                                    {teamBPlayersVerified[player.id] ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                                                                </button>
                                                            ) : (
                                                                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold shrink-0 ml-1 ${teamBVerified ? 'bg-primary/20 text-primary' : 'bg-muted/30 text-muted-foreground'}`}>
                                                                    {teamBVerified ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-muted-foreground text-center py-1">No player details available</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Step 2: Presence */}
                                <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-card to-primary/5 p-4 space-y-3">
                                    <h3 className="text-sm font-medium flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">2</span>Confirm Presence</h3>
                                    <div className="flex items-center justify-between rounded-lg border border-primary/10 p-3 bg-background/50">
                                        <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Both teams present?</span></div>
                                        <button onClick={() => { if (!bothTeamsPresent && teamAReady && teamBReady) { setBothTeamsPresent(true); setDefaultTimerActive(false); setDefaultTimerExpired(false); if (timerRef.current) clearInterval(timerRef.current); } }} disabled={bothTeamsPresent || !teamAReady || !teamBReady} className={`flex h-8 w-8 items-center justify-center rounded-full transition-all shrink-0 ml-2 ${bothTeamsPresent ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'bg-muted/30 text-muted-foreground hover:bg-accent'} ${bothTeamsPresent || !teamAReady || !teamBReady ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                            {bothTeamsPresent ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {!bothTeamsPresent && !defaultTimerActive && !defaultTimerExpired && (
                                        <button onClick={() => { setDefaultTimerActive(true); setDefaultTimerSeconds(300); }} className="w-full flex items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors">
                                            <Clock className="h-4 w-4" /> Start 5-min Default Timer
                                        </button>
                                    )}
                                    {!bothTeamsPresent && defaultTimerActive && (
                                        <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/10 p-3">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-primary animate-pulse" />
                                                <span className="text-sm font-medium text-primary/80">Default timer running</span>
                                            </div>
                                            <span className="text-lg font-bold font-mono text-primary">
                                                {formatTime(defaultTimerSeconds)}
                                            </span>
                                        </div>
                                    )}
                                    {!bothTeamsPresent && defaultTimerExpired && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                                                <span className="text-sm font-medium text-destructive">Default time expired</span>
                                            </div>
                                            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm portrait:px-4 landscape:px-8">
                                                <div className="w-full max-w-sm rounded-2xl border border-primary/20 bg-gradient-to-br from-card to-primary/5 p-6 shadow-2xl text-center">
                                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20">
                                                        <Clock className="h-8 w-8 text-destructive" />
                                                    </div>
                                                    <h3 className="mt-4 text-lg font-bold text-destructive">Default Time Expired</h3>
                                                    <p className="mt-2 text-sm text-muted-foreground">
                                                        {teamAReady && !teamBReady && `Team A is checked in. Automatically declaring Team A as winner (${match.category?.game_to}-0)...`}
                                                        {!teamAReady && teamBReady && `Team B is checked in. Automatically declaring Team B as winner (${match.category?.game_to}-0)...`}
                                                        {teamAReady && teamBReady && 'Both teams are checked in. Pick a winner or play anyway.'}
                                                        {!teamAReady && !teamBReady && 'Neither team checked in. Pick a winner or play anyway.'}
                                                    </p>
                                                    <div className="mt-6 flex flex-col gap-3">
                                                        {(teamAReady && !teamBReady) && (
                                                            <button onClick={() => handleDeclareDefaultWinner('team_a')} disabled={isSubmitting}
                                                                className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">
                                                                <Gavel className="h-5 w-5" /> {teamAName} Wins ({match.category?.game_to}-0) — Declared
                                                            </button>
                                                        )}
                                                        {(!teamAReady && teamBReady) && (
                                                            <button onClick={() => handleDeclareDefaultWinner('team_b')} disabled={isSubmitting}
                                                                className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">
                                                                <Gavel className="h-5 w-5" /> {teamBName} Wins ({match.category?.game_to}-0) — Declared
                                                            </button>
                                                        )}
                                                        {(teamAReady === teamBReady) && (
                                                            <>
                                                                <div className="flex flex-col gap-2">
                                                                    <p className="text-xs text-muted-foreground font-medium">Pick a winner:</p>
                                                                    <button onClick={() => handleDeclareDefaultWinner('team_a')} disabled={isSubmitting}
                                                                        className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary/10 border border-primary/20 py-3 text-sm font-semibold text-primary hover:bg-primary/20 active:scale-[0.98] transition-all disabled:opacity-50">
                                                                        <Trophy className="h-5 w-5" /> {teamAName} Wins ({match.category?.game_to}-0)
                                                                    </button>
                                                                    <button onClick={() => handleDeclareDefaultWinner('team_b')} disabled={isSubmitting}
                                                                        className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary/10 border border-primary/20 py-3 text-sm font-semibold text-primary hover:bg-primary/20 active:scale-[0.98] transition-all disabled:opacity-50">
                                                                        <Trophy className="h-5 w-5" /> {teamBName} Wins ({match.category?.game_to}-0)
                                                                    </button>
                                                                </div>
                                                                <div className="relative">
                                                                    <div className="absolute inset-0 flex items-center">
                                                                        <span className="w-full border-t border-primary/10" />
                                                                    </div>
                                                                    <div className="relative flex justify-center text-xs uppercase">
                                                                        <span className="bg-card px-2 text-muted-foreground">or</span>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                        <button onClick={handlePlayAnyway}
                                                            className="w-full rounded-xl border border-primary/20 bg-background py-3 text-sm font-semibold text-foreground hover:bg-primary/5 active:scale-[0.98] transition-all">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Swords className="h-5 w-5 text-primary" /> Play Anyway — Start Coin Toss
                                                            </div>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Step 3: Ready to Start */}
                                {(teamAReady && teamBReady && bothTeamsPresent) || (teamAReady && teamBReady && defaultTimerExpired) ? (
                                    <button onClick={() => { setSetupComplete(true); setCoinPhase('idle'); }} className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 p-4 text-center text-primary-foreground font-semibold shadow-lg hover:brightness-110 active:scale-[0.98] transition-all">
                                        <div className="flex items-center justify-center gap-2">Proceed to Coin Toss</div>
                                    </button>
                                ) : (
                                    <div className="rounded-xl border border-primary/10 bg-muted/20 p-4 text-center">
                                        <p className="text-xs text-muted-foreground">
                                {!teamAReady && 'Verify Team A '}{!teamAReady && !teamBReady && '& '}{!teamBReady && 'Verify Team B '}
                                            {(teamAReady && teamBReady && !bothTeamsPresent && !defaultTimerExpired) && 'Confirm both teams are present'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* COIN TOSS */}
                        {setupComplete && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm portrait:px-4 landscape:px-8">
                                <div className="w-full max-w-sm rounded-2xl border border-primary/20 bg-gradient-to-br from-card to-primary/5 p-6 shadow-2xl portrait:max-h-[90vh] portrait:overflow-y-auto">
                                    {/* IDLE */}
                                    {coinPhase === 'idle' && (
                                        <div className="text-center space-y-6">
                                            <div className="space-y-2"><h3 className="text-lg font-bold">Coin Toss</h3><p className="text-sm text-muted-foreground">Tap the coin to perform the toss</p></div>
                                            <div ref={coinRef} onClick={handleCoinTap} className="relative mx-auto h-40 w-40 cursor-pointer" style={{ perspective: '800px' }}>
                                                <div className="relative h-full w-full transition-transform duration-[2000ms] ease-in-out" style={{ transformStyle: 'preserve-3d', transform: `rotateY(${flipRotation}deg)` }}>
                                                    <div className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-primary/40 bg-gradient-to-br from-primary/80 to-primary shadow-xl" style={{ backfaceVisibility: 'hidden' }}>
                                                        <div className="flex flex-col items-center"><span className="text-4xl font-black text-primary-foreground">H</span><span className="text-[8px] font-bold text-primary-foreground/70 uppercase tracking-wider mt-1">Heads</span></div>
                                                    </div>
                                                    <div className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-primary/30 bg-gradient-to-br from-primary/60 to-primary/40 shadow-xl" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                                                        <div className="flex flex-col items-center"><span className="text-4xl font-black text-primary-foreground/80">T</span><span className="text-[8px] font-bold text-primary-foreground/60 uppercase tracking-wider mt-1">Tails</span></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground">Tap anywhere on the coin</p>
                                        </div>
                                    )}
                                    {/* FLIPPING */}
                                    {coinPhase === 'flipping' && (
                                        <div className="text-center space-y-6">
                                            <div className="space-y-2"><h3 className="text-lg font-bold">Flipping...</h3><p className="text-sm text-muted-foreground">The coin is in the air!</p></div>
                                            <div className="relative mx-auto h-40 w-40" style={{ perspective: '800px' }}>
                                                <div className="relative h-full w-full" style={{ animation: 'coin-flip-spin 0.6s ease-in-out infinite', transformStyle: 'preserve-3d' }}>
                                                    <div className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-primary/40 bg-gradient-to-br from-primary/80 to-primary shadow-xl" style={{ backfaceVisibility: 'hidden' }}>
                                                        <div className="flex flex-col items-center"><span className="text-4xl font-black text-primary-foreground">H</span><span className="text-[8px] font-bold text-primary-foreground/70 uppercase tracking-wider mt-1">Heads</span></div>
                                                    </div>
                                                    <div className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-primary/30 bg-gradient-to-br from-primary/60 to-primary/40 shadow-xl" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                                                        <div className="flex flex-col items-center"><span className="text-4xl font-black text-primary-foreground/80">T</span><span className="text-[8px] font-bold text-primary-foreground/60 uppercase tracking-wider mt-1">Tails</span></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground animate-pulse">Flipping...</p>
                                        </div>
                                    )}
                                    {/* RESULT */}
                                    {coinPhase === 'result' && coinResult && (
                                        <div className="text-center space-y-4">
                                            <div className="space-y-2"><h3 className="text-lg font-bold">Result!</h3></div>
                                            <div className={`mx-auto h-32 w-32 rounded-full border-4 flex items-center justify-center shadow-xl ${coinResult === 'heads' ? 'border-primary/50 bg-gradient-to-br from-primary to-primary/80' : 'border-primary/30 bg-gradient-to-br from-primary/70 to-primary/40'}`}>
                                                <div className="flex flex-col items-center"><span className="text-5xl font-black text-primary-foreground drop-shadow-lg">{coinResult === 'heads' ? 'H' : 'T'}</span><span className="text-[10px] font-bold text-primary-foreground/80 uppercase tracking-wider mt-1">{coinResult}</span></div>
                                            </div>
                                            <p className="text-sm font-medium">It's <span className="font-bold uppercase text-primary">{coinResult}</span>!</p>
                                            <button onClick={proceedToChooseWinner} className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all">Continue</button>
                                        </div>
                                    )}
                                    {/* CHOOSE WINNER */}
                                    {coinPhase === 'choose_winner' && coinResult && (
                                        <div className="text-center space-y-4">
                                            <div className="space-y-2"><h3 className="text-lg font-bold">{coinResult === 'heads' ? 'Heads' : 'Tails'} Wins!</h3><p className="text-sm text-muted-foreground">Which team won the toss?</p></div>
                                            <div className="flex flex-col gap-3">
                                                <button onClick={() => handleWinnerSelect('team_a')} className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-left hover:bg-primary/10 active:scale-[0.98] transition-all">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">A</div>
                                                    <div><p className="text-sm font-semibold">{teamAName}</p><p className="text-[10px] text-muted-foreground">Team A</p></div>
                                                </button>
                                                <button onClick={() => handleWinnerSelect('team_b')} className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-left hover:bg-primary/10 active:scale-[0.98] transition-all">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">B</div>
                                                    <div><p className="text-sm font-semibold">{teamBName}</p><p className="text-[10px] text-muted-foreground">Team B</p></div>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {/* COMPLETE - START */}
                                    {coinPhase === 'complete' && (
                                        <div className="text-center space-y-4">
                                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20"><Trophy className="h-8 w-8 text-primary" /></div>
                                            <div className="space-y-1"><h3 className="text-lg font-bold text-primary">Setup Complete!</h3><p className="text-sm text-muted-foreground">The match is ready to begin.</p></div>
                                            <button onClick={startMatch} disabled={isSubmitting} className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 py-3 px-6 text-sm font-semibold text-primary-foreground shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">
                                                {isSubmitting ? 'Starting...' : 'Start Match & Open Scoring Board'}
                                            </button>
                                            <button onClick={resetCoinToss} className="w-full rounded-lg border border-primary/20 py-2 text-xs text-muted-foreground hover:bg-primary/5 transition-colors">Redo Coin Toss</button>
                                        </div>
                                    )}
                                    {/* CHOOSE OPTION */}
                                    {coinPhase === 'choose_option' && (
                                        <div className="text-center space-y-4">
                                            <div className="space-y-2"><h3 className="text-lg font-bold">{coinTossWinner === 'team_a' ? teamAName : teamBName} Won!</h3><p className="text-sm text-muted-foreground">Choose: Service or Court?</p></div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button onClick={() => handleChoiceSelect('service')} className="flex flex-col items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-6 hover:bg-primary/10 active:scale-[0.98] transition-all">
                                                    <Swords className="h-8 w-8 text-primary" /><span className="text-sm font-semibold">Service</span>
                                                </button>
                                                <button onClick={() => handleChoiceSelect('court')} className="flex flex-col items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-6 hover:bg-primary/10 active:scale-[0.98] transition-all">
                                                    <ShieldHalf className="h-8 w-8 text-primary" /><span className="text-sm font-semibold">Court</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {/* CHOOSE COURT */}
                                    {coinPhase === 'choose_court' && (
                                        <div className="text-center space-y-4">
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-bold">{ servingTeam === 'team_a' ? teamBName : teamAName } <span className="ml-1 text-base font-bold text-muted-foreground">will choose the court side</span></h3>
                                                <p className="text-sm text-muted-foreground">Choose left or right side</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button onClick={() => handleCourtSelect('left')} className="flex flex-col items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-6 hover:bg-primary/10 active:scale-[0.98] transition-all">
                                                    <span className="text-2xl">⬅️</span><span className="text-sm font-semibold">Left Court</span>
                                                </button>
                                                <button onClick={() => handleCourtSelect('right')} className="flex flex-col items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-6 hover:bg-primary/10 active:scale-[0.98] transition-all">
                                                    <span className="text-2xl">➡️</span><span className="text-sm font-semibold">Right Court</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* PLAYER CHANGE WARNING MODAL */}
            {showPlayerChangeModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm portrait:px-4 landscape:px-8">
                    <div className="w-full max-w-sm rounded-2xl border border-primary/20 bg-gradient-to-br from-card to-primary/5 p-6 shadow-2xl text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20"><AlertTriangle className="h-8 w-8 text-primary" /></div>
                        <h3 className="mt-4 text-lg font-bold text-primary">Player Change Required</h3>
                        <p className="mt-2 text-primary/70">
                            {match.live_configuration?.court_change_trigger === 'rally-count'
                                ? `${match.live_configuration.court_change_interval ?? 10} rallies have been played. Please change players now.`
                                : match.live_configuration?.court_change_trigger === 'score-count'
                                ? `A team has reached ${match.live_configuration.court_change_interval ?? 11} points. Please change sides now.`
                                : 'Time to change sides. Please change courts now.'}
                        </p>
                        <p className="mt-1 text-xs text-primary/50">The game timer continues running while you change players.</p>
                        <div className="mt-6 flex gap-3">
                            <button onClick={confirmPlayerChange} disabled={isSubmitting} className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary/80 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">
                                {isSubmitting ? 'Confirming...' : '✓ Okay, Changed Players'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* WINNER CONFIRMATION MODAL */}
            {showWinnerConfirmation && winner && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm portrait:px-4 landscape:px-8">
                    <div className="w-full max-w-sm rounded-2xl border border-primary/20 bg-gradient-to-br from-card to-primary/5 p-6 shadow-2xl text-center">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-xl">
                            <Trophy className="h-10 w-10 text-primary-foreground" />
                        </div>
                        <h3 className="mt-4 text-xl font-bold text-primary">Confirm Winner?</h3>
                        <p className="mt-2 text-lg font-semibold text-foreground">
                            {winner === 'team_a' ? teamAName : teamBName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Score: {scores.team_a} - {scores.team_b} (Game to {match.category?.game_to ?? 11})
                        </p>
                        <p className="mt-1 text-xs text-primary/60">
                            Has {winner === 'team_a' ? teamAName : teamBName} won the match?
                        </p>
                        <div className="mt-6 flex gap-3">
                            <button onClick={cancelWinner} disabled={isSubmitting}
                                className="flex-1 rounded-xl border border-destructive/30 bg-destructive/10 py-3 text-sm font-semibold text-destructive hover:bg-destructive/20 active:scale-[0.98] transition-all disabled:opacity-50">
                                No, undo last point
                            </button>
                            <button onClick={confirmWinner} disabled={isSubmitting}
                                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary/80 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">
                                {isSubmitting ? 'Confirming...' : 'Yes, they won!'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* END MATCH CONFIRMATION MODAL */}
            {showEndMatchConfirmation && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm portrait:px-4 landscape:px-8">
                    <div className="w-full max-w-sm rounded-2xl border border-destructive/30 bg-gradient-to-br from-card to-destructive/5 p-6 shadow-2xl text-center">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/20 shadow-xl">
                            <Trophy className="h-10 w-10 text-destructive" />
                        </div>
                        <h3 className="mt-4 text-xl font-bold text-destructive">End Match?</h3>
                        <p className="mt-2 text-lg font-semibold text-foreground">
                            {teamAName} {scores.team_a} - {scores.team_b} {teamBName}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">This will submit the current match and cannot be undone.</p>
                        <div className="mt-6 flex gap-3">
                            <button onClick={() => setShowEndMatchConfirmation(false)} disabled={isSubmitting}
                                className="flex-1 rounded-xl border border-primary/20 bg-background py-3 text-sm font-semibold text-foreground hover:bg-primary/5 active:scale-[0.98] transition-all disabled:opacity-50">
                                Cancel
                            </button>
                            <button onClick={async () => { setShowEndMatchConfirmation(false); await endMatch(); }} disabled={isSubmitting}
                                className="flex-1 rounded-xl bg-destructive py-3 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98] transition-all disabled:opacity-50">
                                {isSubmitting ? 'Ending...' : 'Yes, end match'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes coin-spin { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(360deg); } }
                @keyframes coin-flip-spin { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(360deg); } }
                @keyframes shimmer-slide {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes shimmer-overlay {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .shimmer-slide {
                    animation: shimmer-slide 3s ease-in-out infinite;
                }
                .shimmer-overlay {
                    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%);
                    background-size: 200% 100%;
                    animation: shimmer-overlay 2.5s ease-in-out infinite;
                }
            `}</style>
        </>
    );
}

