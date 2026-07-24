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
        Schema::create('tournament_standings', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedBigInteger('tournament_id');
            $table->unsignedBigInteger('tournament_category_id');
            $table->unsignedBigInteger('group_id');
            $table->unsignedInteger('game_played')->default(0);
            $table->unsignedInteger('game_won')->default(0);
            $table->unsignedInteger('game_lost')->default(0);
            $table->unsignedInteger('points')->default(0);
            $table->unsignedInteger('score_for')->default(0);
            $table->unsignedInteger('score_against')->default(0);
            $table->unsignedInteger('score_difference')->default(0);
            $table->unsignedInteger('rank')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournament_standings');
    }
};
