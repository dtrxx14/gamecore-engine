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
        Schema::create('tournament_categories', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedBigInteger('tournament_id');
            $table->string('name'); // Category name
            $table->string('division'); // Category division
            $table->text('description')->nullable(); // Category description or additional details like rules, regulations, etc.
            $table->decimal('entry_fee', 10, 2)->nullable(); // Entry fee for the category
            $table->string('currency', 3)->default('PHP'); // Currency for the entry fee
            $table->unsignedInteger('min_players')->nullable(); // Minimum number of players required for the category
            $table->unsignedInteger('max_players')->nullable(); // Maximum number of players allowed in the category
            $table->unsignedInteger('team_size')->nullable(); // Number of players per team, 1 for singles, 2 for doubles, etc.
            $table->enum('team_type', ['singles', 'doubles', 'team'])->default('doubles'); // Type of team for the category
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournament_categories');
    }
};
