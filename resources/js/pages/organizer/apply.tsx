import { Head, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apply } from '@/routes/organizer';

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

export default function ApplyAsOrganizer() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        logo_image: null as File | null,
        banner_image: null as File | null,
        email: '',
        contact_number: '',
        website_url: '',
        description: '',
        address: '',
        country_id: null as number | null,
        state_province_id: null as number | null,
        zip_code: '',
    });

    const [countries, setCountries] = useState<Country[]>([]);
    const [stateProvinces, setStateProvinces] = useState<StateProvince[]>([]);
    const [loadingStates, setLoadingStates] = useState(false);

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
                .then((data) => {
                    setStateProvinces(data);
                    setData('state_province_id', null);
                })
                .catch((err) => console.error('Error fetching states:', err))
                .finally(() => setLoadingStates(false));
        } else {
            setStateProvinces([]);
            setData('state_province_id', null);
        }
    }, [data.country_id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(apply.url());
    };

    return (
        <>
            <Head title="Apply as Organizer" />
            <div className="mx-auto max-w-2xl space-y-7 rounded-lg border border-border bg-card p-6 shadow-[0_1px_0_rgba(15,23,42,0.03)] sm:p-8">
                <div>
                    <h2 className="text-2xl font-semibold">Apply as Organizer</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Share a few details about your organization and we will review your request.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* {errors.name && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                            <p className="text-sm text-red-800">{errors.name}</p>
                        </div>
                    )} */}

                    <div className="space-y-2">
                        <Label htmlFor="logo_image">Logo *</Label>
                        <Input
                            id="logo_image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];

                                if (file) {
                                    setData('logo_image', file);
                                }
                            }}
                            disabled={processing}
                        />
                        {errors.logo_image && <p className="text-sm text-red-500">{errors.logo_image}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="banner_image">Banner *</Label>
                        <Input
                            id="banner_image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];

                                if (file) {
                                    setData('banner_image', file);
                                }
                            }}
                            disabled={processing}
                        />
                        {errors.banner_image && <p className="text-sm text-red-500">{errors.banner_image}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Organization Name *</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Your Organization Name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            disabled={processing}
                        />
                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="email">Organization Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="info@organization.com"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                disabled={processing}
                            />
                            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contact_number">Contact Number</Label>
                            <Input
                                id="contact_number"
                                type="tel"
                                placeholder="+1 234 567 8900"
                                value={data.contact_number || ''}
                                onChange={(e) => setData('contact_number', e.target.value)}
                                disabled={processing}
                            />
                            {errors.contact_number && <p className="text-sm text-red-500">{errors.contact_number}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="website_url">Website URL</Label>
                        <Input
                            id="website_url"
                            type="url"
                            placeholder="https://yourorganization.com"
                            value={data.website_url || ''}
                            onChange={(e) => setData('website_url', e.target.value)}
                            disabled={processing}
                        />
                        {errors.website_url && <p className="text-sm text-red-500">{errors.website_url}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Tell us about your organization..."
                            value={data.description || ''}
                            onChange={(e) => setData('description', e.target.value)}
                            disabled={processing}
                            className="min-h-[120px]"
                        />
                        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            type="text"
                            placeholder="123 Main St"
                            value={data.address || ''}
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
                                className="flex h-9 w-full rounded-sm border border-input bg-background px-3 py-1 text-base shadow-none transition-colors outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
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
                                className="flex h-9 w-full rounded-sm border border-input bg-background px-3 py-1 text-base shadow-none transition-colors outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
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
                            placeholder="12345"
                            value={data.zip_code || ''}
                            onChange={(e) => setData('zip_code', e.target.value)}
                            disabled={processing}
                        />
                        {errors.zip_code && <p className="text-sm text-red-500">{errors.zip_code}</p>}
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="flex-1"
                        >
                            {processing ? 'Submitting...' : 'Submit Application'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                            disabled={processing}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

ApplyAsOrganizer.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/player/dashboard',
        },
        {
            title: 'Apply as Organizer',
            href: '/organizer/apply',
        },
    ],
};
