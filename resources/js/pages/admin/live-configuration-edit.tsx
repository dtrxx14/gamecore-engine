import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    ArrowLeft,
    GripVertical,
    LayoutGrid,
    Monitor,
    Save,
    Settings2,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Status {
    id: number;
    name: string;
    slug: string;
}

interface LiveConfigurationData {
    id: number;
    name: string;
    number_of_courts: number;
    scoring_system: string;
    allow_court_change: boolean;
    court_change_trigger: string;
    court_change_interval: number | null;
    status_id: number;
    status: Status;
}

interface Props {
    configuration: LiveConfigurationData;
    statuses: Status[];
}

export default function LiveConfigurationEdit({ configuration, statuses }: Props) {
    const [form, setForm] = useState({
        name: configuration.name ?? '',
        number_of_courts: String(configuration.number_of_courts ?? '1'),
        scoring_system: configuration.scoring_system ?? 'side-out',
        allow_court_change: configuration.allow_court_change ?? false,
        court_change_trigger: configuration.court_change_trigger ?? 'none',
        court_change_interval: configuration.court_change_interval ? String(configuration.court_change_interval) : '',
        status_id: String(configuration.status_id ?? ''),
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleField = (field: string, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors: Record<string, string> = {};

        if (!form.name.trim()) {
            validationErrors.name = 'Match name is required.';
        }
        if (!form.number_of_courts || Number(form.number_of_courts) < 1) {
            validationErrors.number_of_courts = 'At least 1 court is required.';
        }
        if (!form.status_id) {
            validationErrors.status_id = 'Status is required.';
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setProcessing(true);

        router.put(
            `/admin/live-configuration/${configuration.id}`,
            {
                ...form,
                number_of_courts: Number(form.number_of_courts),
                court_change_interval: form.court_change_interval ? Number(form.court_change_interval) : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setProcessing(false);
                },
                onError: (errs) => {
                    setErrors(errs as Record<string, string>);
                    setProcessing(false);
                },
            }
        );
    };

    return (
        <>
            <Head title="Edit Match Configuration" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                {/* Back button */}
                <Link
                    href="/admin/live-configuration"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to live configurations
                </Link>

                {/* Page header */}
                <div className="rounded-xl border border-border/70 bg-gradient-to-br from-background via-card to-indigo-500/15 p-6 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.35)]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-400 shadow-md">
                            <Settings2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                                Edit match configuration
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Update the configuration for <span className="font-medium text-foreground">{configuration.name}</span>.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Match details section */}
                    <div className="rounded-xl border border-border/70 bg-card p-6 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.35)]">
                        <div className="mb-5 flex items-center gap-2">
                            <Settings2 className="h-5 w-5 text-indigo-500" />
                            <h2 className="text-lg font-semibold text-foreground">Match details</h2>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            {/* Name */}
                            <div className="md:col-span-2">
                                <Label htmlFor="name" className="text-sm font-medium">
                                    Match name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={form.name}
                                    onChange={(e) => handleField('name', e.target.value)}
                                    placeholder="e.g. Men's Doubles Finals"
                                    className="mt-1.5"
                                />
                                {errors.name && (
                                    <p className="mt-1.5 text-sm text-destructive">{errors.name}</p>
                                )}
                            </div>

                            {/* Number of courts */}
                            <div>
                                <Label htmlFor="number_of_courts" className="text-sm font-medium">
                                    Number of courts <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative mt-1.5">
                                    <LayoutGrid className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="number_of_courts"
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={form.number_of_courts}
                                        onChange={(e) => handleField('number_of_courts', e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                {errors.number_of_courts && (
                                    <p className="mt-1.5 text-sm text-destructive">{errors.number_of_courts}</p>
                                )}
                            </div>

                            {/* Scoring system */}
                            <div>
                                <Label htmlFor="scoring_system" className="text-sm font-medium">
                                    Scoring system
                                </Label>
                                <div className="relative mt-1.5">
                                    <Monitor className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <select
                                        id="scoring_system"
                                        value={form.scoring_system}
                                        onChange={(e) => handleField('scoring_system', e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-9 py-2 text-sm shadow-none outline-none transition-colors focus-visible:border-primary/50"
                                    >
                                        <option value="side-out">Side Out</option>
                                        <option value="rally-point">Rally Point</option>
                                    </select>
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <Label htmlFor="status_id" className="text-sm font-medium">
                                    Status <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative mt-1.5">
                                    <Activity className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <select
                                        id="status_id"
                                        value={form.status_id}
                                        onChange={(e) => handleField('status_id', e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-9 py-2 text-sm shadow-none outline-none transition-colors focus-visible:border-primary/50"
                                    >
                                        <option value="">Select status</option>
                                        {statuses.map((status) => (
                                            <option key={status.id} value={status.id}>
                                                {status.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {errors.status_id && (
                                    <p className="mt-1.5 text-sm text-destructive">{errors.status_id}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Court change section */}
                    <div className="rounded-xl border border-border/70 bg-card p-6 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.35)]">
                        <div className="mb-5 flex items-center gap-2">
                            <GripVertical className="h-5 w-5 text-indigo-500" />
                            <h2 className="text-lg font-semibold text-foreground">Court change rules</h2>
                        </div>

                        <div className="space-y-5">
                            {/* Allow court change checkbox */}
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="allow_court_change"
                                    checked={form.allow_court_change}
                                    onCheckedChange={(checked) => handleField('allow_court_change', checked === true)}
                                />
                                <Label htmlFor="allow_court_change" className="text-sm font-medium cursor-pointer">
                                    Allow court change during match
                                </Label>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                {/* Court change trigger */}
                                <div>
                                    <Label htmlFor="court_change_trigger" className="text-sm font-medium">
                                        Change court trigger
                                    </Label>
                                    <select
                                        id="court_change_trigger"
                                        value={form.court_change_trigger}
                                        onChange={(e) => handleField('court_change_trigger', e.target.value)}
                                        disabled={!form.allow_court_change}
                                        className={`mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-none outline-none transition-colors focus-visible:border-primary/50 ${
                                            !form.allow_court_change ? 'cursor-not-allowed opacity-50' : ''
                                        }`}
                                    >
                                        <option value="none">None</option>
                                        <option value="rally-count">Rally Count</option>
                                        <option value="score-count">Score Count</option>
                                        <option value="game-end">Game End</option>
                                        <option value="match-end">Match End</option>
                                    </select>
                                </div>

                                {/* Court change interval */}
                                <div>
                                    <Label htmlFor="court_change_interval" className="text-sm font-medium">
                                        Change interval
                                    </Label>
                                    <Input
                                        id="court_change_interval"
                                        type="number"
                                        min={1}
                                        max={255}
                                        value={
                                            ['rally-count', 'score-count'].includes(form.court_change_trigger)
                                                ? form.court_change_interval
                                                : ''
                                        }
                                        onChange={(e) =>
                                            handleField(
                                                'court_change_interval',
                                                e.target.value === '' ? '' : Number(e.target.value)
                                            )
                                        }
                                        disabled={
                                            !form.allow_court_change ||
                                            ['none', 'game-end', 'match-end'].includes(form.court_change_trigger)
                                        }
                                        placeholder={
                                            form.court_change_trigger === 'rally-count'
                                                ? 'e.g. 6 rallies'
                                                : form.court_change_trigger === 'score-count'
                                                ? 'e.g. 11 points'
                                                : ''
                                        }
                                        className={`mt-1.5 ${
                                            !form.allow_court_change ||
                                            ['none', 'game-end', 'match-end'].includes(form.court_change_trigger)
                                                ? 'cursor-not-allowed opacity-50'
                                                : ''
                                        }`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form actions */}
                    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-4 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.35)]">
                        <Link href="/admin/live-configuration">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="inline-flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            {processing ? 'Saving...' : 'Update configuration'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

LiveConfigurationEdit.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Live Configuration',
            href: '/admin/live-configuration',
        },
        {
            title: 'Edit Match',
            href: '#',
        },
    ],
};

