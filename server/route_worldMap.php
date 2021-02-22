<?php
    /*  route_worldmap.php
        Handles all commands from the client related to the world map
        for the game Settlers & Warlords
    
    Currently we don't have anything here yet. We had UpdateKnownMap, but that was already declared in usermap.php (as a different name)
    */

    function route_getWorldMap($msg) {
        // Handles sending world map data to the user (as they understand it).

        global $civData;

        // Verify input data
        $con = verifyInput($msg, [
            ['name'=>'userid', 'required'=>true, 'format'=>'posint'],
            ['name'=>'access', 'required'=>true, 'format'=>'int'],
        ], 'server/route_worldmap.php->route_getWorldMap()->verify input');
        verifyUser($con);

        // We don't really need any data from the client side. But we still need the player's record, to know where they're located
        $user = DanDBList("SELECT * FROM sw_player WHERE id=?;", 'i', [$con['userid']],
                          'server/route_worldMap.php->route_getWorldMap()->get user record')[0];
        
        // The map data the player sees is based on knownMap content, not actual world map data.
        // But since the player is viewing all the world map data, we should update the stats here; namely the population.
        // So we're going to need the world map tile data anyway
        $worldTile = DanDBList("SELECT * FROM sw_map WHERE x=? AND y=?;", 'ii', [$user['currentx'], $user['currenty']],
                               'server/route_worlMap.php->route_getWorldMap()->get world data for knownmap update')[0];
        worldMap_updateKnown($con['userid'], $user['currentx'], $user['currenty'], "NOW()", $con['userid'], 1, $worldTile['population']);

        // With that done, all we need is all the map data to send back to the user
        // Later, we may need to limit our initial grab, but we'll worry about that then
        die(json_encode([
            'result'=>'success',
            'currentx'=>$user['currentx'],
            'currenty'=>$user['currenty'],
            'worldmap'=>
                array_map(function($tile) use ($civData) {
                    // For civs that are on the map, we need to append some data to this tile
                    if($tile['civ']!==-1 && $tile['owner']==0) {
                        $tile['civ'] = JSFind($civData, function($single) use ($tile) {
                            return $single['id']===$tile['civ'];
                        });
                    }
                    return $tile;
                }, DanDBList("SELECT * FROM sw_knownmap WHERE playerid=?", 'i', [$con['userid']],
                             'server/route_worldmap.php->route_getWorldMap()->get all known map'))
        ]));
    }

    function route_startWorldAction($msg) {
        // Allows players to send colonists to perform tasks at other tile locations

        global $worldBiomes; // Odd, all we need from this is the array's size

        //reporterror('server/route_worldmap.php->route_startWorldAction', 'first of $worldBiomes='. $worldBiomes[0]);

        // Verify input data
        $con = verifyInput($msg, [
            ['name'=>'userid', 'required'=>true, 'format'=>'posint'],
            ['name'=>'access', 'required'=>true, 'format'=>'int'],
            ['name'=>'x', 'required'=>true, 'format'=>'int'],
            ['name'=>'y', 'required'=>true, 'format'=>'int'],
            ['name'=>'command', 'required'=>true, 'format'=>'stringnotempty'],
            ['name'=>'members', 'required'=>true, 'format'=>'posint'],
            ['name'=>'items', 'required'=>true, 'format'=>'array']
        ], 'server/route_worldMap.php->route_startWorldAction()->verify input');
        verifyUser($con);
        // Everything else will be left to the specific command

        // We also need to verify the inputs of the items. A single verifyInput call can't manage the contents of an array, but we can
        // process it to get results anyway
        $con['items'] = array_map(function($ele) {
            return verifyInput($ele, [
                ['name'=>'name', 'required'=>true, 'format'=>'stringnotempty'],
                ['name'=>'amount', 'required'=>true, 'format'=>'posint'],
                ['name'=>'isFood', 'required'=>true, 'format'=>'int']
            ], 'server/route_worldMap.php->route_startWorldAction()->verify items in input');
        }, $con['items']);

        switch($con['command']) {
            case 'expedition':
                // This is our first journey into a new land. What will we find!? Will they survive to return home? We don't know!
                // We will basically create an event here, and everything will be determined from that

                // We also need to calculate the time needed for units to get there. That will need the user's current location
                $player = DanDBList("SELECT * FROM sw_player WHERE id=?;", 'i', [$con['userid']],
                                    'server/route_worldMap.php->route_startWorldAction()->case expedition->get player coords')[0];
                $secsNeeded = 300 * manhattanDistance($player['currentx'], $player['currenty'], $con['x'], $con['y']);

                // We also need to get the map ID, instead of the world coordinates
                $worldMapId = DanDBList("SELECT * FROM sw_map WHERE x=? AND y=?;", 'ii', [$con['x'], $con['y']],
                                        'server/route_worldMap.php->route_startWorldAction()->case expedition->get worldmap tile id')[0]['id'];
                
                // Get the map ID of the current location
                $curMapTile = DanDBList("SELECT * FROM sw_map WHERE x=? AND y=?;", 'ii', [$player['currentx'], $player['currenty']],
                                        'server/route_worldMap.php->route_startWorldAction()->case expedition->get current map id')[0];
                // Update all the current items to current time, so everything is accurate
                advanceProcesses($curMapTile, "NOW()");
                // Reduce the population here, and then update all processes
                $curMapTile['population']-= $con['members'];
                updateProcesses($curMapTile, "NOW()");

                // Remove the items being used for the journey from the map's record
                $curMapTile['items'] = json_encode(
                    array_map(function($ele) use ($con) {
                        // Find the index in $con['items'] with the matching item name
                        $slot = JSFindIndex($con['items'], function($inner) use ($ele) {
                            return $inner['name'] === $ele['name'];
                        });
                        if($slot==null) return $ele;    // This item wasn't found; it was not modified. Return as normal
                        $ele['amount'] -= $con['items'][$slot]['amount'];
                        return $ele;
                    }, json_decode($curMapTile['items'], true))
                );

                // Update the local map record with the missing items
                DanDBList("UPDATE sw_map SET population=?, items=?, processes=? WHERE id=?;", 'issi',
                          [$curMapTile['population'], $curMapTile['items'], $curMapTile['processes'], $curMapTile['id']],
                          'server/route_worldMap.php->route_startWorldAction()->case expedition->save map after items removal');

                // All we really need to do from here is create the event
                createEvent(
                    $con['userid'],
                    $worldMapId,
                    'Expedition',
                    json_encode([
                        'travellers'=>$con['members'],
                        'fromTile'=>$curMapTile['id'],
                        'fromX'=>$player['currentx'],
                        'fromY'=>$player['currenty'],
                        'items'=>$con['items']
                    ]),
                    'NOW()',
                    $secsNeeded,
                    1
                );

                // Next, update the user's known map to show the tile as being explored
                worldMap_updateKnown($con['userid'], $con['x'], $con['y'], 'NOW()', 0,-1,0,sizeof($worldBiomes));

                // Now, send a response to the client. Because the changes are expected, we can have tha client update the world map content
                // However, we will need to send a time point when we expect to update the map
                die(json_encode(['result'=>'success', 'nextUpdate'=>$secsNeeded*2+60]));
        }
    }

    function manhattanDistance($x1,$y1,$x2,$y2) {
        // Computes a manhattan distance value between two points on a map
        return abs($x1-$x2) + abs($y1-$y2);
    }
?>