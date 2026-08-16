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
        Schema::create('live_standings', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedBigInteger('live_configuration_id');
            $table->unsignedInteger('category_id');
            $table->unsignedBigInteger('team_id');
            $table->unsignedInteger('matches_played')->default(0);
            $table->unsignedInteger('wins')->default(0);
            $table->unsignedInteger('losses')->default(0);
            $table->unsignedInteger('points_for')->default(0);
            $table->unsignedInteger('points_against')->default(0);
            $table->integer('point_differential')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_standings');
    }
};

