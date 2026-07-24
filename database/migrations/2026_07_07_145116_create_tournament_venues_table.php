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
        Schema::create('tournament_venues', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedBigInteger('tournament_id');
            $table->string('name'); // Venue name
            $table->string('address'); // Venue address
            $table->string('pin_location')->nullable(); // Pin location for the venue (optional)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournament_venues');
    }
};
