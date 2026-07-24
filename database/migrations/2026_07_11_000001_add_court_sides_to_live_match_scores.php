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
        Schema::table('live_match_scores', function (Blueprint $table) {
            $table->enum('team_a_court', ['left', 'right'])->nullable()->after('team_b_score');
            $table->enum('team_b_court', ['left', 'right'])->nullable()->after('team_a_court');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('live_match_scores', function (Blueprint $table) {
            $table->dropColumn(['team_a_court', 'team_b_court']);
        });
    }
};

