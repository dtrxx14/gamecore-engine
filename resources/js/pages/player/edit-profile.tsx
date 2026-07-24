import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, BadgeCheck, CalendarDays, KeyRound, Mail, MapPin, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Auth, PlayerProfile } from '@/types';

type PageProps = {
    auth: Auth;
};

type CountryOption = {
    id: number;
    name: string;
    slug: string;
    iso2: string;
};

type StateOption = {
    id: number;
    name: string;
    slug: string;
};

type Props = {
    passwordRules: string;
};

export default function PlayerEditProfile(props: Props) {
    const { auth } = usePage<PageProps>().props;
    const user = auth?.user;
    const profile = (user?.player_profile ?? {}) as Partial<PlayerProfile>;

    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const [countries, setCountries] = useState<CountryOption[]>([]);
    const [states, setStates] = useState<StateOption[]>([]);
    const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
    const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
    const [loadingStates, setLoadingStates] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const [isDuprModalOpen, setIsDuprModalOpen] = useState(false);

    const currentCountryName = useMemo(() => profile.country || 'Not provided', [profile.country]);
    const currentStateName = useMemo(() => profile.state || 'Not provided', [profile.state]);

    const toggleEditingProfile = () => {
        setIsEditingProfile((value) => {
            const nextValue = !value;

            if (!nextValue) {
                setSelectedCountryId(null);
                setSelectedStateId(null);
            }

            return nextValue;
        });
    };

    useEffect(() => {
        if (!countries.length || selectedCountryId !== null || !profile.country) {
            return;
        }

        const matchedCountry = countries.find((country) => country.name === profile.country);

        if (matchedCountry) {
            setSelectedCountryId(matchedCountry.id);
        }
    }, [countries, profile.country, selectedCountryId]);

    useEffect(() => {
        if (!states.length || selectedStateId !== null || !profile.state || !selectedCountryId) {
            return;
        }

        const matchedState = states.find((state) => state.name === profile.state);

        if (matchedState) {
            setSelectedStateId(matchedState.id);
        }
    }, [profile.state, selectedCountryId, selectedStateId, states]);

    useEffect(() => {
        fetch('/api/countries')
            .then((res) => res.json())
            .then((data) => setCountries(data))
            .catch((err) => console.error('Error fetching countries:', err));
    }, []);

    useEffect(() => {
        const countryId = selectedCountryId ?? undefined;

        if (!countryId) {
            setStates([]);
            setSelectedStateId(null);

            return;
        }

        let isActive = true;
        setLoadingStates(true);
        fetch(`/api/countries/${countryId}/states`)
            .then((res) => res.json())
            .then((data) => {
                if (!isActive) {
                    return;
                }

                setStates(data);

                if (!profile.state) {
                    setSelectedStateId(null);

                    return;
                }

                const matchedState = data.find((state: StateOption) => state.name === profile.state);

                if (matchedState) {
                    setSelectedStateId(matchedState.id);
                } else {
                    setSelectedStateId(null);
                }
            })
            .catch((err) => {
                if (isActive) {
                    console.error('Error fetching states:', err);
                }
            })
            .finally(() => {
                if (isActive) {
                    setLoadingStates(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, [profile.state, selectedCountryId]);

    return (
        <>
            <Head title="Edit player profile" />
            <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                                <UserRound className="size-3.5" />
                                Edit profile
                            </div>
                            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                                Update your player details
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Manage the information organizers and teams see about you.
                            </p>
                        </div>
                        <Link href="/player/profile">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 size-4" />
                                Back to profile
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <ShieldCheck className="size-4 text-primary" />
                            Account details
                        </div>
                        <div className="mt-5 space-y-4">
                            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Account number</div>
                                <div className="mt-2 text-sm text-foreground">{user?.account_number || 'Not available'}</div>
                            </div>
                            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Email</div>
                                <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
                                    <Mail className="size-4 text-primary" />
                                    {user?.email || 'No email provided'}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Gender</div>
                                <div className="mt-2 text-sm text-foreground">{profile.gender || 'Not provided'}</div>
                            </div>
                            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Birthdate</div>
                                <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
                                    <CalendarDays className="size-4 text-primary" />
                                    {profile.birthdate || 'Not provided'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
                            <KeyRound className="size-4 text-primary" />
                            Edit security
                        </div>
                        <Form
                            {...SecurityController.update.form()}
                            options={{
                                preserveScroll: true,
                            }}
                            resetOnError={[
                                'password',
                                'password_confirmation',
                                'current_password',
                            ]}
                            resetOnSuccess
                            onError={(errors) => {
                                if (errors.password) {
                                    passwordInput.current?.focus();
                                }

                                if (errors.current_password) {
                                    currentPasswordInput.current?.focus();
                                }
                            }}
                            className="space-y-4 w-full"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="current_password">
                                            Current password
                                        </Label>

                                        <PasswordInput
                                            id="current_password"
                                            ref={currentPasswordInput}
                                            name="current_password"
                                            className="mt-1 block w-full"
                                            autoComplete="current-password"
                                            placeholder="Current password"
                                        />

                                        <InputError message={errors.current_password} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="password">New password</Label>

                                        <PasswordInput
                                            id="password"
                                            ref={passwordInput}
                                            name="password"
                                            className="mt-1 block w-full"
                                            autoComplete="new-password"
                                            placeholder="New password"
                                            passwordrules={props.passwordRules}
                                        />

                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="password_confirmation">
                                            Confirm password
                                        </Label>

                                        <PasswordInput
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            className="mt-1 block w-full"
                                            autoComplete="new-password"
                                            placeholder="Confirm password"
                                            passwordrules={props.passwordRules}
                                        />

                                        <InputError
                                            message={errors.password_confirmation}
                                        />
                                    </div>

                                    <div className="flex items-center justify-end gap-4">
                                        <Button
                                            disabled={processing}
                                            data-test="update-password-button"
                                        >
                                            Save
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <UserRound className="size-4 text-primary" />
                            Player profile
                        </div>
                        <Button className={` ${isEditingProfile ? 'hidden' : ''}`} type="button" variant="outline" onClick={toggleEditingProfile}>
                            Edit profile
                        </Button>
                    </div>
                    <Form
                        method="patch"
                        action="/player/profile"
                        onSuccess={() => setIsEditingProfile(false)}
                        className="mt-5"
                    >
                        {({ processing }) => (
                            <fieldset disabled={!isEditingProfile} className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="first_name">First name</Label>
                                        <Input
                                            id="first_name"
                                            className="mt-1 block w-full"
                                            defaultValue={profile.first_name ?? ''}
                                            name="first_name"
                                            required
                                            autoComplete="first_name"
                                            placeholder="First name"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="middle_name">Middle name</Label>
                                        <Input
                                            id="middle_name"
                                            className="mt-1 block w-full"
                                            defaultValue={profile.middle_name ?? ''}
                                            name="middle_name"
                                            autoComplete="middle_name"
                                            placeholder="Middle name"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="last_name">Last name</Label>
                                        <Input
                                            id="last_name"
                                            className="mt-1 block w-full"
                                            defaultValue={profile.last_name ?? ''}
                                            name="last_name"
                                            required
                                            autoComplete="last_name"
                                            placeholder="Last name"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="contact_number">Phone</Label>
                                        <Input
                                            id="contact_number"
                                            className="mt-1 block w-full"
                                            defaultValue={profile.contact_number ?? ''}
                                            name="contact_number"
                                            required
                                            autoComplete="contact_number"
                                            placeholder="Contact number"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="club">Club</Label>
                                        <Input
                                            id="club"
                                            className="mt-1 block w-full"
                                            defaultValue={profile.club ?? ''}
                                            name="club"
                                            required
                                            autoComplete="club"
                                            placeholder="Club"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="gender">Gender</Label>
                                        <select
                                            id="gender"
                                            name="gender"
                                            defaultValue={profile.gender ?? ''}
                                            className="flex h-9 w-full rounded-sm border border-input bg-background px-3 py-1 text-base shadow-none transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">Select gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="birthdate">Birthdate</Label>
                                        <div className="w-full">
                                            <Input
                                                id="birthdate"
                                                name="birthdate"
                                                type="date"
                                                defaultValue={profile.birthdate ?? ''}
                                                className="w-full text-left pr-10 [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="bio">About</Label>
                                        <Textarea
                                            id="bio"
                                            name="bio"
                                            defaultValue={profile.bio ?? ''}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="country_id">Country</Label>
                                        <select
                                            id="country_id"
                                            name="country_id"
                                            value={selectedCountryId ?? ''}
                                            onChange={(event) => {
                                                const nextValue = event.target.value ? Number(event.target.value) : null;
                                                setSelectedCountryId(nextValue);
                                            }}
                                            className="flex h-9 w-full rounded-sm border border-input bg-background px-3 py-1 text-base shadow-none transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">Select country</option>
                                            {countries.map((country) => (
                                                <option key={country.id} value={country.id}>
                                                    {country.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="state_province_id">State / Province</Label>
                                        <select
                                            id="state_province_id"
                                            name="state_province_id"
                                            value={selectedStateId ?? ''}
                                            onChange={(event) => {
                                                const nextValue = event.target.value ? Number(event.target.value) : null;
                                                setSelectedStateId(nextValue);
                                            }}
                                            disabled={!selectedCountryId || loadingStates}
                                            className="flex h-9 w-full rounded-sm border border-input bg-background px-3 py-1 text-base shadow-none transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">
                                                {loadingStates ? 'Loading...' : 'Select state'}
                                            </option>
                                            {states.map((state) => (
                                                <option key={state.id} value={state.id}>
                                                    {state.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                                        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Current selection</div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <MapPin className="size-4 text-primary" />
                                            {currentCountryName} • {currentStateName}
                                        </div>
                                    </div>
                                    <div className={`${!isEditingProfile ? 'hidden' : 'flex'} justify-end gap-2`}>
                                        <Button type="button" variant="outline" onClick={toggleEditingProfile}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={processing || !isEditingProfile}>
                                            {processing ? 'Saving...' : 'Save changes'}
                                        </Button>
                                    </div>
                                </div>
                            </fieldset>
                        )}
                    </Form>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <BadgeCheck className="size-4 text-primary" />
                        Connect DUPR account
                    </div>
                    <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">DUPR account</div>
                            <div className="mt-2">{profile.dupr_account || 'No DUPR account linked yet.'}</div>
                        </div>
                        <Dialog open={isDuprModalOpen} onOpenChange={setIsDuprModalOpen}>
                            <DialogTrigger asChild>
                                <Button type="button" variant="outline">
                                    Connect DUPR Account
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-xl">Connect DUPR account</DialogTitle>
                                    <DialogDescription>
                                        This is a temporary placeholder flow for linking your DUPR account.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 rounded-2xl border border-border/60 bg-background/70 p-5">
                                    <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground">
                                        <p className="font-medium text-foreground">DUPR login placeholder</p>
                                        <p className="mt-2">A dedicated DUPR authentication flow will be wired in here soon.</p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="dupr_modal_email">DUPR email</Label>
                                        <Input id="dupr_modal_email" placeholder="you@dupr.com" />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button type="button" variant="outline" onClick={() => setIsDuprModalOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="button" onClick={() => setIsDuprModalOpen(false)}>
                                            Continue
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <DeleteUser />
            </div>
        </>
    );
}

PlayerEditProfile.layout = {
    breadcrumbs: [
        {
            title: 'Profile',
            href: '/player/profile',
        },
        {
            title: 'Edit profile',
            href: '/player/edit-profile',
        },
    ],
};
