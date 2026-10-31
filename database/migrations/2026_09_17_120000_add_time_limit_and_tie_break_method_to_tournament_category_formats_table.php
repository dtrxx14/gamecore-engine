<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tournament_category_formats', function (Blueprint $table): void {
            $table->unsignedInteger('game_time')->nullable()->after('win_by');
            $table->string('tie_break_method')->default('rally')->after('game_time');
        });
    }

    public function down(): void
    {
        Schema::table('tournament_category_formats', function (Blueprint $table): void {
            $table->dropColumn(['game_time', 'tie_break_method']);
        });
    }
};
