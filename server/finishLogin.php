<?php /*
    finishLogin.php
    Handles generating a message to send to the user, containing all the data needed to display the local map
    For the game Settlers & Warlords
*/

// This file is included where it is to be called
// parameters needed:
// $playerid - ID of the player to show data for
// $playerx  - X coordinate of the world map this player is at
// $playery  - Y coordinate of the world map this player is at
// $ajaxcode - ajax code that is passed to the client

require_once("globals.php");

$worldTile = DanDBList("SELECT * FROM sw_map WHERE x=? AND y=?;", 'ii', [$playerx,$playery],
                       'server/routes/signup.php->get world map data for response')[0];
$localTiles = DanDBList("SELECT x,y,landtype,buildid,newlandtype,items FROM sw_minimap WHERE mapid=? ORDER BY y,x;", 'i',
                        [$worldTile['id']], 'server/routes/signup.php->get local map tiles');
die(json_encode([
    'result'  =>'success',
    'userid'  =>$playerid,
    'userType'    =>'player',
    'ajaxcode'    =>$ajaxcode,
    'localContent'=>[
        'biome'     =>$biomeData[$worldTile['biome']]['biome'],
        'ugresource'=>$oreTypes[$worldTile['ugresource']],
        'ugamount'  =>$worldTile['ugamount'],
        'population'=>$worldTile['population']
    ],
    'localTiles'=>$localTiles,
    'structures'    => json_decode($worldTile['blocks'], true),
    'workers'       => json_decode($worldTile['workers'], true),
    'tasks'         => json_decode($worldTile['tasks'], true),
    'unlockedItems' => json_decode($worldTile['unlockeditems'], true),
    'tasks'         => json_decode($worldTile['tasks'], true)
    //'foodCounter'   => $worldTile['foodCounter']
]));

// 14 + 1/8" = 14.125"
// a^2 + b^2 = c^2
// c = sqrt(a^2 + b^2)
// c = sqrt(14.0125^2 + 14.0125^2)
// c = sqrt(199.515 + 199.515)
// c = sqrt(399.031)
// c = 19.9757" = 19 + 31/32

?>
