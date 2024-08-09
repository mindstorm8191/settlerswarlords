<?php
    /*  loadmap.php
        Manages sending map content to a player. If the target map content is missing, it will be generated first
        For the game Settlers & Warlords
    */

    require_once("../config.php");
    require_once("../libs/common.php");
    
    // Start with collecting the data
    require_once("../getInput.php");

    // Validate input
    $con = verifyInput($msg, [
        ['name'=>'userid', 'required'=>true, 'format'=>'posint'],
        ['name'=>'ajaxcode', 'required'=>true, 'format'=>'posint'],
        ['name'=>'chunkList', 'required'=>true, 'format'=>'array'] // We are unable to check array content except individually; we'll do that as we go
    ], 'sever/routes/loadmap.php->verify input lvl1');

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

        // Grab the target chunk from the database
        reporterror('server/routes/loadmap.php->find existing chunk', 'chunk '. $i .' coords=['. $con['chunkList'][$i][0] .','. $con['chunkList'][$i][1] .','. $con['chunkList'][$i][2] .']');
        $pick = DanDBList("SELECT * FROM sw_mapchunk WHERE chunkx=? AND chunky=? AND chunkz=?;", 'iii', [$con['chunkList'][$i][0], $con['chunkList'][$i][1], $con['chunkList'][$i][2]],
                          'server/routes/loadmap.php->fetch chunk');
        if(sizeof($pick)===0) {
            // Oh dear, we didn't find the target chunk... probably because it doesn't exist yet. No matter, we'll generate it now
            // what we generate will be based on the chunk's vertical location
            if($con['chunkList'][$i][1]<0) {
                $fullMap = forrange(0,7,1, function($z) {
                    return forrange(0,7,1, function($y) use ($z) {
                        return forrange(0,7,1, function($x) use ($y,$z) {
                            return 'air';
                        });
                    });
                });
            }else if($con['chunkList'][$i][1]>0) {
                $fullMap = forrange(0,7,1, function($z) {
                    return forrange(0,7,1, function($y) use ($z) {
                        return forrange(0,7,1, function($x) use ($y,$z) {
                            return 'rock';
                        });
                    });
                });
            }else{
                $fullMap = forrange(0,7,1, function($z) {
                    return forrange(0,7,1, function($y) use ($z) {
                        return forrange(0,7,1, function($x) use ($y,$z) {
                            if($y>4) return 'air';
                            if($y<4) return 'dirt';
                            return 'grassydirt';
                        });
                    });
                });
            }
            $tileConversion = ['air','dirt','grassydirt','rock','water','fire','wood'];
            $flatMap = [];
            for($z=0; $z<=7; $z++) {
                for($y=0; $y<=7; $y++) {
                    for($x=0; $x<=7; $x++) {
                        $slot = JSFindIndex($tileConversion, function($i) use ($fullMap, $x, $y, $z) {
                            return $i===$fullMap[$z][$y][$x];
                        });
                        array_push($flatMap, ['t'=>$slot, 'h'=>100]);
                    }
                }
            }

            // With the flat map made, we can save it to the database
            DanDBList("INSERT INTO sw_mapchunk (chunkx,chunky,chunkz,content) VALUES (?,?,?,?);", 'iiis',
                      [$con['chunkList'][$i][0], $con['chunkList'][$i][1], $con['chunkList'][$i][2], json_encode($flatMap)],
                      'server/routes/loadmap.php->save new tile content');
            // We also need to push this content onto our output value, in the same format that we would receive from the database
            array_push($pack, ['chunkx'=>$con['chunkList'][$i][0], 'chunky'=>$con['chunkList'][$i][1], 'chunkz'=>$con['chunkList'][$i][2], 'content'=>json_encode($flatMap)]);
        }else{
            array_push($pack, $pick[0]);
        }
    }

    // With our data package created, we can respond to the client
    die(json_encode(['result'=>'success', 'chunks'=>$pack]));
?>