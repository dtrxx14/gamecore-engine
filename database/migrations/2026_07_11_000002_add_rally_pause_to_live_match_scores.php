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
            $table->unsignedInteger('rally_count')->default(0)->after('team_b_score');
            $table->boolean('is_paused')->default(false)->after('end_play_at');
            $table->timestamp('paused_at')->nullable()->after('is_paused');
            $table->unsignedInteger('paused_remaining')->nullable()->after('paused_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('live_match_scores', function (Blueprint $table) {
            $table->dropColumn(['rally_count', 'is_paused', 'paused_at', 'paused_remaining']);
        });
    }
};

