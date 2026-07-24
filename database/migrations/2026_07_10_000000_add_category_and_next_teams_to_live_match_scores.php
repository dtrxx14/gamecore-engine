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
            $table->unsignedBigInteger('next_team_a_id')->nullable()->after('serving_team'); // Next team A waiting in queue for this court
            $table->unsignedBigInteger('next_team_b_id')->nullable()->after('next_team_a_id'); // Next team B waiting in queue for this court
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('live_match_scores', function (Blueprint $table) {
            $table->dropColumn(['next_team_a_id', 'next_team_b_id']);
        });
    }
};

