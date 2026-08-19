import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface TeamOption {
    id: number;
    name: string;
}

interface TeamSearchInputProps {
    teams: TeamOption[];
    selectedTeamId: number | null;
    onTeamChange: (teamId: string) => void;
    placeholder?: string;
}

export default function TeamSearchInput({
    teams,
    selectedTeamId,
    onTeamChange,
    placeholder = 'Search team by name...',
}: TeamSearchInputProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const selectedTeam = teams.find((team) => team.id === selectedTeamId) ?? null;
    const normalizedQuery = query.trim().toLowerCase();
    const filteredTeams = teams.filter((team) => team.name.toLowerCase().includes(normalizedQuery));

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectTeam = (team: TeamOption) => {
        onTeamChange(String(team.id));
        setQuery('');
        setIsOpen(false);
    };

    const clearTeam = () => {
        onTeamChange('');
        setQuery('');
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className="relative mt-1.5">
            {selectedTeam && !isOpen ? (
                <div className="flex min-h-10 items-center justify-between rounded-lg border border-input bg-background px-3 py-2">
                    <Badge variant="secondary" className="max-w-[calc(100%-2rem)] truncate">
                        {selectedTeam.name}
                    </Badge>
                    <button
                        type="button"
                        aria-label={`Clear ${selectedTeam.name}`}
                        onClick={clearTeam}
                        className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        autoFocus={isOpen}
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        placeholder={selectedTeam ? selectedTeam.name : placeholder}
                        className="pl-9"
                    />
                </div>
            )}

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-border/60 bg-popover shadow-lg">
                    {filteredTeams.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No teams found</div>
                    ) : (
                        <ul className="max-h-48 overflow-auto py-1">
                            {filteredTeams.map((team) => (
                                <li key={team.id}>
                                    <button
                                        type="button"
                                        onClick={() => selectTeam(team)}
                                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-muted"
                                    >
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-[10px] font-bold text-red-600 dark:text-red-400">
                                            {team.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="truncate font-medium text-foreground">{team.name}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
