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
        Schema::create('live_configurations', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name'); // Match name / label
            $table->unsignedInteger('number_of_courts')->default(1); // Number of courts
            $table->enum('scoring_system', ['side-out', 'rally-point'])->default('side-out'); // Scoring system
            $table->boolean('allow_court_change')->default(false); // Allow court change
            $table->enum('court_change_trigger', ['none', 'rally-count', 'score-count', 'game-end', 'match-end'])->default('none'); // Court change trigger
            $table->unsignedTinyInteger('court_change_interval')->nullable(); // Interval for court change
            $table->unsignedInteger('status_id'); // Foreign key to statuses table
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_configurations');
    }
};

