<?php
    /*  finishLogin.php
        Handles generating a message to send to the user, containing all the data needed to display the local map
        For the game Settlers & Warlords
    */

    // This file is included where it is called. It ends the script when done
    // parameters needed:
    // $playerid - ID of the player to show data for
    // $playerx - X coordinate of where the player is at
    // $playery - Y coordinate of where the player is at
    // $ajaxcode - ajax code that is passed to the client

    require_once("globals.php");

    // We were including UG resource info here, but I think that shouldn't be shared with the client side until workers are able to begin mining
    $worldTile = DanDBList("SELECT id,biome,population,name,structures,workers,unlockeditems,tasks,foodCounter,localmaptick FROM sw_map WHERE x=? AND y=?;",
                           'ii', [$playerx, $playery], 'server/finishLogin.php->get world map data')[0];
    $localTiles = DanDBList("SELECT x,y,landtype,originalland,items,structureid FROM sw_minimap WHERE mapid=? ORDER BY y,x;", 'i',
                            [$worldTile['id']], 'server/finishLogin.php->get local map tiles');

    die(json_encode([
        'result'=>'success',
        'userid'=>$playerid,
        'userType'=>'player',
        'ajaxcode'=>$ajaxcode,
        'localContent'=>[
            'biome'=>$biomeData[$worldTile['biome']]['biome'],
            'population'=>$worldTile['population']
        ],
        'localTiles'=>$localTiles,
        'structures'=> json_decode($worldTile['structures'], true),
        'workers'=> json_decode($worldTile['workers'], true),
        'tasks'=> json_decode($worldTile['tasks'], true),
        'unlockedItems'=> json_decode($worldTile['unlockeditems'], true),
        'localmaptick'=>$worldTile['localmaptick']
    ]));
    // I think there are more variables to pass to the client, but they haven't been created yet!
?>


