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
        Schema::create('tournament_team_members', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedBigInteger('tournament_registration_id');
            $table->string('name')->nullable(); // Team name
            $table->unsignedBigInteger('group_id'); // Group ID for registration
            $table->unsignedBigInteger('user_id'); // Player user id
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournament_team_members');
    }
};
