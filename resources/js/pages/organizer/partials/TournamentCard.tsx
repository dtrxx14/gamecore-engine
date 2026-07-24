import { MapPin } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

type Tournament = {
    id: number;
    title: string;
    division?: string;
    date?: string;
    entry_fee?: string;
    entries_current?: number;
    entries_max?: number;
    venue?: string;
    contact?: string;
};

export default function TournamentCard({ tournament, onSelect }: { tournament: Tournament; onSelect: (t: Tournament) => void; }) {
    return (
        <div className="rounded-lg border border-border/60 bg-background/70 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-sm font-semibold">{tournament.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{tournament.division}</div>
                    <div className="mt-2 text-sm text-foreground">{tournament.date} • {tournament.entry_fee}</div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="text-xs text-muted-foreground">Entries</div>
                    <div className="text-sm font-semibold">{tournament.entries_current ?? 0}/{tournament.entries_max ?? '—'}</div>
                    <Button variant="outline" size="sm" onClick={() => onSelect(tournament)}>
                        View
                    </Button>
                </div>
            </div>

            {tournament.venue && (
                <div className="mt-3 rounded-md border border-border/40 bg-card/80 p-3 text-sm">
                    <div className="flex items-center gap-2 text-sm">
                        <MapPin className="size-4 text-primary" />
                        <div>
                            <div className="font-medium">{tournament.venue}</div>
                            {tournament.contact && <div className="text-xs text-muted-foreground">Contact: {tournament.contact}</div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
