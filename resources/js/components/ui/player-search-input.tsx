import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface Player {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
}

interface PlayerSearchInputProps {
    selectedPlayers: Player[];
    onPlayersChange: (players: Player[]) => void;
    placeholder?: string;
    unavailablePlayerIds?: number[];
}

export default function PlayerSearchInput({
    selectedPlayers,
    onPlayersChange,
    placeholder = 'Search players by name or email...',
    unavailablePlayerIds = [],
}: PlayerSearchInputProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Player[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch initial 20 players on mount
    useEffect(() => {
        searchPlayers('');
    }, []);

    // Re-fetch whenever selectedPlayers or unavailablePlayerIds changes
    // so after removing a player, they reappear in the search list
    useEffect(() => {
        if (isOpen) {
            searchPlayers(query);
        }
    }, [selectedPlayers.length, unavailablePlayerIds.length]);

    const searchPlayers = async (q: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (q.trim().length > 0) {
                params.set('q', q);
            }
            // Send the list of players to exclude so the backend returns 20 fresh results
            const allExcluded = [...new Set([
                ...selectedPlayers.map((p) => p.id),
                ...unavailablePlayerIds,
            ])];
            if (allExcluded.length > 0) {
                params.set('exclude_ids', allExcluded.join(','));
            }
            // Always fetch — empty query returns first 20 available players
            const res = await fetch(`/admin/live-configuration/players/search?${params.toString()}`);
            const data: Player[] = await res.json();
            setResults(data);
            setIsOpen(data.length > 0 || q.trim().length > 0);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            searchPlayers(value);
        }, 300);
    };

    const addPlayer = (player: Player) => {
        onPlayersChange([...selectedPlayers, player]);
        setQuery('');
        setResults([]);
        setIsOpen(false);
    };

    const removePlayer = (playerId: number) => {
        onPlayersChange(selectedPlayers.filter((p) => p.id !== playerId));
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Selected players badges */}
            {selectedPlayers.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                    {selectedPlayers.map((player) => (
                        <Badge
                            key={player.id}
                            variant="secondary"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs"
                        >
                            {player.first_name} {player.last_name}
                            <button
                                type="button"
                                onClick={() => removePlayer(player.id)}
                                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {/* Search input */}
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (results.length > 0) setIsOpen(true);
                    }}
                    placeholder={placeholder}
                    className="pl-9"
                />
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-border/60 bg-popover shadow-lg">
                    {loading ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>
                    ) : results.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                            {query.trim().length > 0 ? 'No players found' : 'Type to search players'}
                        </div>
                    ) : (
                        <ul className="max-h-48 overflow-auto py-1">
                            {results.map((player) => (
                                <li
                                    key={player.id}
                                    onClick={() => addPlayer(player)}
                                    className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition hover:bg-muted"
                                >
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                        {player.first_name.charAt(0).toUpperCase()}{player.last_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate font-medium text-foreground">
                                            {player.first_name} {player.last_name}
                                        </div>
                                        <div className="truncate text-xs text-muted-foreground">{player.email}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

