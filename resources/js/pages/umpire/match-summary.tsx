import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { ShieldHalf, Trophy, Swords, Clock, Users, Calendar, ArrowLeft, CheckCircle, Medal, Pen, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SignaturePad from '@/components/ui/signature-pad';

interface Status {
    id: number;
    name: string;
    slug: string;
}

interface LiveCategory {
    id: number;
    name: string;
    game_to: number;
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
    status_id: number;
    start_play_at: string | null;
    end_play_at: string | null;
    is_paused: boolean;
    team_a?: LiveTeam | null;
    team_b?: LiveTeam | null;
    category?: LiveCategory | null;
    status?: Status | null;
    live_configuration?: LiveConfiguration;
    team_a_signature?: string | null;
    team_b_signature?: string | null;
    team_a_signed_by?: number | null;
    team_b_signed_by?: number | null;
}

interface Props {
    match: LiveMatchScore;
    winner: string | null;
    duration_formatted: string | null;
}

export default function MatchSummary({ match, winner, duration_formatted }: Props) {
    
    const [teamASignature, setTeamASignature] = useState<string | null>(match.team_a_signature ?? null);
    const [teamBSignature, setTeamBSignature] = useState<string | null>(match.team_b_signature ?? null);
    const [isSaving, setIsSaving] = useState(false);
    const [savedSuccessfully, setSavedSuccessfully] = useState(false);

    const hasSignatures = Boolean(match.team_a_signature) || Boolean(match.team_b_signature);
    const signaturesComplete = Boolean(teamASignature) && Boolean(teamBSignature);
    const allSignaturesSaved = Boolean(match.team_a_signature) && Boolean(match.team_b_signature);

    const getTeamName = (team: LiveTeam | null | undefined, teamId: number | null | undefined) => {
        if (team?.name) return team.name;
        if (!teamId) return '—';
        return `Team #${teamId}`;
    };

    const teamAName = getTeamName(match.team_a, match.team_a_id);
    const teamBName = getTeamName(match.team_b, match.team_b_id);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    winner = winner ?? (match.team_a_score > match.team_b_score ? 'team_a' : match.team_b_score > match.team_a_score ? 'team_b' : null);
    const winnerName = winner === 'team_a' ? teamAName : teamBName;
    const winnerScore = winner === 'team_a' ? match.team_a_score : match.team_b_score;
    const loserScore = winner === 'team_a' ? match.team_b_score : match.team_a_score;

    const saveSignatures = async () => {
        if (!signaturesComplete || isSaving) return;
        setIsSaving(true);
        try {
            const response = await fetch(`/umpire/match/${match.id}/signatures`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                body: JSON.stringify({
                    team_a_signature: teamASignature,
                    team_b_signature: teamBSignature,
                }),
            });
            const data = await response.json();
            if (data.success) {
                setSavedSuccessfully(true);
            }
        } catch (error) {
            console.error('Failed to save signatures:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const goToDashboard = () => {
        router.visit('/umpire/dashboard');
    };

    const isSignedMode = allSignaturesSaved || savedSuccessfully;

    return (
        <>
            <Head title={`Match Summary - Court ${match.court_number}`} />

            <div className="flex min-h-dvh flex-col bg-gradient-to-b from-background to-muted/20 portrait:pb-safe landscape:pb-safe">
                {/* Header */}
                <header className="sticky top-0 z-20 border-b border-border/50 bg-background/90 backdrop-blur-md">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <button
                            onClick={goToDashboard}
                            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent/50 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base font-semibold truncate">Match Summary</h1>
                            <p className="text-xs text-muted-foreground truncate">
                                Court {match.court_number} · {match.live_configuration?.name}
                            </p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-xs border-emerald-200 bg-emerald-50 text-emerald-700">
                            Completed
                        </Badge>
                    </div>
                </header>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 portrait:max-w-lg portrait:mx-auto landscape:max-w-2xl landscape:mx-auto w-full">
                    {/* Winner Hero Section */}
                    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 p-6 text-center shadow-lg dark:from-emerald-950/40 dark:via-card dark:to-emerald-950/30 dark:border-emerald-800">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-xl mb-4">
                            <Trophy className="h-10 w-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-black text-emerald-800 dark:text-emerald-300">Match Complete!</h2>
                        <p className="mt-2 text-lg font-semibold text-foreground">
                            <span className="text-emerald-600 dark:text-emerald-400">{winnerName}</span> wins!
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-4">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground">{winner === 'team_a' ? teamAName : teamBName}</p>
                                <p className="text-5xl font-black text-emerald-600 dark:text-emerald-400">{winnerScore}</p>
                            </div>
                            <span className="text-2xl font-bold text-muted-foreground">-</span>
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground">{winner === 'team_a' ? teamBName : teamAName}</p>
                                <p className="text-5xl font-black text-red-500">{loserScore}</p>
                            </div>
                        </div>
                        {match.category && (
                            <div className="mt-3 flex items-center justify-center gap-2">
                                <Badge variant="outline" className="text-xs border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
                                    Game to {match.category.game_to}
                                </Badge>
                                {duration_formatted !== null && (
                                    <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400">
                                        <Clock className="mr-1 h-3 w-3" />
                                        {duration_formatted}
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Match Details */}
                    <div className="rounded-xl border border-border/60 bg-card/50 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldHalf className="h-4 w-4 text-red-500" />
                            <h3 className="text-sm font-semibold">Match Details</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">Configuration</p>
                                <p className="font-medium">{match.live_configuration?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Court Number</p>
                                <p className="font-medium">Court {match.court_number}</p>
                            </div>
                            {match.category && (
                                <>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Category</p>
                                        <p className="font-medium">{match.category.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Scoring System</p>
                                        <p className="font-medium capitalize">{match.live_configuration?.scoring_system === 'side-out' ? 'Side Out' : 'Rally Point'}</p>
                                    </div>
                                </>
                            )}
                            <div>
                                <p className="text-xs text-muted-foreground">Date & Time</p>
                                <p className="font-medium text-xs">{formatDate(match.start_play_at)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Duration</p>
                                <p className="font-medium">{duration_formatted ?? '—'}</p>
                            </div>
                            {match.serving_team && (
                                <div className="col-span-2">
                                    <p className="text-xs text-muted-foreground">First Serve</p>
                                    <p className="font-medium">{match.serving_team === 'team_a' ? teamAName : teamBName}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Team A Players */}
                    {match.team_a?.players && match.team_a.players.length > 0 && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-5 dark:border-blue-800 dark:bg-blue-950/20">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/15 text-xs font-bold text-blue-600">A</div>
                                <h3 className="text-sm font-semibold">{teamAName}</h3>
                                {winner === 'team_a' && (
                                    <Badge variant="outline" className="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 ml-auto">
                                        <Medal className="mr-0.5 h-3 w-3" /> Winner
                                    </Badge>
                                )}
                            </div>
                            <div className="space-y-2">
                                {match.team_a.players.map((player) => (
                                    <div key={player.id} className="flex items-center gap-3 rounded-lg bg-white/60 dark:bg-black/20 p-2.5">
                                        <Avatar className="h-8 w-8 shrink-0">
                                            <AvatarImage src={player.profile_image ?? undefined} />
                                            <AvatarFallback className="text-[10px] bg-blue-500/10 text-blue-600">
                                                {player.first_name?.[0]}{player.last_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{[player.first_name, player.last_name].filter(Boolean).join(' ') || player.email}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{player.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Team B Players */}
                    {match.team_b?.players && match.team_b.players.length > 0 && (
                        <div className="rounded-xl border border-purple-200 bg-purple-50/30 p-5 dark:border-purple-800 dark:bg-purple-950/20">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/15 text-xs font-bold text-purple-600">B</div>
                                <h3 className="text-sm font-semibold">{teamBName}</h3>
                                {winner === 'team_b' && (
                                    <Badge variant="outline" className="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 ml-auto">
                                        <Medal className="mr-0.5 h-3 w-3" /> Winner
                                    </Badge>
                                )}
                            </div>
                            <div className="space-y-2">
                                {match.team_b.players.map((player) => (
                                    <div key={player.id} className="flex items-center gap-3 rounded-lg bg-white/60 dark:bg-black/20 p-2.5">
                                        <Avatar className="h-8 w-8 shrink-0">
                                            <AvatarImage src={player.profile_image ?? undefined} />
                                            <AvatarFallback className="text-[10px] bg-purple-500/10 text-purple-600">
                                                {player.first_name?.[0]}{player.last_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{[player.first_name, player.last_name].filter(Boolean).join(' ') || player.email}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{player.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Captain Signatures Section */}
                    <div className="rounded-xl border border-border/60 bg-card/50 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Pen className="h-4 w-4 text-red-500" />
                            <h3 className="text-sm font-semibold">{match.live_configuration?.scoring_system == 'rally-point' ? 'Captain' : 'Player'} Signatures</h3>
                            {isSignedMode && (
                                <Badge variant="outline" className="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 ml-auto">
                                    <Check className="mr-0.5 h-3 w-3" /> Signed
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">
                            {isSignedMode
                                ? 'Signatures have been collected and saved.'
                                : match.live_configuration?.scoring_system == 'rally-point' ? 'Both team captains must sign below to confirm the match results.' : 'Both team representatives must sign below to confirm the match results.'}
                        </p>

                        <div className="space-y-4">
                            {/* Team A Signature */}
                            <div className="rounded-lg border border-blue-200 bg-blue-50/20 p-4 dark:border-blue-800 dark:bg-blue-950/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/15 text-[9px] font-bold text-blue-600">A</div>
                                    <span className="text-sm font-semibold">{teamAName}</span>
                                    {isSignedMode && (
                                        <CheckCircle className="h-4 w-4 text-emerald-500 ml-auto" />
                                    )}
                                </div>
                                <SignaturePad
                                    label={match.live_configuration?.scoring_system == 'rally-point' ? "Team Captain Signature" : "Team Representative Signature"}
                                    color="#2563eb"
                                    onSave={(dataUrl) => setTeamASignature(dataUrl)}
                                    disabled={isSignedMode}
                                    defaultValue={isSignedMode ? match.team_a_signature : undefined}
                                />
                            </div>

                            {/* Team B Signature */}
                            <div className="rounded-lg border border-purple-200 bg-purple-50/20 p-4 dark:border-purple-800 dark:bg-purple-950/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/15 text-[9px] font-bold text-purple-600">B</div>
                                    <span className="text-sm font-semibold">{teamBName}</span>
                                    {isSignedMode && (
                                        <CheckCircle className="h-4 w-4 text-emerald-500 ml-auto" />
                                    )}
                                </div>
                                <SignaturePad
                                    label={match.live_configuration?.scoring_system == 'rally-point' ? "Team Captain Signature" : "Team Representative Signature"}
                                    color="#9333ea"
                                    onSave={(dataUrl) => setTeamBSignature(dataUrl)}
                                    disabled={isSignedMode}
                                    defaultValue={isSignedMode ? match.team_b_signature : undefined}
                                />
                            </div>
                        </div>

                        {/* Save Signatures Button */}
                        {!isSignedMode && (
                            <button
                                onClick={saveSignatures}
                                disabled={!signaturesComplete || isSaving}
                                className="mt-4 w-full rounded-xl bg-gradient-to-r from-red-600 to-red-500 py-3 text-sm font-semibold text-white shadow-lg hover:from-red-500 hover:to-red-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <>Saving...</>
                                ) : (
                                    <>
                                        <Check className="h-5 w-5" />
                                        {signaturesComplete ? 'Save Signatures' : 'Both Signatures Required'}
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Back to Dashboard Button */}
                    <div className="pt-2 pb-8">
                        <button
                            onClick={goToDashboard}
                            className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-500 py-4 text-white font-semibold shadow-lg hover:from-red-500 hover:to-red-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
