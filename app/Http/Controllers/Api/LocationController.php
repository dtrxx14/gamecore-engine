<?php

namespace App\Http\Controllers\Api;

use App\Models\Country;
use App\Models\StateProvince;

class LocationController
{
    public function countries()
    {
        return Country::query()
            ->orderBy('name')
            ->select('id', 'name', 'slug', 'iso2')
            ->get();
    }

    public function stateProvinces($countryId)
    {
        return StateProvince::query()
            ->where('country_id', $countryId)
            ->orderBy('name')
            ->select('id', 'name', 'slug')
            ->get();
    }
}
