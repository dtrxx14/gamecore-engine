import { MapPin } from 'lucide-react';

export default function InfoTab({ tournament }: { tournament: any }) {
    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-background/70 p-4">
                <div className="text-sm font-semibold">Tournament date</div>
                <div className="mt-1 text-sm">{tournament.date || 'TBD'}</div>
            </div>

            <div className="rounded-lg border border-border/60 bg-background/70 p-4">
                <div className="text-sm font-semibold">Categories</div>
                <div className="mt-2 space-y-2">
                    {(tournament.categories || []).map((c: any) => (
                        <div key={c.id} className="rounded-md border border-border/50 bg-card p-3">
                            <div className="text-sm font-semibold">{c.title}</div>
                            <div className="text-xs text-muted-foreground">{c.division}</div>
                            <div className="mt-1 text-xs">{c.date} • Fee: {c.entry_fee}</div>
                            <div className="mt-1 text-xs">Entries: {c.entries_current}/{c.entries_max}</div>
                        </div>
                    ))}
                </div>
            </div>

            {tournament.venue && (
                <div className="rounded-lg border border-border/60 bg-background/70 p-4">
                    <div className="text-sm font-semibold">Venue</div>
                    <div className="mt-2 flex items-center gap-2">
                        <MapPin className="size-4 text-primary" />
                        <div>
                            <div className="font-medium">{tournament.venue}</div>
                            {tournament.contact && <div className="text-xs text-muted-foreground">{tournament.contact}</div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
