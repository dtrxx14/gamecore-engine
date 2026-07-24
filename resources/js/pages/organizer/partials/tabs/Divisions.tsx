export default function DivisionsTab({ tournament }: { tournament: any }) {
    return (
        <div className="space-y-4">
            <div className="text-sm font-semibold">Divisions</div>
            <div className="mt-2 grid gap-3">
                {(tournament.divisions || []).map((d: any) => (
                    <div key={d.id} className="rounded-md border border-border/50 bg-card p-3">
                        <div className="text-sm font-semibold">{d.title}</div>
                        <div className="text-xs text-muted-foreground">{d.description}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
