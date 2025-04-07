<?php
    /*  save.php
        Saves game content to the server, as received by the client
        For the game Settlers & Warlords
    */

    // In many ways, this is merely a stop-gap until later, when players will be more interactive with each other. But we have to get a certain level of things working,
    // before figuring out how to do more. Building by layers, and all...

    require_once("../config.php");
    require_once("../libs/common.php");
    require_once("../globals.php");

    // Collect the real message
    require_once("../getInput.php");

    $con = verifyInput($msg, [
        ['name'=>'userid', 'required'=>true, 'format'=>'int'],
        ['name'=>'ajaxcode', 'required'=>true, 'format'=>'int'],
        ['name'=>'playerpos', 'required'=>true, 'format'=>'arrayOfFloats'],
        ['name'=>'workers', 'required'=>true, 'format'=>'array'],
        ['name'=>'tiles', 'required'=>true, 'format'=>'array'],
        ['name'=>'unlockedItems', 'required'=>true, 'format'=>'arrayOfStrings'],
        ['name'=>'structures', 'required'=>true, 'format'=>'array']
    ], 'server/routes/save.php->validate full set');

    // Validate the worker data
    JSEvery($con['workers'], function($w) {
        verifyInput($w, [
            ['name'=>'id', 'required'=>true, 'format'=>'int'],
            ['name'=>'spot', 'required'=>true, 'format'=>'arrayOfInts'],
            ['name'=>'path', 'required'=>true, 'format'=>'string'],
            ['name'=>'stepProgress', 'required'=>true, 'format'=>'float'],
            ['name'=>'carrying', 'required'=>true, 'format'=>'array'],
            ['name'=>'job', 'required'=>true, 'format'=>'array']
        ], 'server/routes/save.php->validate each worker');
        // Also validate the items list
        // We will have several places where items lists will be generated. It will be a good idea to use a function for this job
        // Items will have many possible fields; not all will be used, though.
        verifyItems($w['carrying']);
    });

    // Also validate structures... this will be based on each individual structure
    JSEvery($con['structures'], function($s) {
        switch($s['kind']) {
            case 'Rock Knapper': case 'Loggers Post': case 'Rope Maker':
                // Several structures use only the default save data
                verifyInput($s, [
                    ['name'=>'id', 'required'=>true, 'format'=>'int'],
                    ['name'=>'kind', 'required'=>true, 'format'=>'stringnotempty'],
                    ['name'=>'position', 'required'=>true, 'format'=>'arrayOfInts'],
                    ['name'=>'recipe', 'required'=>true, 'format'=>'int'],
                    ['name'=>'worker', 'required'=>true, 'format'=>'int'],
                    ['name'=>'workProgress', 'required'=>true, 'format'=>'int']
                ], 'server/routes/save.php->validate common structures');
            break;
            case 'Item Mover':
                verifyInput($s, [
                    ['name'=>'id', 'required'=>true, 'format'=>'int'],
                    ['name'=>'kind', 'required'=>true, 'format'=>'stringnotempty'],
                    ['name'=>'recipe', 'required'=>true, 'format'=>'int'],
                    ['name'=>'worker', 'required'=>true, 'format'=>'int'],
                    ['name'=>'workProgress', 'required'=>true, 'format'=>'int'],
                    ['name'=>'rotation', 'required'=>true, 'format'=>'int'],
                    ['name'=>'itemsList', 'required'=>true, 'format'=>'array']
                ], 'server/routes/save.php->validate item mover');
                // And now the items list...
                JSEvery($s['itemsList'], function($l) {
                    verifyInput($l, [
                        ['name'=>'name', 'required'=>true, 'format'=>'stringnotempty'],
                        ['name'=>'sourceCoordList', 'required'=>true, 'format'=>'array']
                    ], 'server/routes/save.php->validate items lists');
                    // The source coords list is a list of 3-int values
                    // However, it is not in an object format; instead, X, Y & Z are stored in array slots; so verifyInput won't help here.

                    // I am... not so sure how to do this effectively. I'll get back to it later.
                });
            case 'Lean To':
                verifyInput($s, [
                    ['name'=>'id', 'required'=>true, 'format'=>'int'],
                    ['name'=>'kind', 'required'=>true, 'format'=>'stringnotempty'],
                    ['name'=>'recipe', 'required'=>true, 'format'=>'int'],
                    ['name'=>'worker', 'required'=>true, 'format'=>'int'],
                    ['name'=>'workProgress', 'required'=>true, 'format'=>'int'],
                    ['name'=>'state', 'required'=>true, 'format'=>'stringnotempty']
                ], 'server/routes/save.php->validate lean to');
            break;
            default:
                reporterror('server/routes/save.php->structure detail', 'Error: structure type of '. danescape($s['kind']) .' not handled, it was not validated');
        }
    });

    // Finally, with validation finished, next is the verify the user
    $res = DanDBList("SELECT * FROM sw_player WHERE id=? AND ajaxcode=?;", 'ii', [$con['userid'], $con['ajaxcode']], 'server/routes/save.php->get player data');
    if(sizeof($res)===0) {
        ajaxreject('invaliduser', 'Sorry, your login token is expired. Please log in again');
    }
    $player = $res[0];

    // Let's start with the player data. The only real field to be concerned about is the player's position and the unlocked items list
    // Location data is received as an array of 3 ints. UnlockedItems is an array of strings
    //reporterror('server/route/save.php', 'update player '. $player['id'] .' with location '. json_encode($con['playerpos']));
    DanDBList("UPDATE sw_player SET location=?, unlockedItems=? WHERE id=?", 'ssi', [json_encode($con['playerpos']), json_encode($con['unlockedItems']), $player['id']],
              'server/routes/save.php->update player stats');
    
    // Next is workers. These each have their own records
    JSEvery($con['workers'], function ($w) use ($player) {
        DanDBList("UPDATE sw_worker SET spot=?, travelPath=?, stepProgress=?, carrying=?, job=? WHERE id=? AND playerid=?;", 'ssissii',
                  [json_encode($w['spot']), $w['path'], $w['stepProgress'], json_encode($w['carrying']), json_encode('job'), $w['id'], $player['id']],
                  'server/routes/save.php->update each worker');
    });

    // Now for the complicated part: map chunks. Not only do we need to organize the tiles for saving, but we also need to find all structures for each chunk, and add them
    // in with the chunk's update.
    // What we currently have right now is a list of tiles; We need to build this list into a list of chunks, each with tile updates
    $chunkList = [];
    for($i=0; $i<sizeof($con['tiles']); $i++) {
        $chunkx = floor($con['tiles'][$i]['x']/$chunkWidth);
        $chunky = floor($con['tiles'][$i]['y']/$chunkWidth);
        $chunkz = floor($con['tiles'][$i]['z']/$chunkWidth);
        $slot = JSFindIndex($chunkList, function($chunk) use ($chunkx, $chunky, $chunkz) {
            return $chunk['x']===$chunkx && $chunk['y']===$chunky && $chunk['z']===$chunkz;
        });
        if($slot===-1) {
            // No existing chunk was found. Add a new one to the list - with this tile attached to it
            array_push($chunkList, [
                'x'=>$chunkx, 'y'=>$chunky, 'z'=>$chunkz,
                'tiles'=>[$con['tiles'][$i]],
                'structures'=>[],
                'db'=>0
            ]);
        }else{
            // Add this to the existing entry in the chunk list
            array_push($chunkList[$slot]['tiles'], $con['tiles'][$i]);
        }
    }

    // With that done, we now need to search through the structures and add them to each chunk list, as needed
    for($i=0; $i<sizeof($con['structures']); $i++) {
        $chunkx = floor($con['structures'][$i]['position'][0]/$chunkWidth);
        $chunky = floor($con['structures'][$i]['position'][1]/$chunkWidth);
        $chunkz = floor($con['structures'][$i]['position'][2]/$chunkWidth);
        $slot = JSFindIndex($chunkList, function($chunk) use ($chunkx, $chunky, $chunkz) {
            return $chunk['x']===$chunkx && $chunk['y']===$chunky && $chunk['z']===$chunkz;
        });
        if($slot===-1) {
            // The modified tiles list did not include this structure's chunk. That's ok, we can add a new chunk to handle it
            array_push($chunkList, [
                'x'=>$chunkx, 'y'=>$chunky, 'z'=>$chunkz,
                'tiles'=>[],
                'structures'=>[$con['structures'][$i]],
                'db'=>0
            ]);
        }else{
            array_push($chunkList[$slot]['structures'], $con['structures'][$i]);
        }
    }

    // Do I need to tie the structure ID directly to the tile it's in?
    // We will have the exact location in the chunk's structure content.
    // We can load all structures in a chunk, as the chunk is loaded.
    // Do we still need IDs? Not necessarily; but we still need a player ID attached to them, as its owner.

    // Next, we need to couple each chunk's data with the database's record
    for($i=0; $i<sizeof($chunkList); $i++) {
        $chunkList[$i]['db'] = DanDBList("SELECT * FROM sw_mapchunk WHERE chunkx=? AND chunky=? AND chunkz=?;", 'iii',
                                         [$chunkList[$i]['x'], $chunkList[$i]['y'], $chunkList[$i]['z']],
                                         'server/routes/save.php->get each map chunk')[0];
        // For each chunk that has tile updates, we need to unpack the tile map so we can update the correct tiles
        if(sizeof($chunkList[$i]['tiles'])>0) {
            $tileList = json_decode($chunkList[$i]['db']['content']);
            for($t=0; $t<sizeof($chunkList[$i]['tiles']); $t++) {
                $offsetX = $chunkList[$i]['tiles'][$t]['x'] - $chunkList[$i]['x']*$chunkWidth;
                $offsetY = $chunkList[$i]['tiles'][$t]['y'] - $chunkList[$i]['y']*$chunkWidth;
                $offsetZ = $chunkList[$i]['tiles'][$t]['z'] - $chunkList[$i]['z']*$chunkWidth;
                // X is the small stretch, Z is the big one
                $slot = ($offsetZ*$chunkWidth*$chunkWidth) + ($offsetY*$chunkWidth) + $offsetX;
                // As we put this data into the array, we need to trim unnecessary variables, such as the coords
                // Also remember that we have short-handed variable names, and use IDs for tile types.
                //reporterror('server/routes/save.php->add tile to chunk', 'structure here? '. array_key_exists('s', $chunkList[$i]['tiles'][$t]));
                if(array_key_exists('s', $chunkList[$i]['tiles'][$t])) {
                    reporterror('server/routes/save.php->add tile to chunk', 'structure? key exists');
                }else{
                    reporterror('server/routes/save.php->add tile to chunk', 'structure? key not found');
                }
                $tileList[$slot] = [
                    'h'=>$chunkList[$i]['tiles'][$t]['h'],  // tile health
                    't'=>$chunkList[$i]['tiles'][$t]['t'],  // tile type
                    'f'=>$chunkList[$i]['tiles'][$t]['f'],  // floor type
                    'i'=>$chunkList[$i]['tiles'][$t]['i'],  // items list
                    //'s'=>(array_key_exists('s', $chunkList[$i]['tiles'][$t])?
                    //    $chunkList[$i]['tiles'][$t]['s']:-1),  // structure ID
                ];
            }
            // Now, do the same for each of the structures. Unlike tiles, new structures can be added, and old structures can be removed.
            // Also, we are receiving the entire list of machines in each save cycle, so any removed machines will no longer be sent to the server.
            // We can simply apply the list we received directly to the database... even if it's empty

            // We should be ready to save now
            DanDBList("UPDATE sw_mapchunk SET content=?, structures=? WHERE chunkx=? AND chunky=? AND chunkz=?;", 'ssiii', 
                      [json_encode($tileList), json_encode($chunkList[$i]['structures']), $chunkList[$i]['x'], $chunkList[$i]['y'], $chunkList[$i]['z']],
                      'server/routes/save.php->save chunk with tile updates');
        }else{
            // If no tiles were modified, but structures were, we will update the chunk a different way
            DanDBList("UPDATE sw_mapchunk SET structures=? WHERE chunkx=? AND chunky=? AND chunkz=?;", 'siii',
                      [json_encode($chunkList[$i]['structures']), $chunkList[$i]['x'], $chunkList[$i]['y'], $chunkList[$i]['z']],
                      'server/routes/save.php->save chunk without tile updates');
        }
    }

    

    die(json_encode(['result'=>'success']));

    function verifyItems($itemsList) {
        JSEvery($itemsList, function($i) {
            verifyInput($itemsList, [
                ['name'=>'name', 'required'=>true, 'format'=>'stringnotempty'],
                ['name'=>'endurance', 'required'=>false, 'format'=>'float'],
                ['name'=>'efficiency', 'required'=>false, 'format'=>'float']
            ]);
        });
    }
?>