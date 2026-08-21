<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('live_categories', function (Blueprint $table) {
            $table->unsignedInteger('win_by')->default(1)->after('game_to');
        });
    }

    public function down(): void
    {
        Schema::table('live_categories', function (Blueprint $table) {
            $table->dropColumn('win_by');
        });
    }
};
