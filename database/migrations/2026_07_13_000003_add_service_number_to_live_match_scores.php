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
            // Which server within the serving team is currently serving (1 or 2).
            // In side-out (pickleball) scoring, the game starts at 0-0-2 (2nd server).
            $table->unsignedTinyInteger('service_number')->default(1)->after('serving_team');
            // Whether the one-time court change has already been performed for a side-out match.
            $table->boolean('court_change_done')->default(false)->after('service_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
Schema::table('live_match_scores', function (Blueprint $table) {
            $table->dropColumn(['service_number', 'court_change_done']);
        });
    }
};
