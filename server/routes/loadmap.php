<?php
    /*  loadmap.php
        Manages sending map content to a player. If the target map content is missing, it will be generated first
        For the game Settlers & Warlords
    */

    require_once("../config.php");
    require_once("../libs/common.php");
    require_once("../generateMap.php");
    
    // Start with collecting the data
    require_once("../getInput.php");

    // Validate input
    $con = verifyInput($msg, [
        ['name'=>'userid', 'required'=>true, 'format'=>'posint'],
        ['name'=>'ajaxcode', 'required'=>true, 'format'=>'posint'],
        ['name'=>'chunkList', 'required'=>true, 'format'=>'array'] // We are unable to check array content except individually; we'll do that as we go
    ], 'sever/routes/loadmap.php->verify input lvl1');

    if(sizeof($con['chunkList'])>10) {
        ajaxreject('badinput', 'Chunks loaded per request has been limited to 10 to avoid over-burdening the server');
    }

    // For now, let's validate the user's access
    $res = DanDBList("SELECT * FROM sw_player WHERE id=? AND ajaxcode=?;", 'ii', [$con['userid'], $con['ajaxcode']],
                     'server/routes/loadmap.php->validate user');
    if(sizeof($res)===0) {
        // No player data was found
        ajaxreject('invaliduser', 'Sorry, your login token is expired. Please log in again');
    }
    
    // From the Chunk List, we should have an array of arrays, each inner array holding an x, y & z value, nothing else. We will generate a list of data points from this
    $pack = [];
    for($i=0; $i<sizeof($con['chunkList']); $i++) {
        //verifyInput($con['chunkList'][$i], ['name'=>''])
        if(!(is_int($con['chunkList'][$i][0]) && is_int($con['chunkList'][$i][1]) && is_int($con['chunkList'][$i][2]))) {
            // There was a problem with this data.
            ajaxreject('badinput', 'Incorrectly formatted array');
        }

        array_push($pack, loadChunk($con['chunkList'][$i][0], $con['chunkList'][$i][1], $con['chunkList'][$i][2]));
    }

    // With our data package created, we can respond to the client
    die(json_encode(['result'=>'success', 'chunks'=>$pack]));
?>