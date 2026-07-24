export default function ScheduleTab({ tournament }: { tournament: any }) {
    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-background/70 p-4">
                <div className="text-sm font-semibold">Schedule</div>
                <div className="mt-2 text-sm text-muted-foreground">Match schedule and court assignments.</div>
            </div>
        </div>
    );
}
