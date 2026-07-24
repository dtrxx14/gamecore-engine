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
        Schema::create('player_information', function (Blueprint $table) {
            $table->increments('id');

            $table->unsignedBigInteger('user_id')->unique();

            $table->string('profile_image')->nullable();

            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');

            $table->string('contact_number')->unique()->nullable();

            $table->string('club')->nullable();

            $table->string('gender')->nullable();
            $table->date('birthdate')->nullable();
            
            $table->unsignedBigInteger('nationality_id')->nullable();
            $table->unsignedBigInteger('state_province_id')->nullable();

            $table->string('dupr_account')->unique()->nullable();

            $table->text('bio')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('player_information');
    }
};
