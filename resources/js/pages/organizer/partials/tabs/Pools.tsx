export default function PoolsTab({ tournament }: { tournament: any }) {
    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-background/70 p-4">
                <div className="text-sm font-semibold">Pools</div>
                <div className="mt-2 text-sm text-muted-foreground">Pool match lists and standings go here.</div>
            </div>
        </div>
    );
}
