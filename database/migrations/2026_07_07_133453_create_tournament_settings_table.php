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
        Schema::create('tournament_settings', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedBigInteger('tournament_id');
            $table->boolean('allow_waitlist')->default(false); // Allow players to join a waitlist
            $table->string('call_time_in_hours')->default("8:00"); // Time when the tournament calls for participants
            $table->string('start_time_in_hours')->default("9:00"); // Tournament start time
            $table->string('end_time_in_hours')->default("22:00"); // Tournament end time
            $table->unsignedInteger('default_match_duration_minutes')->default(30); // Default duration of each match in minutes
            $table->unsignedInteger('default_rest_time_minutes')->default(5); // Default rest time between matches in minutes
            $table->unsignedInteger('default_court_counts')->default(1); // Default number of courts
            $table->boolean('is_dupr')->default(false); // Indicates if the tournament is a DUPR tournament
            $table->unsignedBigInteger('status_id'); // Status of the tournament settings (e.g., active, inactive)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournament_settings');
    }
};
