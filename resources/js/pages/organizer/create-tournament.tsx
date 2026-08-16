import { Form, Head, useForm, router } from '@inertiajs/react';
import {
    Trophy,
    Users,
    Coins,
    Swords,
    Target,
    Medal,
    Layers3,
    Flag,
} from "lucide-react";
import type { ChangeEvent, FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CategoryForm from '@/pages/organizer/partials/create/CategoryForm';
import CategoryList from '@/pages/organizer/partials/create/CategoryList';
import TournamentSettings from '@/pages/organizer/partials/create/TournamentSettings';
import VenueForm from '@/pages/organizer/partials/create/VenueForm';
import { store } from '@/routes/organizer/tournaments';



type StepErrorMap = Record<string, string>;

type CategoryDraft = {
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

export default function CreateTournament({

    organization,
    role,
    }: {
        organization: any;
        role: any;
    }) {

    const { data, setData, post, processing, reset } = useForm({
        title: 'Court Wars 2026',
        start_date: '2026-01-25',
        description: 'This is a sample tournament description. You can edit this to provide more details about the tournament.',
        banner_image: null as File | null,
        venue_name: 'The Dink Zone',
        venue_address: 'Santa Maria - Tungkong Mangga Rd, SJDM, 3023 Bulacan',
        venue_pin_location: '14.79223504411842, 121.06237495339475',
        allow_waitlist: false,
        call_time_in_hours: '8:00',
        start_time_in_hours: '9:00',
        end_time_in_hours: '22:00',
        default_match_duration_minutes: 30,
        default_rest_time_minutes: 5,
        default_court_counts: 6,
        is_dupr: false,
        status_id: 11,
        // NOTE: backend expects `categories` and `courts`, but we manage them separately in step state.
        categories: [] as CategoryDraft[],
        courts: [] as string[],
    });

    const [categories, setCategories] = useState<CategoryDraft[]>([]);
    const [courts, setCourts] = useState<string[]>(['Court 1', 'Court 2', 'Court 3', 'Court 4', 'Court 5', 'Court 6']);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [step, setStep] = useState(1);
    const [stepErrors, setStepErrors] = useState<StepErrorMap>({});
    const [confirmSubmit, setConfirmSubmit] = useState(false);

    const steps = [
        { id: 1, label: 'Tournament Info' },
        { id: 2, label: 'Settings & Venue' },
        { id: 3, label: 'Categories' },
        { id: 4, label: 'Review' },
    ];

    const validationRules = useMemo(
        () => ({
            1: [
                { field: 'title', label: 'Title' },
                { field: 'start_date', label: 'Start date' },
                { field: 'description', label: 'Description' },
            ],
            2: [
                { field: 'venue_name', label: 'Venue name' },
                { field: 'venue_address', label: 'Venue address' },
                { field: 'venue_pin_location', label: 'Pin location' },
                { field: 'call_time_in_hours', label: 'Call time' },
                { field: 'start_time_in_hours', label: 'Start time' },
                { field: 'end_time_in_hours', label: 'End time' },
            ],
        }),
        [],
    );

    const createCourtNames = (count: number) => {
        const total = Math.max(1, Number(count) || 1);

        return Array.from({ length: total }, (_, index) => `Court ${index + 1}`);
    };

    const handleBannerChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        setData('banner_image', file);

        if (file) {
            setBannerPreview(URL.createObjectURL(file));
        } else {
            setBannerPreview(null);
        }
    };

    const handleFieldChange = (field: string, value: any) => {
        // Default courts drives `courts` list for the backend.
        if (field === 'default_court_counts') {
            const courtCount = Math.max(1, Number(value) || 1);
            const newCourts = createCourtNames(courtCount);

            setData('default_court_counts', courtCount);
            setData('courts', newCourts);
            setCourts(newCourts);

            return;
        }

        setData(field as any, value);
        setStepErrors((errors) => ({ ...errors, [field]: '' }));
    };

    const addCategory = (cat: CategoryDraft) => {
        setCategories((c) => [cat, ...c]);
        setStepErrors((errors) => ({ ...errors, categories: '' }));
    };

    const removeCategory = (id: number) => {
        setCategories((c) => c.filter((x) => x.id !== id));
    };

    const validateStep = (stepNumber: number) => {
        const errors: StepErrorMap = {};

        if (stepNumber === 1 || stepNumber === 2) {
            validationRules[stepNumber].forEach(({ field, label }) => {
                const v = (data as any)[field];

                if (v === null || v === undefined || String(v).trim() === '') {
                    errors[field] = `${label} is required.`;
                }
            });
        }

        if (stepNumber === 3 && categories.length === 0) {
            errors.categories = 'Add at least one category before continuing.';
        }

        setStepErrors(errors);

        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (!validateStep(step)) {
            return;
        }

        setStep((current) => Math.min(current + 1, 4));
    };

    const handleBack = () => {
        setStep((current) => Math.max(current - 1, 1));
    };

    const getGoogleMapEmbedUrl = () => {
        const raw = data.venue_pin_location ?? '';
        const [lat, lng] = raw.split(',').map((value) => value.trim());

        if (!lat || !lng) {
            return null;
        }

        return `https://www.google.com/maps?q=${encodeURIComponent(lat)},${encodeURIComponent(lng)}&output=embed`;
    };

    const mapEmbedUrl = getGoogleMapEmbedUrl();

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (step < 4) {
            handleNext();

            return;
        }

        if (!confirmSubmit) {
            setStepErrors((prev) => ({
                ...prev,
                confirmation:
                    'Please confirm the tournament details before submitting.',
            }));

            return;
        }

        router.post(
            store.url(),
            {
                ...data,

                // Pass the selected organization UUID from the org dashboard.
                // The dashboard page will add this query prop; fallback: undefined.
                organization_uuid: (data as any).organization_uuid,

                courts,

                categories: categories.map((cat) => ({
                    name: cat.name,
                    division: cat.division,
                    description: cat.description,
                    entry_fee: cat.entry_fee,
                    currency: cat.currency ?? 'PHP',
                    min_players: cat.min_players,
                    max_players: cat.max_players,
                    team_size: cat.team_size,
                    team_type: cat.team_type,

                    formats: (cat.formats ?? []).map((format) => ({
                        round_format: format.round_format,
                        competition_format: format.competition_format,
                        scoring_format: format.scoring_format,
                        series_format: format.series_format,
                        point_system: format.point_system ?? 'standard-side-out',
                        game_to: format.game_to,
                        win_by: format.win_by,
                        pool_count: format.pool_count,
                        advance_per_pool: format.advance_per_pool,
                        allow_draw: format.allow_draw ?? false,
                        allow_wildcard: format.allow_wildcard ?? false,
                        allow_court_change: format.allow_court_change ?? false,
                        court_change_trigger: format.court_change_trigger ?? 'none',
                        court_change_interval:
                            format.court_change_interval === undefined
                                ? null
                                : format.court_change_interval,
                    })),
                })),
            },
            {
                forceFormData: true,
                preserveScroll: true,
                preserveState: true,

                onSuccess: () => {
                    setConfirmSubmit(false);
                    setStepErrors({});

                    reset();

                    setCategories([]);

                    const newCourts = createCourtNames(6);
                    setCourts(newCourts);

                    setBannerPreview(null);

                    setStep(1);
                },

                onError: (errors) => {
                    setStepErrors((prev) => ({
                        ...prev,
                        ...Object.fromEntries(
                            Object.entries(errors).map(([k, v]) => [
                                k,
                                String(v),
                            ]),
                        ),
                    }));
                },
            }
        );
    };

    const renderCategoriesReview = () => {
        if (categories.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center">
                    <Trophy className="mb-4 h-10 w-10 text-muted-foreground/40" />
                    <p className="font-medium">No categories added</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Categories will appear here once you've created them.
                    </p>
                </div>
            );
        }

        return (
            <div className="mt-6 space-y-6">
                {categories.map((category) => (
                    <div
                        key={category.id}
                        className="overflow-hidden transition-all"
                    >
                        {/* Header */}
                        <div className="rounded-lg border border-border/70 bg-gradient-to-br from-background via-card to-primary/25 p-5 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.35)]">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-xl font-bold tracking-tight">
                                        {category.name}
                                    </h3>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {category.division}
                                    </p>
                                </div>

                                <Badge
                                    variant="secondary"
                                    className="rounded-full px-4 py-1"
                                >
                                    {category.team_type}
                                </Badge>
                            </div>
                            {/* Summary */}
                            <div className="grid gap-4 md:grid-cols-2">

                                <div className="flex items-start gap-3 rounded-xl bg-muted/40 border shadow-md p-4">
                                    <Coins className="mt-0.5 h-5 w-5 text-primary" />

                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                            Entry Fee
                                        </p>

                                        <p className="mt-1 text-lg font-semibold">
                                            {category.currency} {category.entry_fee}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 rounded-xl bg-muted/40 border shadow-md p-4">
                                    <Users className="mt-0.5 h-5 w-5 text-primary" />

                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                            Players
                                        </p>

                                        <p className="mt-1 text-lg font-semibold">
                                            {category.min_players} - {category.max_players}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Formats */}
                        <div className="p-6">

                            <div className="mb-5 flex items-center gap-2">
                                <Swords className="h-5 w-5 text-primary" />

                                <h4 className="font-semibold">
                                    Match Formats
                                </h4>
                            </div>

                            {Array.isArray(category.formats) &&
                            category.formats.length > 0 ? (

                                <div className="space-y-5">

                                    {category.formats.map((format, index) => (

                                        <div
                                            key={index}
                                            className="rounded-2xl border bg-background p-5 hover:shadow-md"
                                        >

                                            <div className="mb-5 flex items-center justify-between">

                                                <div className="font-semibold">
                                                    Format {index + 1}
                                                </div>

                                                <Badge variant="outline">
                                                    {format.scoring_format}
                                                </Badge>

                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Layers3 className="h-4 w-4" />
                                                        <span className="text-xs uppercase">
                                                            Round
                                                        </span>
                                                    </div>

                                                    <div className="font-medium">
                                                        {format.round_format}
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Medal className="h-4 w-4" />
                                                        <span className="text-xs uppercase">
                                                            Competition
                                                        </span>
                                                    </div>

                                                    <div className="font-medium">
                                                        {format.competition_format}
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Target className="h-4 w-4" />
                                                        <span className="text-xs uppercase">
                                                            Series
                                                        </span>
                                                    </div>

                                                    <div className="font-medium">
                                                        {format.series_format}
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Flag className="h-4 w-4" />
                                                        <span className="text-xs uppercase">
                                                            Score
                                                        </span>
                                                    </div>

                                                    <div className="font-medium">
                                                        {format.game_to} • Win by {format.win_by}
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Flag className="h-4 w-4" />
                                                        <span className="text-xs uppercase">
                                                            Point System
                                                        </span>
                                                    </div>

                                                    <div className="font-medium">
                                                        {format.point_system}
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="text-xs uppercase text-muted-foreground">
                                                        Brackets
                                                    </div>

                                                    <div className="font-medium">
                                                        {format.pool_count}
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="text-xs uppercase text-muted-foreground">
                                                        Advance
                                                    </div>

                                                    <div className="font-medium">
                                                        {format.advance_per_pool}
                                                    </div>
                                                </div>

                                            </div>

                                            <div className="mt-5 flex flex-wrap gap-2">

                                                <Badge
                                                    variant={
                                                        format.allow_draw
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                >
                                                    {format.allow_draw
                                                        ? "Draw Allowed"
                                                        : "No Draw"}
                                                </Badge>

                                                <Badge
                                                    variant={
                                                        format.allow_wildcard
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                >
                                                    {format.allow_wildcard
                                                        ? "Wildcard Allowed"
                                                        : "No Wildcard"}
                                                </Badge>

                                            </div>

                                        </div>

                                    ))}

                                </div>

                            ) : (

                                <div className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                                    No match formats defined.
                                </div>

                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            <Head title="Create tournament" />

            <div className="space-y-6">
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <h2 className="text-lg font-semibold">Create tournament</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Build your tournament in 4 steps. Fill the required fields in each step, then review everything before submitting.
                    </p>
                    <div className="mt-4 rounded-lg border border-border/70 bg-background p-4 text-sm">
                        <div className="font-semibold">Helpful checklist</div>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                            <li>Choose a valid <span className="text-foreground">Start date</span>.</li>
                            <li>Add at least one <span className="text-foreground">Category</span> with match formats.</li>
                            <li>Set <span className="text-foreground">Courts</span> (auto-generated from Default courts).</li>
                            <li>Confirm on the <span className="text-foreground">Review</span> step to submit.</li>
                        </ul>
                    </div>

                    <div className="mt-6 grid gap-2 sm:grid-cols-4">
                        {steps.map((item) => (
                            <div
                                key={item.id}
                                className={`rounded-lg border px-3 py-2 text-left transition ${
                                    step === item.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground'
                                }`}
                            >
                                <div className="text-xs uppercase tracking-[0.24em]">Step {item.id}</div>
                                <div className="font-semibold">{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
                    {/* Notes: Step navigation is local-only. Backend validation errors are shown on Step 4. */}
                    {step === 1 && (
                        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">

                            <div className="grid gap-6">
                                <div>
                                    <Label htmlFor="banner_image">Banner image</Label>
                                    <input
                                        id="banner_image"
                                        name="banner_image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleBannerChange}
                                        className="mt-1 block w-full rounded-md border px-3 py-2"
                                    />
                                </div>

                                <div className="">
                                    <div className="text-sm font-semibold">Banner preview</div>
                                    {bannerPreview ? (
                                        <img src={bannerPreview} alt="Tournament banner preview" className="mt-3 h-48 w-full rounded-md object-cover" />
                                    ) : (
                                        <div className="mt-3 rounded-md border border-2 border-dashed border-border/70 bg-primary-400 p-8 text-center text-sm text-muted-foreground">
                                            Upload an image to preview the tournament banner.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="hidden">
                                    <Input id="organization_uuid" name="organization_uuid" value={organization?.uuid} onChange={(e) => handleFieldChange('organization_uuid', e.target.value)} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="title">Title</Label>
                                    <Input id="title" name="title" value={data.title} onChange={(e) => handleFieldChange('title', e.target.value)} className="mt-1" />
                                    {stepErrors.title ? <p className="mt-2 text-sm text-destructive">{stepErrors.title}</p> : null}
                                </div>
                                <div>
                                    <Label htmlFor="start_date">Start date</Label>
                                    <Input id="start_date" name="start_date" type="date" value={data.start_date} onChange={(e) => handleFieldChange('start_date', e.target.value)} className="mt-1" />
                                    {stepErrors.start_date ? <p className="mt-2 text-sm text-destructive">{stepErrors.start_date}</p> : null}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <textarea id="description" name="description" value={data.description} onChange={(e) => handleFieldChange('description', e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
                                {stepErrors.description ? <p className="mt-2 text-sm text-destructive">{stepErrors.description}</p> : null}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="rounded-xl border bg-card p-6 shadow-sm">
                                <TournamentSettings data={data} errors={stepErrors} onChange={handleFieldChange} courts={courts} setCourts={setCourts} />
                            </div>
                            <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
                                <VenueForm data={data} errors={stepErrors} onChange={handleFieldChange} />
                                <div className="rounded-xl border border-border/70 bg-background p-4">
                                    <div className="text-sm font-semibold">Map preview</div>
                                    {mapEmbedUrl ? (
                                        <div className="mt-3 aspect-[16/9] overflow-hidden rounded-md border">
                                            <iframe title="Venue location" src={mapEmbedUrl} className="h-full w-full border-0" loading="lazy" />
                                        </div>
                                    ) : (
                                        <div className="mt-3 rounded-md border border-dashed border-border/70 bg-muted p-8 text-center text-sm text-muted-foreground">
                                            Enter a pin location as latitude,longitude to preview the map.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold">Categories</h3>
                                <p className="text-sm text-muted-foreground">Add one or more categories. Each category includes a connected match format.</p>
                                {stepErrors.categories ? <p className="text-sm text-destructive">{stepErrors.categories}</p> : null}
                            </div>

                            <CategoryForm onAdd={addCategory} />

                            <div className="rounded-xl border border-border/70 bg-background p-4">
                                <CategoryList categories={categories} onAdd={addCategory} onRemove={removeCategory} onUpdate={(updatedCat) => {
                                    setCategories((current) => current.map((c) => (c.id === updatedCat.id ? updatedCat : c)));
                                }} />
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold">Review tournament details</h3>
                                <p className="text-sm text-muted-foreground">Check everything before creating the tournament.</p>
                            </div>

                            <div className="grid gap-6 lg:grid-cols-5">
                                <div className="rounded-xl border border-border/70 bg-background p-4 space-y-4 lg:col-span-3">
                                    <div>
                                        <div className="mb-3 text-sm font-semibold">Tournament Info</div>
                                        <div className="text-xs">Tournament Title</div>
                                        <div className="mb-2 text-base font-semibold">{data.title}</div>
                                        <div className="text-xs">Tournament Date</div>
                                        <div className="mb-2 text-base font-semibold">{data.start_date}</div>
                                        <div className="text-xs">Tournament Description</div>
                                        <div className="mb-2 text-base font-semibold">{data.description}</div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-border/70 bg-background p-4 space-y-4 lg:col-span-2">
                                    <div>
                                        <div className="mb-3 text-sm font-semibold">Settings</div>
                                        <div className="grid gap-2 lg:grid-cols-2">
                                            <div className="lg:col-span-1">
                                                <div className="text-sm">Call time</div>
                                                <div className="mb-2 text-base font-semibold">{data.call_time_in_hours}</div>
                                            </div>

                                            <div className="lg:col-span-1">
                                                <div className="text-sm">Start time</div>
                                                <div className="mb-2 text-base font-semibold">{data.start_time_in_hours}</div>
                                            </div>
                                        </div>

                                        <div className="grid gap-2 lg:grid-cols-2">
                                            <div className="lg:col-span-1">
                                                <div className="text-sm">End time</div>
                                                <div className="mb-2 text-base font-semibold">{data.end_time_in_hours}</div>
                                            </div>

                                            <div className="lg:col-span-1">
                                                <div className="text-sm">Match duration</div>
                                                <div className="mb-2 text-base font-semibold">{data.default_match_duration_minutes} min</div>
                                            </div>
                                        </div>
                                        
                                        <div className="grid gap-2 lg:grid-cols-2">
                                            <div className="lg:col-span-1">
                                                <div className="text-sm">Rest time</div>
                                                <div className="mb-2 text-base font-semibold">{data.default_rest_time_minutes} min</div>
                                            </div>

                                            <div className="lg:col-span-1">
                                                <div className="text-sm">Courts</div>
                                                <div className="mb-2 text-base font-semibold">{courts.length}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="grid gap-2 lg:grid-cols-2">
                                            <div className="lg:col-span-1">
                                                <div className="text-sm">Allow waitlist</div>
                                                <div className="mb-2 text-base font-semibold">{data.allow_waitlist ? 'Yes' : 'No'}</div>
                                            </div>

                                            <div className="lg:col-span-1">
                                                <div className="text-sm">DUPR</div>
                                                <div className="mb-2 text-base font-semibold">{data.is_dupr ? 'Yes' : 'No'}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-3 text-sm font-semibold">Venue</div>
                                        <div className="mb-1 text-base font-semibold">{data.venue_name}</div>
                                        <div className="text-sm text-muted-foreground">{data.venue_address || 'No venue address'}</div>
                                        { mapEmbedUrl && (
                                            <div className="mt-3 aspect-[16/9] overflow-hidden rounded-md border">
                                                <iframe title="Venue location" src={mapEmbedUrl} className="h-full w-full border-0" loading="lazy" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border/70 bg-background p-4">
                                <div className="text-sm font-semibold">Categories</div>
                                {renderCategoriesReview()}
                            </div>

                            {/* Show backend validation errors at step 4 */}
                            {Object.keys(stepErrors).length > 0 && (
                                <div className="rounded-xl border border-border/70 bg-background p-4">
                                    <div className="text-sm font-semibold text-destructive">Form errors</div>
                                    <div className="mt-2 space-y-1 text-sm">
                                        {Object.entries(stepErrors)
                                            .filter(([k]) => k !== 'confirmation')
                                            .slice(0, 8)
                                            .map(([key, msg]) => (
                                                <div key={key}>• {msg}</div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            <div className="rounded-xl border border-border/70 bg-background p-4">
                                <label className="flex items-center gap-3 rounded-lg border border-border/70 bg-white p-3">
                                    {/* <input type="checkbox" className="mt-1 h-4 w-4" checked={confirmSubmit} onChange={(e) => setConfirmSubmit(e.target.checked)} /> */}
                                    <Checkbox checked={confirmSubmit} onCheckedChange={(checked) => setConfirmSubmit(checked === true)} />
                                    <span className="text-sm text-muted-foreground">
                                        I confirm that the tournament details above are correct and I want to submit this tournament now.
                                    </span>
                                </label>
                                {stepErrors.confirmation ? <p className="mt-2 text-sm text-destructive">{stepErrors.confirmation}</p> : null}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                        <Button type="button" variant="outline" disabled={step === 1} onClick={handleBack}>
                            Back
                        </Button>
                        {step < 4 ? (
                            <Button type="button" disabled={processing} onClick={handleNext}>
                                Next
                            </Button>
                        ) : (
                            <Button type="submit" disabled={processing || !confirmSubmit}>
                                {processing ? 'Creating…' : 'Create tournament'}
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </>
    );
}

CreateTournament.layout = ({ organization }: {
        organization: any;
    }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/organizer/dashboard',
        },
        {
            title: organization?.name ?? 'Organization',
            href: `/organizer/organizations/${encodeURIComponent(organization.uuid)}/dashboard`,
        },
        {
            title: 'Create Tournament',
            href: '#',
        },
    ],
});