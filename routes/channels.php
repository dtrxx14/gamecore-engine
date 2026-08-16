<?php

use App\Models\LiveConfiguration;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
| For public standings, we use a public channel pattern so no auth is needed.
|
*/

Broadcast::channel('standings.{configurationId}', function ($user, $configurationId) {
    // Public channel - anyone can listen to standings updates
    return true;
});

Broadcast::channel('courts.{configurationId}', function ($user, $configurationId) {
    // Public channel - anyone can listen to live court updates
    return true;
});

Broadcast::channel('umpires.{userId}', function ($user, $userId) {
    // Public channel - any authenticated umpire can listen to assignment updates
    return true;
});
