<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\StateProvince;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class CountryProvinceStateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $path = public_path('json/countries-states.json');

        if (! File::exists($path)) {
            $this->command->error('Countries JSON file not found at '.$path);

            return;
        }

        $countries = json_decode(File::get($path), true);

        if (! is_array($countries)) {
            $this->command->error('Countries JSON file could not be decoded.');

            return;
        }

        foreach ($countries as $countryData) {
            if (empty($countryData['name'])) {
                continue;
            }

            $country = Country::updateOrCreate(
                ['name' => $countryData['name']],
                [
                    'slug' => $this->makeSlug($countryData['name']),
                    'iso2' => $countryData['iso2'] ?? null,
                ]
            );

            $states = $countryData['states'] ?? [];

            if (! is_array($states)) {
                continue;
            }

            foreach ($states as $stateName) {
                if (! is_string($stateName) || trim($stateName) === '') {
                    continue;
                }

                StateProvince::updateOrCreate(
                    [
                        'country_id' => $country->id,
                        'name' => trim($stateName),
                    ],
                    [
                        'slug' => $this->makeSlug($stateName),
                    ]
                );
            }
        }

        $this->command->info('Countries and state/provinces seeded successfully.');
    }

    protected function makeSlug(string $value): string
    {
        $slug = Str::slug($value);

        return $slug !== '' ? $slug : 'item';
    }
}
