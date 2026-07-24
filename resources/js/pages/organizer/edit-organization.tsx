import { Head, useForm, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Building2, Save, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Country {
    id: number;
    name: string;
    slug: string;
    iso2: string;
}

interface StateProvince {
    id: number;
    name: string;
    slug: string;
}

export default function EditOrganization({
    organization,
    organizationUuid,
}: {
    organization: any;
    organizationUuid: string;
}) {
    const { data, setData, put, processing, errors } = useForm({
        name: organization?.name ?? '',
        email: organization?.email ?? '',
        contact_number: organization?.contact_number ?? '',
        website_url: organization?.website_url ?? '',
        description: organization?.description ?? '',
        address: organization?.address ?? '',
        country_id: organization?.country_id ?? null as number | null,
        state_province_id: organization?.state_province_id ?? null as number | null,
        zip_code: organization?.zip_code ?? '',
        logo_image: null as File | null,
        banner_image: null as File | null,
    });

    const [countries, setCountries] = useState<Country[]>([]);
    const [stateProvinces, setStateProvinces] = useState<StateProvince[]>([]);
    const [loadingStates, setLoadingStates] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    // Fetch countries on mount
    useEffect(() => {
        fetch('/api/countries')
            .then((res) => res.json())
            .then((data) => setCountries(data))
            .catch((err) => console.error('Error fetching countries:', err));
    }, []);

    // Fetch state provinces when country changes
    useEffect(() => {
        if (data.country_id) {
            setLoadingStates(true);
            fetch(`/api/countries/${data.country_id}/states`)
                .then((res) => res.json())
                .then((states) => {
                    setStateProvinces(states);
                })
                .catch((err) => console.error('Error fetching states:', err))
                .finally(() => setLoadingStates(false));
        } else {
            setStateProvinces([]);
        }
    }, [data.country_id]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData('logo_image', file);

        if (file) {
            setLogoPreview(URL.createObjectURL(file));
        } else {
            setLogoPreview(null);
        }
    };

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData('banner_image', file);

        if (file) {
            setBannerPreview(URL.createObjectURL(file));
        } else {
            setBannerPreview(null);
        }
    };

    const clearLogo = () => {
        setData('logo_image', null);
        setLogoPreview(null);
        if (logoInputRef.current) {
            logoInputRef.current.value = '';
        }
    };

    const clearBanner = () => {
        setData('banner_image', null);
        setBannerPreview(null);
        if (bannerInputRef.current) {
            bannerInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('email', data.email);
        if (data.contact_number) formData.append('contact_number', data.contact_number);
        if (data.website_url) formData.append('website_url', data.website_url);
        if (data.description) formData.append('description', data.description);
        if (data.address) formData.append('address', data.address);
        if (data.country_id) formData.append('country_id', String(data.country_id));
        if (data.state_province_id) formData.append('state_province_id', String(data.state_province_id));
        if (data.zip_code) formData.append('zip_code', data.zip_code);
        if (data.logo_image) formData.append('logo_image', data.logo_image);
        if (data.banner_image) formData.append('banner_image', data.banner_image);

        // Use POST with _method=PUT for file uploads via Inertia
        router.post(`/organizer/organizations/${organizationUuid}/update`, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setLogoPreview(null);
                setBannerPreview(null);
            },
        });
    };

    const currentLogoUrl = organization?.logo_image ? `/storage/${organization.logo_image}` : null;
    const currentBannerUrl = organization?.banner_image ? `/storage/${organization.banner_image}` : null;

    return (
        <>
            <Head title="Edit Organization" />
            <div className="mx-auto max-w-2xl space-y-6">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-xl font-semibold">Edit Organization</h2>
                        <p className="text-sm text-muted-foreground">
                            Update your organization information
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 overflow-hidden">
                                {organization?.logo_image ? (
                                    <img
                                        src={`/storage/${organization.logo_image}`}
                                        alt={`${organization?.name ?? 'Organization'} logo`}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <Building2 className="h-8 w-8 text-primary" />
                                )}
                            </div>
                            <div>
                                <p className="font-semibold">{organization?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {organization?.status?.name ?? '—'}
                                </p>
                            </div>
                        </div> */}

                        {/* Logo Upload */}
                        <div className="rounded-xl border border-border/70 bg-background p-4">
                            <Label className="text-sm font-semibold">Organization Logo</Label>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Upload a square image for best results. Max 2MB.
                            </p>
                            <div className="mt-3 flex items-center gap-4">
                                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-muted overflow-hidden border">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="New logo preview" className="h-full w-full object-cover" />
                                    ) : currentLogoUrl ? (
                                        <img src={currentLogoUrl} alt="Current logo" className="h-full w-full object-cover" />
                                    ) : (
                                        <Building2 className="h-8 w-8 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => logoInputRef.current?.click()}
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        {currentLogoUrl ? 'Change Logo' : 'Upload Logo'}
                                    </Button>
                                    {(logoPreview || currentLogoUrl) && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearLogo}
                                            className="text-destructive"
                                        >
                                            <X className="mr-2 h-4 w-4" />
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLogoChange}
                                className="hidden"
                            />
                            {errors.logo_image && <p className="mt-2 text-sm text-red-500">{errors.logo_image}</p>}
                        </div>

                        {/* Banner Upload */}
                        <div className="rounded-xl border border-border/70 bg-background p-4">
                            <Label className="text-sm font-semibold">Organization Banner</Label>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Recommended dimensions: 1200x400px. Max 5MB.
                            </p>
                            <div className="mt-3 space-y-3">
                                {(bannerPreview || currentBannerUrl) && (
                                    <div className="relative h-32 w-full overflow-hidden rounded-lg border bg-muted">
                                        <img
                                            src={bannerPreview || currentBannerUrl || ''}
                                            alt="Banner preview"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => bannerInputRef.current?.click()}
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        {currentBannerUrl ? 'Change Banner' : 'Upload Banner'}
                                    </Button>
                                    {(bannerPreview || currentBannerUrl) && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearBanner}
                                            className="text-destructive"
                                        >
                                            <X className="mr-2 h-4 w-4" />
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <input
                                ref={bannerInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleBannerChange}
                                className="hidden"
                            />
                            {errors.banner_image && <p className="mt-2 text-sm text-red-500">{errors.banner_image}</p>}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Organization Name *</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    disabled={processing}
                                />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    disabled={processing}
                                />
                                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="contact_number">Contact Number</Label>
                                <Input
                                    id="contact_number"
                                    type="tel"
                                    value={data.contact_number}
                                    onChange={(e) => setData('contact_number', e.target.value)}
                                    disabled={processing}
                                />
                                {errors.contact_number && <p className="text-sm text-red-500">{errors.contact_number}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="website_url">Website URL</Label>
                                <Input
                                    id="website_url"
                                    type="url"
                                    value={data.website_url}
                                    onChange={(e) => setData('website_url', e.target.value)}
                                    disabled={processing}
                                />
                                {errors.website_url && <p className="text-sm text-red-500">{errors.website_url}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                disabled={processing}
                                className="min-h-[100px]"
                            />
                            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                type="text"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                disabled={processing}
                            />
                            {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="country_id">Country *</Label>
                                <select
                                    id="country_id"
                                    value={data.country_id || ''}
                                    onChange={(e) => setData('country_id', e.target.value ? parseInt(e.target.value) : null)}
                                    disabled={processing}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-none transition-colors outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Select Country</option>
                                    {countries.map((country) => (
                                        <option key={country.id} value={country.id}>
                                            {country.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.country_id && <p className="text-sm text-red-500">{errors.country_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state_province_id">State/Province</Label>
                                <select
                                    id="state_province_id"
                                    value={data.state_province_id || ''}
                                    onChange={(e) => setData('state_province_id', e.target.value ? parseInt(e.target.value) : null)}
                                    disabled={processing || !data.country_id || loadingStates}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-none transition-colors outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">
                                        {loadingStates ? 'Loading...' : 'Select State/Province'}
                                    </option>
                                    {stateProvinces.map((state) => (
                                        <option key={state.id} value={state.id}>
                                            {state.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.state_province_id && <p className="text-sm text-red-500">{errors.state_province_id}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="zip_code">Zip Code</Label>
                            <Input
                                id="zip_code"
                                type="text"
                                value={data.zip_code}
                                onChange={(e) => setData('zip_code', e.target.value)}
                                disabled={processing}
                            />
                            {errors.zip_code && <p className="text-sm text-red-500">{errors.zip_code}</p>}
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button type="submit" disabled={processing}>
                                <Save className="mr-2 h-4 w-4" />
                                {processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

EditOrganization.layout = ({ organization }: {
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
            title: 'Edit',
            href: '#',
        },
    ],
});

