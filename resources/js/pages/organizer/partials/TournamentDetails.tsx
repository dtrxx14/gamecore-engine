import { useState } from 'react';
import AboutTab from './tabs/About';
import DivisionsTab from './tabs/Divisions';
import InfoTab from './tabs/Info';
import LiveTab from './tabs/Live';
import PoolsTab from './tabs/Pools';
import ScheduleTab from './tabs/Schedule';

const TABS = ['Info', 'Pools', 'Schedule', 'About', 'Divisions', 'Live'] as const;

export default function TournamentDetails({ tournament }: { tournament: any }) {
    const [tab, setTab] = useState<typeof TABS[number]>('Info');

    return (
        <div className="rounded-lg border border-border/60 bg-card/90 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">{tournament.title}</h3>
                    <div className="text-sm text-muted-foreground">{tournament.division}</div>
                </div>
                <div className="text-sm text-muted-foreground">{tournament.date}</div>
            </div>

            <div className="mt-4">
                <nav className="flex gap-2 border-b pb-3">
                    {TABS.map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-3 py-1 text-sm ${t === tab ? 'font-semibold border-b-2 border-primary' : 'text-muted-foreground'}`}
                        >
                            {t}
                        </button>
                    ))}
                </nav>

                <div className="mt-4">
                    {tab === 'Info' && <InfoTab tournament={tournament} />}
                    {tab === 'Pools' && <PoolsTab tournament={tournament} />}
                    {tab === 'Schedule' && <ScheduleTab tournament={tournament} />}
                    {tab === 'About' && <AboutTab tournament={tournament} />}
                    {tab === 'Divisions' && <DivisionsTab tournament={tournament} />}
                    {tab === 'Live' && <LiveTab tournament={tournament} />}
                </div>
            </div>
        </div>
    );
}
