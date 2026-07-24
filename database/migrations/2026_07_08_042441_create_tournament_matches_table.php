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
        Schema::create('tournament_matches', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedBigInteger('tournament_category_id'); // Tournament category ID for the match
            $table->unsignedBigInteger('group_id'); // Group ID for the match
            $table->unsignedBigInteger('bracket_id'); // Bracket ID for the match
            $table->unsignedBigInteger('court_id')->nullable(); // Court ID for the match (nullable if not assigned yet)
            $table->unsignedBigInteger('official_id')->nullable(); // Official ID for the match (nullable if not assigned yet)
            $table->unsignedBigInteger('tournament_category_format_id')->nullable(); // Tournament category format ID for the match (nullable if not assigned yet)
            $table->unsignedBigInteger('team_a_id')->nullable(); // Team A ID for the match (nullable if not assigned yet)
            $table->unsignedBigInteger('team_b_id')->nullable(); // Team B ID for the match (nullable if not assigned yet)
            $table->unsignedBigInteger('winner_id')->nullable(); // Winner ID for the match (nullable if not assigned yet)
            $table->unsignedBigInteger('loser_id')->nullable(); // Loser ID for the match (nullable if not assigned yet)
            $table->unsignedInteger('team_a_score')->default(0); // Current score for team A
            $table->unsignedInteger('team_b_score')->default(0); // Current score for team B
            $table->unsignedInteger('team_a_score_by_set')->nullable(); // Score for team A by set
            $table->unsignedInteger('team_b_score_by_set')->nullable(); // Score for team B by set
            $table->unsignedBigInteger('status_id'); // Status ID for the match (e.g., Scheduled, In Progress, Completed)
            $table->dateTime('scheduled_at')->nullable(); // Scheduled date and time for the match (nullable if not scheduled yet)
            $table->dateTime('started_at')->nullable(); // Actual start date and time for the match (nullable if not started yet)
            $table->dateTime('ended_at')->nullable(); // Actual end date and time for the match (nullable if not ended yet)
            $table->unsignedInteger('match_duration_minutes')->nullable(); // Duration of the match in minutes (nullable if not completed yet)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournament_matches');
    }
};
