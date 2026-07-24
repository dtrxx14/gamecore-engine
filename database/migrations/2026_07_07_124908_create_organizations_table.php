<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid')->unique(); // Unique identifier for the organization
            $table->string('name'); // Organization name
            $table->string('slug')->unique(); // Unique slug for the organization
            $table->string('logo_image')->nullable(); // Logo image for the organization
            $table->string('banner_image')->nullable(); // Banner image for the organization
            $table->string('email')->unique(); // Organization email
            $table->string('contact_number')->nullable(); // Contact number for the organization
            $table->string('website_url')->nullable(); // Website URL for the organization
            $table->text('description')->nullable(); // Description of the organization
            $table->string('address')->nullable(); // Address of the organization
            $table->unsignedBigInteger('country_id'); // Country ID for the organization
            $table->unsignedBigInteger('state_province_id')->nullable(); // State or province ID for the organization
            $table->string('zip_code')->nullable(); // Zip code for the organization
            $table->unsignedBigInteger('status_id')->default(0); // Status ID for the organization (e.g., Active, Inactive, Pending, etc.)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};
