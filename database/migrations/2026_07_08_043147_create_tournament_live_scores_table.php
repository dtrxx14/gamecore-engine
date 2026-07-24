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
        Schema::create('tournament_live_scores', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedBigInteger('tournament_match_id'); // Tournament match ID for the live score
            $table->unsignedBigInteger('court_id'); // Court ID for the match
            $table->unsignedInteger('set_number')->default(1); // Set number for the match (e.g., 1, 2, 3, etc.)
            $table->unsignedInteger('team_a_score')->default(0); // Current score for team A
            $table->unsignedInteger('team_b_score')->default(0); // Current score for team B
            $table->unsignedInteger('team_serve_count')->default(0); // Count of serves for the team
            $table->unsignedBigInteger('server_group_id'); // Group ID of the serving team
            $table->unsignedBigInteger('status_id'); // Status ID for the live score Live, Paused, Completed, etc.
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournament_live_scores');
    }
};
