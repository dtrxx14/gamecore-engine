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
        Schema::table('live_standings', function (Blueprint $table) {
            $table->unsignedInteger('court_number')->nullable()->after('team_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('live_standings', function (Blueprint $table) {
            $table->dropColumn('court_number');
        });
    }
};
