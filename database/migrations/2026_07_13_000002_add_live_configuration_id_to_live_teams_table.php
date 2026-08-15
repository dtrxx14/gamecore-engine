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
        Schema::table('live_teams', function (Blueprint $table) {
            $table->unsignedInteger('live_configuration_id')->nullable()->after('id'); // Foreign key to live_configurations table
            $table->index('live_configuration_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('live_teams', function (Blueprint $table) {
            $table->dropIndex(['live_configuration_id']);
            $table->dropColumn('live_configuration_id');
        });
    }
};
