import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function VenueForm({
    data,
    errors = {},
    onChange,
}: {
    data: any;
    errors?: Record<string, string>;
    onChange: (field: string, value: any) => void;
}) {
    const [searchQuery, setSearchQuery] = useState(data.venue_address || '');
    const [predictions, setPredictions] = useState<any[]>([]);
    const [serviceReady, setServiceReady] = useState(false);
    const [loadingPredictions, setLoadingPredictions] = useState(false);
    const hiddenMapRef = useRef<HTMLDivElement | null>(null);
    const autocompleteServiceRef = useRef<any>(null);
    const placesServiceRef = useRef<any>(null);

    useEffect(() => {
        if (!googleApiKey) {
            return;
        }

        if ((window as any).google?.maps?.places) {
            autocompleteServiceRef.current = new (window as any).google.maps.places.AutocompleteService();
            placesServiceRef.current = new (window as any).google.maps.places.PlacesService(hiddenMapRef.current || document.createElement('div'));
            setServiceReady(true);

            return;
        }

        const scriptId = 'google-maps-places-script';

        if (document.getElementById(scriptId)) {
            return;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            autocompleteServiceRef.current = new (window as any).google.maps.places.AutocompleteService();
            placesServiceRef.current = new (window as any).google.maps.places.PlacesService(hiddenMapRef.current || document.createElement('div'));
            setServiceReady(true);
        };
        document.head.appendChild(script);
    }, []);

    useEffect(() => {
        if (!serviceReady || searchQuery.length < 2) {
            setPredictions([]);

            return;
        }

        setLoadingPredictions(true);
        autocompleteServiceRef.current.getPlacePredictions({ input: searchQuery, types: ['geocode'] }, (results: any, status: any) => {
            setLoadingPredictions(false);
            setPredictions(status === (window as any).google.maps.places.PlacesServiceStatus.OK ? results : []);
        });
    }, [searchQuery, serviceReady]);

    const selectPrediction = (prediction: any) => {
        if (!placesServiceRef.current) {
            return;
        }

        placesServiceRef.current.getDetails({ placeId: prediction.place_id }, (place: any, status: any) => {
            if (status !== (window as any).google.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) {
                return;
            }

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const description = place.formatted_address || prediction.description;

            setSearchQuery(description);
            setPredictions([]);
            onChange('venue_pin_location', `${lat},${lng}`);
            onChange('venue_address', description);
        });
    };

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        onChange('venue_pin_location', value);
    };

    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold">Venue</h3>

            <div className="mt-3">
                <Label htmlFor="venue_name">Venue name</Label>
                <Input id="venue_name" value={data.venue_name} onChange={(e: any) => onChange('venue_name', e.target.value)} className="mt-1" />
            </div>

            <div className="mt-3">
                <Label htmlFor="venue_address">Venue address</Label>
                <Input id="venue_address" value={data.venue_address} onChange={(e: any) => onChange('venue_address', e.target.value)} className="mt-1" />
                {errors.venue_address ? <p className="mt-2 text-sm text-destructive">{errors.venue_address}</p> : null}
            </div>

            <div className="mt-3 relative">
                <Label htmlFor="venue_pin_location">Pin location</Label>
                <Input
                    id="venue_pin_location"
                    value={searchQuery}
                    autoComplete="off"
                    onChange={(e: any) => handleSearchChange(e.target.value)}
                    className="mt-1"
                />
                {serviceReady && predictions.length > 0 ? (
                    <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-border bg-background shadow-lg">
                        {loadingPredictions ? (
                            <div className="p-3 text-sm text-muted-foreground">Loading places…</div>
                        ) : (
                            predictions.map((prediction) => (
                                <button
                                    key={prediction.place_id}
                                    type="button"
                                    onClick={() => selectPrediction(prediction)}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                                >
                                    {prediction.description}
                                </button>
                            ))
                        )}
                    </div>
                ) : null}
                <div ref={hiddenMapRef} className="hidden" />
                {errors.venue_pin_location ? <p className="mt-2 text-sm text-destructive">{errors.venue_pin_location}</p> : null}
                {!googleApiKey ? (
                    <p className="mt-2 text-sm text-muted-foreground">Enter latitude,longitude manually or set VITE_GOOGLE_MAPS_API_KEY for search autocomplete.</p>
                ) : null}
            </div>
        </div>
    );
}
