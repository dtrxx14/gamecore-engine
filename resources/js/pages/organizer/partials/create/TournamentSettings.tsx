import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TournamentSettings({
    data,
    errors = {},
    onChange,
    courts,
    setCourts,
}: {
    data: any;
    errors?: Record<string, string>;
    onChange: (field: string, value: any) => void;
    courts: string[];
    setCourts: (courts: string[]) => void;
}) {
    const [newCourt, setNewCourt] = useState('');

    const addCourt = () => {
        if (!newCourt.trim()) {
            return;
        }

        setCourts([...courts, newCourt.trim()]);
        setNewCourt('');
    };

    const removeCourt = (index: number) => {
        setCourts(courts.filter((_, idx) => idx !== index));
    };

    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold">Tournament settings</h3>
            <div className="mt-3 text-sm text-muted-foreground">Configure match times, court defaults, and registration settings.</div>

            <div className="mt-4 grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label htmlFor="call_time_in_hours">Call time</Label>
                        <Input id="call_time_in_hours" value={data.call_time_in_hours} onChange={(e: any) => onChange('call_time_in_hours', e.target.value)} className="mt-1" />
                        {errors.call_time_in_hours ? <p className="mt-2 text-sm text-destructive">{errors.call_time_in_hours}</p> : null}
                    </div>
                    <div>
                        <Label htmlFor="start_time_in_hours">Start time</Label>
                        <Input id="start_time_in_hours" value={data.start_time_in_hours} onChange={(e: any) => onChange('start_time_in_hours', e.target.value)} className="mt-1" />
                        {errors.start_time_in_hours ? <p className="mt-2 text-sm text-destructive">{errors.start_time_in_hours}</p> : null}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label htmlFor="end_time_in_hours">End time</Label>
                        <Input id="end_time_in_hours" value={data.end_time_in_hours} onChange={(e: any) => onChange('end_time_in_hours', e.target.value)} className="mt-1" />
                        {errors.end_time_in_hours ? <p className="mt-2 text-sm text-destructive">{errors.end_time_in_hours}</p> : null}
                    </div>
                    <div>
                        <Label htmlFor="default_court_counts">Default courts</Label>
                        <Input id="default_court_counts" type="number" value={data.default_court_counts} onChange={(e: any) => onChange('default_court_counts', Number(e.target.value))} className="mt-1" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label htmlFor="default_match_duration_minutes">Match duration (min)</Label>
                        <Input id="default_match_duration_minutes" type="number" value={data.default_match_duration_minutes} onChange={(e: any) => onChange('default_match_duration_minutes', Number(e.target.value))} className="mt-1" />
                    </div>
                    <div>
                        <Label htmlFor="default_rest_time_minutes">Rest time (min)</Label>
                        <Input id="default_rest_time_minutes" type="number" value={data.default_rest_time_minutes} onChange={(e: any) => onChange('default_rest_time_minutes', Number(e.target.value))} className="mt-1" />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Checkbox id="allow_waitlist" checked={data.allow_waitlist} onCheckedChange={(checked) => onChange('allow_waitlist', checked === true)} />
                    {/* <input id="allow_waitlist" type="checkbox" checked={data.allow_waitlist} onChange={(e: any) => onChange('allow_waitlist', e.target.checked)} className="h-4 w-4" /> */}
                    <Label htmlFor="allow_waitlist">Allow waitlist</Label>
                </div>

                <div className="flex items-center gap-3">
                    <Checkbox id="is_dupr" checked={data.is_dupr} onCheckedChange={(checked) => onChange('is_dupr', checked === true)} />
                    {/* <input id="is_dupr" type="checkbox" checked={data.is_dupr} onChange={(e: any) => onChange('is_dupr', e.target.checked)} className="h-4 w-4" /> */}
                    <Label htmlFor="is_dupr">Use DUPR format</Label>
                </div>

                <div className="mt-4 rounded-xl border border-border/70 bg-background p-3">
                    <div className="text-sm font-semibold">Courts</div>
                    {courts.length === 0 ? (
                        <div className="mt-2 text-sm text-muted-foreground">No courts added yet.</div>
                    ) : (
                        <div className="mt-3 space-y-2">
                            {courts.map((court, index) => (
                                <div key={court + index} className="flex items-center justify-between rounded-md border bg-white px-3 py-2">
                                    <div>{court}</div>
                                    <Button variant="ghost" size="sm" onClick={() => removeCourt(index)}>Remove</Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-3 grid gap-2">
                        <div>
                            <Label htmlFor="new_court">Add court</Label>
                            <Input id="new_court" value={newCourt} onChange={(e: any) => setNewCourt(e.target.value)} className="mt-1" />
                        </div>
                        <Button type="button" onClick={addCourt}>Add court</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
