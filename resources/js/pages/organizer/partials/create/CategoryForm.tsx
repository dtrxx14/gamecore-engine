import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FormatStep = {
    id: number;
    round_format: string;
    competition_format: string;
    scoring_format: string;
    series_format: string;
    point_system: string;
    game_to: string;
    win_by: string;
    pool_count: string;
    advance_per_pool: string;
    allow_draw: boolean;
    allow_wildcard: boolean;
    allow_court_change: boolean;
    court_change_trigger: 'none' | 'rally_count' | 'score_count' | 'game_end' | 'match_end';
    court_change_interval: number | null;
};

export type CategoryFormPayload = {
    id: number;
    name: string;
    division: string;
    description?: string;
    entry_fee?: number | string;
    currency?: string;
    min_players?: number;
    max_players?: number;
    team_size?: number;
    team_type?: 'singles' | 'doubles' | 'team' | string;
    formats?: Array<{
        round_format: string;
        competition_format: string;
        scoring_format: string;
        series_format: string;
        point_system: string;
        game_to?: number;
        win_by?: number;
        pool_count?: number;
        advance_per_pool?: number;
        allow_draw?: boolean;
        allow_wildcard?: boolean;
        allow_court_change?: boolean;
        court_change_trigger?: 'none' | 'rally_count' | 'score_count' | 'game_end' | 'match_end';
        court_change_interval?: number | null;
    }>;
};

export default function CategoryForm({
    onAdd,
    initial,
    mode,
    onCancel,
}: {
    onCancel?: () => void;
    onAdd: (cat: any) => void;
    initial?: CategoryFormPayload | null;
    mode?: 'add' | 'edit';
}) {
    // Populate form when editing
    // (in add mode, initial is undefined)
    const [name, setName] = useState(initial?.name ?? '');
    const [division, setDivision] = useState(initial?.division ?? '');
    const [description, setDescription] = useState(
        initial?.description ?? 'This is a sample category description. You can edit this to provide more details about the category.'
    );
    const [entryFee, setEntryFee] = useState(String(initial?.entry_fee ?? '7200'));
    const [currency, setCurrency] = useState(initial?.currency ?? 'PHP');
    const [minPlayers, setMinPlayers] = useState(String(initial?.min_players ?? '24'));
    const [maxPlayers, setMaxPlayers] = useState(String(initial?.max_players ?? '96'));
    const [teamSize, setTeamSize] = useState(String(initial?.team_size ?? '6'));
    const [teamType, setTeamType] = useState<'singles' | 'doubles' | 'team'>(
        (initial?.team_type as any) ?? 'team'
    );

    const [formats, setFormats] = useState<FormatStep[]>(
        (initial?.formats && initial.formats.length > 0 ? initial.formats :
                [
                      {
                          round_format: 'round-16',
                          competition_format: 'round-robin',
                          scoring_format: 'sudden-death',
                          series_format: 'none',
                          point_system: 'standard-side-out',
                          game_to: 51,
                          win_by: 1,
                          pool_count: 4,
                          advance_per_pool: 1,
                          allow_draw: false,
                          allow_wildcard: false,
                          allow_court_change: true,
                          court_change_trigger: 'none',
                          court_change_interval: null,
                      },
                  ])
                .map((f) => ({
                    id: Date.now() + Math.floor(Math.random() * 1000000),
                    round_format: f.round_format,
                    competition_format: f.competition_format,
                    scoring_format: f.scoring_format,
                    series_format: f.series_format,
                    point_system: f.point_system ?? 'standard-side-out',
                    game_to: String(f.game_to ?? 51),
                    win_by: String(f.win_by ?? 1),
                    pool_count: String(f.pool_count ?? 4),
                    advance_per_pool: String(f.advance_per_pool ?? 1),
                    allow_draw: Boolean(f.allow_draw),
                    allow_wildcard: Boolean(f.allow_wildcard ?? false),
                    allow_court_change: Boolean(f.allow_court_change),
                    court_change_trigger: (f.court_change_trigger ?? 'none') as FormatStep['court_change_trigger'],
                    court_change_interval: f.court_change_interval ?? null,
                }))
    );

    useEffect(() => {
        if (!initial) {
            return;
        }


        setName(initial.name ?? '');
        setDivision(initial.division ?? '');
        setDescription(
            initial.description ??
                'This is a sample category description. You can edit this to provide more details about the category.'
        );
        setEntryFee(String(initial.entry_fee ?? '7200'));
        setCurrency(initial.currency ?? 'PHP');
        setMinPlayers(String(initial.min_players ?? '24'));
        setMaxPlayers(String(initial.max_players ?? '96'));
        setTeamSize(String(initial.team_size ?? '6'));
        setTeamType((initial.team_type as any) ?? 'team');
        setFormats(
            (initial.formats && initial.formats.length > 0
                ? initial.formats
                : [
                      {
                          round_format: 'round-16',
                          competition_format: 'round-robin',
                          scoring_format: 'sudden-death',
                          series_format: 'none',
                          point_system: 'standard-side-out',
                          game_to: 51,
                          win_by: 1,
                          pool_count: 4,
                          advance_per_pool: 1,
                          allow_draw: false,
                          allow_wildcard: false,
                          allow_court_change: true,
                          court_change_trigger: 'none',
                          court_change_interval: null,
                      },
                  ])
                .map((f) => ({
                    id: Date.now() + Math.floor(Math.random() * 1000000),
                    round_format: f.round_format,
                    competition_format: f.competition_format,
                    scoring_format: f.scoring_format,
                    series_format: f.series_format,
                    point_system: f.point_system ?? 'standard-side-out',
                    game_to: String(f.game_to ?? 51),
                    win_by: String(f.win_by ?? 1),
                    pool_count: String(f.pool_count ?? 4),
                    advance_per_pool: String(f.advance_per_pool ?? 1),
                    allow_draw: Boolean(f.allow_draw),
                    allow_wildcard: Boolean(f.allow_wildcard ?? false),
                    allow_court_change: Boolean(f.allow_court_change),
                    court_change_trigger: (f.court_change_trigger ?? 'none') as FormatStep['court_change_trigger'],
                    court_change_interval: f.court_change_interval ?? null,
                }))
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initial?.id]);

    const [errors, setErrors] = useState<Record<string, string>>({});


const addFormatStep = () => {
        setFormats((current) => [
            ...current,
            {
                id: Date.now(),
                round_format: 'round-16',
                competition_format: 'round-robin',
                scoring_format: 'sudden-death',
                series_format: 'none',
                point_system: 'standard-side-out',
                game_to: '51',
                win_by: '1',
                pool_count: '4',
                advance_per_pool: '1',
                allow_draw: false,
                allow_wildcard: false,
                allow_court_change: true,
                court_change_trigger: 'none',
                court_change_interval: null,
            },
        ]);
    };

    const removeFormatStep = (id: number) => {
        setFormats((current) => current.filter((format) => format.id !== id));
    };

    const setFormatField = (id: number, field: keyof FormatStep, value: string | boolean | number | null) => {
        setFormats((current) => current.map((format) => (format.id === id ? { ...format, [field]: value } : format)));
    };

    const submit = () => {
        const validationErrors: Record<string, string> = {};

        if (!name.trim()) {
            validationErrors.name = 'Category name is required.';
        }

        if (!division.trim()) {
            validationErrors.division = 'Division is required.';
        }

        if (!entryFee.trim()) {
            validationErrors.entryFee = 'Entry fee is required.';
        }

        if (formats.length === 0) {
            validationErrors.formats = 'Add at least one match format step.';
        }

        formats.forEach((format, index) => {
            if (!format.round_format.trim()) {
                validationErrors[`format_${format.id}_elimination`] = `Round format is required for step ${index + 1}.`;
            }
        });

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);

            return;
        }

        setErrors({});

        const newCat = {
            id: Date.now(),
            name,
            division,
            description,
            entry_fee: entryFee,
            currency,
            min_players: Number(minPlayers),
            max_players: Number(maxPlayers),
            team_size: Number(teamSize),
            team_type: teamType,
            formats: formats.map((format) => ({
                round_format: format.round_format,
                competition_format: format.competition_format,
                scoring_format: format.scoring_format,
                series_format: format.series_format,
                point_system: format.point_system,
                game_to: Number(format.game_to),
                win_by: Number(format.win_by),
                pool_count: Number(format.pool_count),
                advance_per_pool: Number(format.advance_per_pool),
                allow_draw: format.allow_draw,
                allow_wildcard: format.allow_wildcard,
                allow_court_change: format.allow_court_change,
                court_change_trigger: format.court_change_trigger,
                court_change_interval: format.court_change_interval,
            })),
        };

        onAdd(newCat);
        setName('');
        setDivision('');
        setDescription('This is a sample category description. You can edit this to provide more details about the category.');
        setEntryFee('7200');
        setCurrency('PHP');
        setMinPlayers('24');
        setMaxPlayers('96');
        setTeamSize('6');
        setTeamType('team');
setFormats([
            {
                id: Date.now(),
                round_format: 'round-16',
                competition_format: 'round-robin',
                scoring_format: 'sudden-death',
                series_format: 'none',
                point_system: 'standard-side-out',
                game_to: '51',
                win_by: '1',
                pool_count: '4',
                advance_per_pool: '1',
                allow_draw: false,
                allow_wildcard: false,
                allow_court_change: true,
                court_change_trigger: 'none',
                court_change_interval: null,
            },
        ]);
    };

    return (
        <div className="mt-3 grid gap-6">
            <div className="rounded-xl border border-border/70 bg-background p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-lg font-semibold">Category details</div>
                        <p className="text-sm text-muted-foreground">Enter the category information and add as many match format steps as needed.</p>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <Label htmlFor="cat_name">Category name</Label>
                        <Input id="cat_name" value={name ?? ''} onChange={(e) => setName(e.target.value)} className="mt-1" />
                        {errors.name ? <p className="mt-2 text-sm text-destructive">{errors.name}</p> : null}
                    </div>
                    <div>
                        <Label htmlFor="cat_division">Division</Label>
                        <Input id="cat_division" value={division} onChange={(e) => setDivision(e.target.value)} className="mt-1" />
                        {errors.division ? <p className="mt-2 text-sm text-destructive">{errors.division}</p> : null}
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="cat_description">Description</Label>
                        <textarea id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
                        {/* <Input id="cat_description" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" /> */}
                    </div>
                    <div>
                        <Label htmlFor="cat_fee">Entry fee</Label>
                        <Input id="cat_fee" type="number" step="0.01" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} className="mt-1" />
                        {errors.entryFee ? <p className="mt-2 text-sm text-destructive">{errors.entryFee}</p> : null}
                    </div>
                    <div>
                        <Label htmlFor="category_currency">Currency</Label>
                        <select id="category_currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2">
                            <option value="PHP">PHP</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                        </select>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 md:col-span-2">
                        <div>
                            <Label htmlFor="cat_min_players">Min players</Label>
                            <Input id="cat_min_players" type="number" value={minPlayers} onChange={(e) => setMinPlayers(e.target.value)} className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="cat_max_players">Max players</Label>
                            <Input id="cat_max_players" type="number" value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)} className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="cat_team_size">Team size</Label>
                            <Input id="cat_team_size" type="number" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="cat_team_type">Team type</Label>
                            <select id="cat_team_type" value={teamType} onChange={(e) => setTeamType(e.target.value as any)} className="mt-1 w-full rounded-md border px-3 py-2">
                                <option value="singles">Singles</option>
                                <option value="doubles">Doubles</option>
                                <option value="team">Team</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-background p-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold">Match format</div>
                        <p className="text-sm text-muted-foreground">Add one or more round format for this category.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addFormatStep}>Add format</Button>
                </div>

                {formats.map((format, index) => (
                    <div key={format.id} className="mt-4 rounded-xl border border-border/70 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="font-semibold">Category format {index + 1}</div>
                            {formats.length > 1 ? (
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeFormatStep(format.id)}>
                                    Remove
                                </Button>
                            ) : null}
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 mt-3">
                            <div>
                                <Label htmlFor={`round_format_${format.id}`}>Round format</Label>
                                <select
                                    id={`round_format_${format.id}`}
                                    value={format.round_format}
                                    onChange={(e) => setFormatField(format.id, 'round_format', e.target.value)}
                                    className="mt-1 w-full rounded-md border px-3 py-2"
                                >
                                    <option value="preliminary">Preliminary</option>
                                    <option value="round-128">Round 128</option>
                                    <option value="round-64">Round 64</option>
                                    <option value="round-32">Round 32</option>
                                    <option value="round-16">Round 16</option>
                                    <option value="round-8">Round 8</option>
                                    <option value="quarter-finals">Quarter-finals</option>
                                    <option value="semi-finals">Semi-finals</option>
                                    <option value="battle-for-third">Battle for Third</option>
                                    <option value="finals">Finals</option>
                                </select>
                                {errors[`format_${format.id}_elimination`] ? <p className="mt-2 text-sm text-destructive">{errors[`format_${format.id}_elimination`]}</p> : null}
                            </div>
                            <div>
                                <Label htmlFor={`competition_format_${format.id}`}>Competition format</Label>
                                <select
                                    id={`competition_format_${format.id}`}
                                    value={format.competition_format}
                                    onChange={(e) => setFormatField(format.id, 'competition_format', e.target.value)}
                                    className="mt-1 w-full rounded-md border px-3 py-2"
                                >
                                    <option value="round-robin">Round Robin</option>
                                    <option value="single-elimination">Single Elimination</option>
                                    <option value="double-elimination">Double Elimination</option>
                                    <option value="swiss-system">Swiss System</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3 md:col-span-2">
                                <div>
                                    <Label htmlFor={`match_format_${format.id}`}>Match format</Label>
                                    <select
                                        id={`match_format_${format.id}`}
                                        value={format.scoring_format}
                                        onChange={(e) => setFormatField(format.id, 'scoring_format', e.target.value)}
                                        className="mt-1 w-full rounded-md border px-3 py-2"
                                    >
                                        <option value="sudden-death">Sudden Death</option>
                                        <option value="deuce">Deuce</option>
                                        <option value="score-by-serve">Score by Serve</option>
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor={`series_format_${format.id}`}>Series format</Label>
                                    <select
                                        id={`series_format_${format.id}`}
                                        value={format.series_format}
                                        onChange={(e) => setFormatField(format.id, 'series_format', e.target.value)}
                                        className="mt-1 w-full rounded-md border px-3 py-2"
                                    >
                                    <option value="none">None</option>
                                        <option value="best-of-3">Best of 3</option>
                                        <option value="best-of-5">Best of 5</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 md:col-span-2">
                                <div>
                                    <Label htmlFor={`point_system_${format.id}`}>Point system</Label>
                                    <select
                                        id={`point_system_${format.id}`}
                                        value={format.point_system}
                                        onChange={(e) => setFormatField(format.id, 'point_system', e.target.value)}
                                        className="mt-1 w-full rounded-md border px-3 py-2"
                                    >
                                        <option value="standard-side-out">Standard Side Out</option>
                                        <option value="rally-point">Rally Point</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3 md:col-span-2">
                                <div>
                                    <Label htmlFor={`game_to_${format.id}`}>Game to</Label>
                                    <Input
                                        id={`game_to_${format.id}`}
                                        type="number"
                                        value={format.game_to}
                                        onChange={(e) => setFormatField(format.id, 'game_to', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor={`win_by_${format.id}`}>Win by</Label>
                                    <Input
                                        id={`win_by_${format.id}`}
                                        type="number"
                                        value={format.win_by}
                                        onChange={(e) => setFormatField(format.id, 'win_by', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor={`pool_count_${format.id}`}>Pools</Label>
                                    <Input
                                        id={`pool_count_${format.id}`}
                                        type="number"
                                        value={format.pool_count}
                                        onChange={(e) => setFormatField(format.id, 'pool_count', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 md:col-span-2 items-center">
                                <div>
                                    <Label htmlFor={`advance_per_pool_${format.id}`}>Advance per pool</Label>
                                    <Input
                                        id={`advance_per_pool_${format.id}`}
                                        type="number"
                                        value={format.advance_per_pool}
                                        onChange={(e) => setFormatField(format.id, 'advance_per_pool', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div className="flex items-center gap-2 mt-5">
                                    <Checkbox id={`allow_draw_${format.id}`} checked={format.allow_draw} onCheckedChange={(checked) => setFormatField(format.id, 'allow_draw', checked === true)} />
                                    <Label htmlFor={`allow_draw_${format.id}`}>Allow draw?</Label>
                                </div>
                                <div className="flex items-center gap-2 mt-5">
                                    <Checkbox id={`allow_wildcard_${format.id}`} checked={format.allow_wildcard} onCheckedChange={(checked) => setFormatField(format.id, 'allow_wildcard', checked === true)} />
                                    <Label htmlFor={`allow_wildcard_${format.id}`}>Allow wildcard?</Label>
                                </div>
                            </div>
                            <div className="flex w-full flex-col gap-3 md:col-span-2">
                                <div className="flex items-center gap-2 mt-5">
                                    <Checkbox id={`allow_court_change_${format.id}`} checked={format.allow_court_change} onCheckedChange={(checked) => setFormatField(format.id, 'allow_court_change', checked === true)} />
                                    <Label htmlFor={`allow_court_change_${format.id}`}>Allow change court?</Label>
                                </div>
                                
                            </div>
                            <div className="grid grid-cols-1 gap-3 md:col-span-1 items-center">
                                <div>
                                    <Label htmlFor={`court_change_trigger_${format.id}`}>Change court rule</Label>
                                    <select
                                        id={`court_change_trigger_${format.id}`}
                                        value={format.court_change_trigger}
                                        onChange={(e) => setFormatField(format.id, 'court_change_trigger', e.target.value)}
                                        className={`${!format.allow_court_change ? 'bg-gray-100 cursor-not-allowed' : ''} mt-1 w-full rounded-md border px-3 py-2`}
                                        disabled={!format.allow_court_change}
                                    >
                                        <option value="none">None</option>
                                        <option value="rally_count">Rally Count</option>
                                        <option value="score_count">Score Count</option>
                                        <option value="game_end">Game End</option>
                                        <option value="match_end">Match End</option>
                                    </select>
                                    {errors[`format_${format.id}_court_change_trigger`] ? <p className="mt-2 text-sm text-destructive">{errors[`format_${format.id}_court_change_trigger`]}</p> : null}
                                </div>
                                <div>
                                    <Label htmlFor={`court_change_interval_${format.id}`}>
                                        Change court every
                                    </Label>

                                    <Input
                                        id={`court_change_interval_${format.id}`}
                                        type="number"
                                        min={1}
                                        value={['rally_count', 'score_count'].includes(format.court_change_trigger) ? (format.court_change_interval ?? '') : ''}
                                        onChange={(e) => {
                                            const next = e.target.value === '' ? null : parseInt(e.target.value, 10);
                                            setFormatField(format.id, 'court_change_interval', next);
                                        }}
                                        disabled={!format.allow_court_change || ['none', 'game_end', 'match_end'].includes(format.court_change_trigger)}
                                        placeholder={format.court_change_trigger === 'rally_count' ? 'e.g. 6 rallies' : format.court_change_trigger === 'score_count' ? 'e.g. 11 points' : ''}
                                        className={`mt-1 ${!format.allow_court_change || ['none', 'game_end', 'match_end'].includes(format.court_change_trigger) ? 'cursor-not-allowed bg-gray-100' : ''}`}
                                    />

                                    {errors[`format_${format.id}_court_change_interval`] && (
                                        <p className="mt-2 text-sm text-destructive">
                                            {errors[`format_${format.id}_court_change_interval`]}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {errors.formats ? <p className="mt-3 text-sm text-destructive">{errors.formats}</p> : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-end">
                {errors.formats ? <p className="text-sm text-destructive">{errors.formats}</p> : null}
                {mode === 'edit' && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            onCancel?.();
                        }}
                    >
                        Cancel
                    </Button>
                )}
                <Button type="button" onClick={submit}>{mode === 'edit' ? 'Update' : 'Add category'}</Button>
            </div>
        </div>
    );
}
