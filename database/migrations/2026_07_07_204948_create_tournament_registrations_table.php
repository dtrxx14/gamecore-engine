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
        Schema::create('tournament_registrations', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedBigInteger('tournament_id'); // Tournament ID for the registration
            $table->unsignedBigInteger('tournament_category_id'); // Tournament category ID for the registration
            $table->unsignedBigInteger('group_id'); // Group ID for team registrations on Team Group ID
            $table->unsignedBigInteger('status_id'); // Registration status (0: Pending, 1: Approved, 2: Rejected)
            $table->unsignedBigInteger('payment_status_id')->default(0); // Payment status for the registration (0: Pending, 1: Paid, 2: Refunded)
            $table->string('reference_number')->unique(); // Unique reference number for the registration
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournament_registrations');
    }
};
