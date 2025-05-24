<?php
    /*  finishLogin.php
        Manages sending a user response when a user signs up, logs in or is auto-logged in
        For the game Settlers & Warlords
    */

    // This file is included where it is called. It ends the script when done
    // parameters needed:
    // playerid
    // playername
    // location. This should be an array of 3 ints (not as json content)
    // unlockeditems. This should be an array of item names (also not as json)
    // ajaxcode

    include_once('../generateMap.php');

    die(json_encode([
        'result'=>'success',
        'userid'=>$playerid,
        'username'=>$playername,
        'userType'=>'player',
        'location'=>$location,
        'ajaxcode'=>$ajaxcode,
        'localContent'=>loadChunk(floor($location[0]/8.0), floor($location[1]/8.0), floor($location[2]/8.0)),
        'unlockeditems'=>$unlockeditems,
        'workers'=>DanDBList('SELECT * FROM sw_worker WHERE playerid=?;', 'i', [$playerid], 'server/finishLogin.php->get workers')
    ]));
?>


