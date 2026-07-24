<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApplyAsOrganizerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'logo_image' => ['required', 'image', 'max:4096'],
            'banner_image' => ['required', 'image', 'max:4096'],
            'email' => ['required', 'email', 'max:255', 'unique:organizations'],
            'contact_number' => ['nullable', 'string', 'max:20'],
            'website_url' => ['nullable', 'url'],
            'description' => ['nullable', 'string', 'max:1000'],
            'address' => ['nullable', 'string', 'max:500'],
            'country_id' => ['required', 'integer', 'exists:countries,id'],
            'state_province_id' => ['nullable', 'integer', 'exists:state_provinces,id'],
            'zip_code' => ['nullable', 'string', 'max:20'],
        ];
    }

    public function messages()
    {
        return [
            'name.required' => 'The organization name is required.',
            'logo_image.required' => 'The logo is required.',
            'banner_image.required' => 'The banner is required.',
            'email.unique' => 'This email is already registered.',
            'country_id.required' => 'The country field is required.',
        ];
    }
}
