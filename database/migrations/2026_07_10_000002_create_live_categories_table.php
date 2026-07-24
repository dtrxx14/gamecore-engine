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
        Schema::create('live_categories', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedBigInteger('live_configuration_id');
            $table->string('name'); // e.g. "Men's Singles", "Women's Doubles"
            $table->unsignedInteger('game_to')->default(21);
            $table->string('game_time')->nullable(); // Duration per game
            $table->string('game_interval')->nullable(); // Interval between games
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_categories');
    }
};

