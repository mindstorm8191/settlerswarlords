<?php
    /*  worldmap.php
        Sends world map data to the user, based only on what data they can actually see
        For the game Settlers & Warlords
    */

    require_once("../config.php");
    require_once("../libs/common.php");
    require_once("../libs/jsarray.php");
    require_once("../events.php");

    // Collect the message
    require_once("../getInput.php");

    processEvents();

    // Verify the input. We should only have the username and ajax code
    $con = verifyInput($msg, [
        ['name'=>'userid',   'required'=>true, 'format'=>'posint'],
        ['name'=>'ajaxcode', 'required'=>true, 'format'=>'int'],
    ], 'server/routes/worldmap.php->verify input');

    // Now, verify the user
    $res = DanDBList("SELECT * FROM sw_player WHERE id=? AND ajaxcode=?;", 'ii', [$con['userid'], $con['ajaxcode']],
                     'server/routes/worldmap.php->get player record');
    if(sizeof($res)===0) {
        // No player data was found
        ajaxreject('invaliduser', 'Sorry, your login token is expired. Please log in again');
    }
    $player = $res[0];  // This will tell us which worldmap tile to update

    // All we really need to do is to send the known map content for this user to the client
    $group = DanDBList("SELECT x,y,lastcheck,owner,civ,population,biome FROM sw_knownmap WHERE playerid=?;", 'i', [$player['id']],
                       'server/routes/worldmap.php->collect data');                       
    // That should be all we need... for now
    die(json_encode([
        'result'=>'success',
        'playerx'=>$player['currentx'],
        'playery'=>$player['currenty'],
        'worldtiles'=>$group
    ]));
?>