export default function AboutTab({ tournament }: { tournament: any }) {
    return (
        <div className="rounded-lg border border-border/60 bg-background/70 p-4">
            <div className="text-sm font-semibold">About</div>
            <div className="mt-2 text-sm text-muted-foreground">{tournament.description || 'No description provided.'}</div>
        </div>
    );
}
