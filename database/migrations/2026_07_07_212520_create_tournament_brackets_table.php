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
        Schema::create('tournament_brackets', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedBigInteger('tournament_id'); // Tournament ID for the bracket
            $table->unsignedBigInteger('tournament_category_id'); // Tournament category ID for the bracket
            $table->unsignedBigInteger('match_id'); // Match ID for the bracket
            $table->unsignedBigInteger('parent_match_id')->nullable(); // Parent match ID for the bracket
            $table->unsignedBigInteger('winner_to_match_id')->nullable(); // Winner to ID for the bracket
            $table->unsignedBigInteger('loser_to_match_id')->nullable(); // Loser to ID for the bracket
            $table->unsignedBigInteger('tournament_category_format_id'); // Round number for the bracket
            $table->unsignedInteger('match_order'); // Match order for the bracket
            $table->unsignedInteger('status_id'); // Status ID for the bracket Winner, Loser, Pending, Next, etc.
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournament_brackets');
    }
};
