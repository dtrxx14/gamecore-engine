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
        Schema::create('live_teams', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name'); // Team name
            $table->unsignedInteger('category_id')->nullable();
            $table->json('player_ids')->nullable(); // Array of user IDs in the team
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_teams');
    }
};

