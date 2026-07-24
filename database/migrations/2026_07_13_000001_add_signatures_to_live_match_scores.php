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
            $table->longText('team_a_signature')->nullable()->after('paused_remaining');
            $table->longText('team_b_signature')->nullable()->after('team_a_signature');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('live_match_scores', function (Blueprint $table) {
            $table->dropColumn(['team_a_signature', 'team_b_signature']);
        });
    }
};
