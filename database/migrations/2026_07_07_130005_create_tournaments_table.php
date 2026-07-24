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
        Schema::create('tournaments', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid')->unique(); // Unique identifier for the tournament
            $table->unsignedBigInteger('organization_id'); // Organization ID for the tournament
            $table->string('title'); // Tournament title
            $table->string('slug')->unique(); // Unique slug for the tournament
            $table->string('banner_image')->nullable(); // Banner image for the tournament
            $table->dateTime('start_date'); // Tournament start date and time
            $table->text('description')->nullable(); // Tournament description information, announcements, and other details
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournaments');
    }
};
