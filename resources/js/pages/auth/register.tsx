import { Head, Link, useForm } from '@inertiajs/react';
import { Camera, Check, CircleAlert, Globe2, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login, register as registerRoute } from '@/routes';
import registerRoutes from '@/routes/register';

interface CountryOption {
    id: number;
    name: string;
    slug: string;
    iso2: string;
}

interface StateOption {
    id: number;
    name: string;
    country_id: number;
}

type Props = {
    countries: CountryOption[];
    states: StateOption[];
};

export default function Register({ countries, states }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        agree_terms: false,
        profile_image: null as File | null,
        google_id: '',
    });

    const [preview, setPreview] = useState<string | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<number | null>(null);

    const filteredStates = useMemo(() => {
        if (!selectedCountry) {
            return states;
        }

        return states.filter((state) => state.country_id === selectedCountry);
    }, [selectedCountry, states]);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        post(registerRoutes.store.url());
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        setData('profile_image', file);

        if (file) {
            const reader = new FileReader();
            reader.onload = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    return (
        <>
            <Head title="Create your account" />
            <div className="flex items-center justify-center gap-6">
                <div className="w-full max-w-md rounded-lg border border-border/70 bg-card/80 p-4 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.35)] backdrop-blur-sm dark:border-primary/15 dark:bg-card/90 sm:p-8">
                    <div>
                        <div className="max-w-xl mb-5">
                            <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                                <ShieldCheck className="size-4" />
                                Create account
                            </div>
                            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                                Create your player account
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Join in minutes and start building your profile so organizers can discover you.
                            </p>
                        </div>
                        <div className="rounded-md border border-border/70 bg-background/70 p-3 text-sm text-muted-foreground text-center">
                            <span className="block text-[11px] uppercase tracking-[0.25em] text-muted-foreground/80">
                                Already have an account?
                            </span>
                            <Link href={login().url} className="mt-1 inline-flex font-medium text-primary hover:underline">
                                Log in here
                            </Link>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8">
                        <div className="space-y-5 mb-4">
                            <div className="rounded-lg border border-border/70 bg-background/70 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
                                        {preview ? <img src={preview} alt="Preview" className="h-full w-full rounded-md object-cover" /> : <Camera className="size-6" />}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="profile_image" className="cursor-pointer text-sm font-medium text-foreground">
                                            Profile picture
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Upload a clear headshot for your profile.
                                        </p>
                                    </div>
                                </div>
                                <Input
                                    id="profile_image"
                                    type="file"
                                    accept="image/*"
                                    className="mt-3"
                                    onChange={handleFileChange}
                                />
                                {errors.profile_image && <p className="mt-2 text-sm text-red-600">{errors.profile_image}</p>}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">First name</Label>
                                    <Input id="first_name" value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} />
                                    {errors.first_name && <p className="text-sm text-red-600">{errors.first_name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Last name</Label>
                                    <Input id="last_name" value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} />
                                    {errors.last_name && <p className="text-sm text-red-600">{errors.last_name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                                    {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <PasswordInput id="password" value={data.password} onChange={(e) => setData('password', e.target.value)} />
                                    {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation">Confirm password</Label>
                                    <PasswordInput id="password_confirmation" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} />
                                    {errors.password_confirmation && <p className="text-sm text-red-600">{errors.password_confirmation}</p>}
                                </div>
                            </div>

                            <div className="lg:col-span-2 space-y-4 rounded-lg border border-border/70 bg-background/70 p-4">
                                <label className="flex items-start gap-3 text-sm text-muted-foreground">
                                    <Checkbox checked={data.agree_terms} onCheckedChange={(checked) => setData('agree_terms', checked === true)} />
                                    <span>
                                        I agree with the terms and conditions and understand that my account will be created as a player profile.
                                    </span>
                                </label>
                                {errors.agree_terms && <p className="text-sm text-red-600">{errors.agree_terms}</p>}

                                <div className="flex flex-wrap items-center gap-3">
                                    <Button type="submit" className="w-full" disabled={processing}>
                                        {processing ? <Spinner /> : <>Create account</>}
                                    </Button>
                                </div>

                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <div className="h-px flex-1 bg-border" />
                                    <span>Or continue with</span>
                                    <div className="h-px flex-1 bg-border" />
                                </div>

                                <Button type="button" variant="outline" className="w-full">
                                    <Globe2 className="size-4" />Continue with Google
                                </Button>

                                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <CircleAlert className="mt-0.5 size-5 shrink-0 text-primary" />
                                    <span>Google sign-in stores the Google account ID in your user profile and fills the basic player information fields.</span>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

Register.layout = {
    title: 'Create your account',
    description: 'Set up your player profile and connect with organizers quickly',
};
