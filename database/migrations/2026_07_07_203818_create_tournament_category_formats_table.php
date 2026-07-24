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
        Schema::create('tournament_category_formats', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedBigInteger('tournament_category_id'); // Foreign key to the tournament_categories table
            $table->string('round_format'); // Round format (e.g., round-32, round-16, quarter-finals, battle-for-third, semi-finals, finals)
            $table->string('competition_format'); // Competition format (e.g., round-robin, single-elimination, double-elimination, or swiss-system)
            $table->string('scoring_format'); // Match format (e.g., sudden-death, deuce, score-by-serve)
            $table->string('series_format'); // Series format (e.g., none, best-of-3, best-of-5)
            $table->string('point_system'); // Point system (e.g., standard-side-out, rally-point)
            $table->boolean('allow_wildcard')->default(false);

            $table->unsignedInteger('game_to')->nullable(); // Example game_to values: 7, 11, 15, 51
            $table->unsignedInteger('win_by')->nullable(); // Example win_by values: 1, 2, 3

            $table->integer('pool_count')->nullable(); // Number of pools (for pool-play format) e.g., 2, 4, 8 (bracketed into 2, 4, 8 pools)
            $table->integer('advance_per_pool')->nullable(); // Number of players/teams advancing per pool (for pool-play format) e.g., 1, 2, 3 (top 1, top 2, top 3 advance to next round)

            $table->boolean('allow_draw')->default(false); // Whether draws are allowed
            
            $table->boolean('allow_court_change')->default(false); // Whether court changes are allowed
            $table->enum('court_change_trigger', [ 'none', 'rally-count', 'score-count', 'game-end', 'match-end', ])->default('none'); // Trigger for court change (none, rally_count, score_count, game_end, match_end)
            $table->unsignedTinyInteger('court_change_interval')->nullable(); // Interval for court change (e.g., every 2 rallies, every 5 points, every game, every match)

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournament_category_formats');
    }
};
