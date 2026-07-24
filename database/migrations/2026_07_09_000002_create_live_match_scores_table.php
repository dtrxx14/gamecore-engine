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
        Schema::create('live_match_scores', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedBigInteger('live_configuration_id'); // FK to live_configurations
            $table->unsignedInteger('court_number'); // Court number (1, 2, 3, ...)
            $table->unsignedInteger('category_id')->nullable();
            $table->unsignedBigInteger('team_a_id')->nullable(); // Team A
            $table->unsignedBigInteger('team_b_id')->nullable(); // Team B
            $table->unsignedInteger('team_a_score')->default(0); // Team A score
            $table->unsignedInteger('team_b_score')->default(0); // Team B score
            $table->enum('serving_team', ['team_a', 'team_b'])->nullable(); // Who is serving
            $table->unsignedBigInteger('status_id'); // Status (active, paused, completed, etc.)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_match_scores');
    }
};

