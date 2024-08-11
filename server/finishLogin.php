<?php
    /*  finishLogin.php
        Manages sending a user response when a user signs up, logs in or is auto-logged in
        For the game Settlers & Warlords
    */

    // This file is included where it is called. It ends the script when done
    // parameters needed:
    // playerid
    // playername
    // location
    // ajaxcode

    include_once('../generateMap.php');

    die(json_encode([
        'result'=>'success',
        'userid'=>$playerid,
        'username'=>$playername,
        'userType'=>'player',
        'location'=>$location,
        'ajaxcode'=>$ajaxcode,
        'localContent'=>loadChunk(
            floor($location[0]/8.0),
            floor($location[1]/8.0),
            floor($location[2]/8.0))
        //localContent will contain chunkx, chunky, chunkz, content
        //'localContent'=>json_decode(DanDBList("SELECT content FROM sw_mapchunk WHERE chunkx=0 AND chunky=0 AND chunkz=0;", '', [], 'server/routes/finishLogin.php->get map chunk')[0]['content'], 1)
//        'localContent'=>[
  //          'chunkcoords'=>[0,0,0],
    //        'tiles'=>json_decode($mapChunk, 1)
      //  ]
    ]));
?>