<?php
    /*  route_localMap.php
        Handles all client commands related to the user's local map
        for the game Settles & Warlords
    */

    function route_addBuilding($msg) {
        // Allows the user to add a new building to the local map

        global $db;
        global $userid;

        $con = verifyInput($msg, [
            ["name"=>"userid", "required"=>true, 'format'=>'posint'],
            ['name'=>'access', 'required'=>true, 'format'=>'int'],
            ['name'=>'name', 'required'=>true, 'format'=>'stringnotempty'],
            ['name'=>'localx', 'required'=>true, 'format'=>'posint'],
            ['name'=>'localy', 'required'=>true, 'format'=>'posint']
        ], 'server/route_localMap.php->route_addBuilding->verify input');
        verifyUser($con);

        // We need to get the player's world X & Y coordinates to start with
        $playerPos = DanDBList("SELECT currentx, currenty FROM sw_player WHERE id=?;", 'i', [$userid],
                               'server/route_localMap.php->route_addBuilding()->get player coords')[0];

        // Next, verify the player owns this land. We can pick up the world map tile's ID while we do this
        $worldMapSquare = DanDBList("SELECT * FROM sw_map WHERE x=? AND y=?;", 'ii', [$playerPos['currentx'], $playerPos['currenty']],
                                    'server/route_localMap.php->route_addBuilding()->get world map data')[0];
        if($worldMapSquare['owner']!=$userid) {
            reporterror('server/route_localMap.php->route_addBuilding()->get world map data',
                        'User id='. $userid .' tried to add building to land they dont own. Map data: '. json_encode($worldMapSquare));
            ajaxreject('badinput', 'The player does not have ownership of this land');
        }

        // Next, verify that there is no (blocking) structure at this location on the local map
        $localMapSquare = DanDBList("SELECT * FROM sw_minimap WHERE mapid=? AND x=? AND y=?;", 'iii',
                                    [$worldMapSquare['id'], $con['localx'], $con['localy']],
                                    'server/route_localMap.php->route_addBuilding()->get local map data')[0];
        if($localMapSquare['buildid']!=0) {
            // Later on, we will add additional checks to see if this is a non-blocking structure (aka concrete floor or roof).
            // For now, reject out-right
            ajaxreject('badinput', 'There is already a building at this location');
        }

        // Now, we need data about the building type to be added.
        $res = DanDBList("SELECT * FROM sw_structuretype WHERE name=? AND devlevel=1 AND fortlevel=1;", 's', [$con['name']],
                         'server/route_localMap.php->route_addBuilding()->get building type details');
        if(sizeof($res)===0) ajaxreject('badinput', 'Error: structure type (name='. $con['name'] .') does not exist.');
        $buildType = $res[0];

        // At this point, we need to determine resource consumption for building this structure.
        // However we don't yet have any structures that need resources

        // We can now create this building, so that we can work with it.
        DanDBList("INSERT INTO sw_structure (buildtype, devlevel, fortlevel, worldmapid, localx, localy, detail) VALUES (?,1,1,?,?,?,?);",
                  'iiiis', [$buildType['id'], $worldMapSquare['id'], $localMapSquare['x'], $localMapSquare['y'], ''],
                  'server/route_localMap.php->route_addBuilding()->create new structure instance');
        $structureId = mysqli_insert_id($db);
        // Now update the minimap
        DanDBList("UPDATE sw_minimap SET buildid=? WHERE mapid=? AND x=? AND y=?;", 'iiii',
                  [$structureId, $worldMapSquare['id'], $localMapSquare['x'], $localMapSquare['y']],
                  'server/route_localMap.php->route_addBuilding()->update local tile');
        
        // We can now add a new event to trigger when the building has been completed - that is, if the building requires construction time
        if($buildType['buildtime']>0) {
            createEvent(0, $worldMapSquare['id'], 'BuildingUpgrade', json_encode(['buildid'=>$structureId]), "NOW()", $buildType['buildtime'], 0);
            // Note that even when buildings are under construction, we can increase their levels now. However, buildings under construction
            // cannot be used, so it won't really matter anyway
        }
        
        // To send data back, we have a function getSquareInfo, which collects data for a single tile. We already use this
        // when logging in. We can use it here too - but we have to include the building ID within the record first.
        $localMapSquare['buildid'] = $structureId;

        $localMapSquare = localMap_GetSquareInfo($localMapSquare, $worldMapSquare);

        // Now we're ready to send a reply
        die(json_encode([
            "result"=>"success",
            "newmaptile"=>$localMapSquare
        ]));
    }

    function route_addProcess($msg) {
        // Allows a user to start a process for a building action.

        global $userid;

        // Start by sanitizing the input
        $con = verifyInput($msg, [
            ["name"=>"userid", "required"=>true, 'format'=>'posint'],
            ['name'=>'access', 'required'=>true, 'format'=>'int'],
            ['name'=>'buildid', 'required'=>true, 'format'=>'posint'],
            ['name'=>'process', 'required'=>true, 'format'=>'stringnotempty'],
            ['name'=>'workers', 'required'=>true, 'format'=>'posint'],
            ['name'=>'tomake', 'required'=>true, 'format'=>'int']
        ], 'server/route_localMap.php->route_AddProcess->verify input');
        verifyUser($con);

        // Start by collecting some data. We have the building ID, but need to verify the user owns the land here
        $res = DanDBList("SELECT * FROM sw_structure WHERE id=?;", 'i', [$con['buildid']],
                         'server/route_localMap.php->route_AddProcess->get building data');
        if(sizeof($res)===0) ajaxreject('badinput', 'There is no building with id='. $con['buildid']);
        $building = $res[0];
        $minimapSquare = DanDBList("SELECT * FROM sw_minimap WHERE buildid=?;", 'i', [$con['buildid']],
                                   'server/route_localMap.php->route_AddProcess->get minimap data')[0];
        $worldMapSquare = DanDBList("SELECT * FROM sw_map WHERE id=?;", 'i', [$minimapSquare['mapid']],
                                    'server/route_localMap.php->route_AddProcess->get world map data')[0];
        if($worldMapSquare['owner']!=$userid) ajaxreject('badinput', 'You do not have ownership of this land');

        // Now, find the action we need based on the name
        $res = DanDBList("SELECT * FROM sw_structureaction WHERE name=?;", 's', [$con['process']],
                         'server/route_localMap.php->route_AddProcess->get action information');
        if(sizeof($res)===0) ajaxreject('badinput', 'There is no action with name='. $con['process']);
        $action = $res[0];
        if($action['buildType']!==$building['buildtype']) ajaxreject('badinput', 'The building selected does not support the action selected');

        // Before creating the process, update resource times of all items to current
        $worldMapSquare = advanceProcesses($worldMapSquare, 'NOW()');

        // Create the process
        DanDBList("INSERT INTO sw_process (mapid, buildingid, actionid, timeBalance, globalEffect, workers) VALUES (?,?,?,NOW(),0,?);", 'iiii',
                  [$minimapSquare['mapid'], $con['buildid'], $action['id'], $con['workers']],
                  'server/route_localMap.php->route_AddProcess->add process');
        
        // Now, ensure that this map tile has the appropriate items listed in the correct place. We need to ensure that these items
        // don't already exist in the map's items list
        $existing = json_decode($worldMapSquare['items'], true);
        $newItems = [];
        if($action['inputGroup']!='') {
            $news = json_decode($action['inputGroup'], true);
            foreach($news as $none) {
                array_push($newItems, $none);
            } unset($none);
        }
        if($action['outputGroup']!='') {
            $news = json_decode($action['outputGroup'], true);
            foreach($news as $none) {
                array_push($newItems, $none);
            } unset($none);
        }
        // This isn't really needed here, but we need to debug this operation
        //DanDBList("UPDATE sw_map SET items=? WHERE id=?;", 'si', [json_encode($newItems), $worldMapSquare['id']],
        //          'route_localMap.php->route_addProcess()->save items for debug review');
        
        // Filter out the items we already have instances of
        $newItems = array_filter($newItems, function($ele) use ($existing) {
            return !JSSome($existing, function($exist) use ($ele) {
                return $exist['name']===$ele['name'];
            });
        });
        // Push the rest of the new items into the list, while mapping them into the correct structure
        if(sizeof($newItems)>0) {
            array_push($existing, ...array_map(function($ele) {
                return [
                    'name'=>$ele['name'],
                    'amount'=>0,
                    //'production'=>0,
                    'isFood'=>$ele['isFood']
                    //'inputs'=>($action['inputGroup']=='')?[]:json_decode($action['inputGroup'], true),
                    //'outputs'=>($action['outputGroup']=='')?[]:json_decode($action['outputGroup'], true)
                ];
            }, $newItems));
        }
        $worldMapSquare['items'] = json_encode($existing);

        // Next, add this process to the list of processes 
        $processes = json_decode($worldMapSquare['processes'], true);
        if(gettype($processes)==="NULL") $processes = [];
        array_push($processes, [
            'id'=>JSNextId($processes, 'id'),
            'name'=>$action['name'],
            'buildingId'=>$con['buildid'],
            'actionId'=>$action['id'],
            'cycleTime'=>$action['cycleTime'],
            'workers'=>$con['workers'],
            'priority'=>1,
            'inputGroup'=>json_decode($action['inputGroup'], true),
            'outputGroup'=>json_decode($action['outputGroup'], true)
        ]);
        $worldMapSquare['processes'] = json_encode($processes);

        reporterror('server/route_localMap.php->route_AddProcess()->after process addition', 'new process list='. json_encode($processes));
        // Now, calculate the production rates of all items
        $worldMapSquare = updateProcesses($worldMapSquare, "NOW()");
        // With updates to the worldmap complete, we need to save the updated content
        DanDBList("UPDATE sw_map SET items=?, processes=?, resourceTime=NOW() WHERE id=?;", 'ssi',
                  [$worldMapSquare['items'], $worldMapSquare['processes'], $worldMapSquare['id']],
                  'server/route_localMap.php->route_AddProcess()->save world map changes');

        // I think we're done here (for now). Send a success reponse to the server
        die(json_encode(['result'=>'success']));
    }

    function route_localMapSetPriority($msg) {
        // Allows a user to set the priority of a given process

        global $userid;

        $con = verifyInput($msg, [
            ['name'=>'userid', 'required'=>true, 'format'=>'posint'],
            ['name'=>'access', 'required'=>true, 'format'=>'int'],
            ['name'=>'buildid', 'required'=>true, 'format'=>'posint'],
            ['name'=>'priority', 'required'=>true, 'format'=>'int']
        ], 'server/route_localMap.php->route_localMapSetPriority()->verify input');
        verifyUser($con);

        // Now verify everything against the database
        $res = DanDBList("SELECT * FROM sw_structure WHERE id=?;", 'i', [$con['buildid']],
                         'server/route_localMap.php->route_localMapSetPriority()->get building data');
        if(sizeof($res)===0) ajaxreject('badinput', 'There is no building with id='. $con['buildid']);
        $building = $res[0];
        // For the rest, we can trust that the database is accurate
        $minimapSquare = DanDBList("SELECT * FROM sw_minimap WHERE buildid=?;", 'i', [$con['buildid']],
                                   'server/route_localMap.php->route_localMapSetPriority()->get minimap data')[0];
        $worldMapSquare = DanDBList("SELECT * FROM sw_map WHERE id=?;", 'i', [$minimapSquare['mapid']],
                                    'server/route_localMap.php->route_localMapSetPriority()->get world map data')[0];
        if($worldMapSquare['owner'] !== $userid) ajaxreject('badinput', 'You do not have ownership of this land');

        // Before updating the existing processes, advance the item values to current
        $worldMapSquare = advanceProcesses($worldMapSquare, "NOW()");

        //reporterror('route_localMap.php->route_localMapSetPriority()->after advanceProcesses()', 'world map processes='. );

        // Updating the processes should be fairly simple, with a .map operation.
        // Don't forget to convert from string to array
        $worldMapSquare['processes'] = json_encode(array_map(function($ele) use ($con) {
            if($ele['buildingId']==$con['buildid']) {
                $ele['priority'] = $con['priority'];
            }
            return $ele;
        }, json_decode($worldMapSquare['processes'], true)));

        // Update the production rates of everything
        $worldMapSquare = updateProcesses($worldMapSquare, "NOW()");

        // Save our results to the database again
        DanDBList("UPDATE sw_map SET resourceTime=?, items=?, processes=? WHERE id=?", 'sssi',
                  [$worldMapSquare['resourceTime'], $worldMapSquare['items'], $worldMapSquare['processes'], $worldMapSquare['id']],
                  'server/route_localMap.php->route_localMapSetPriority()->save area changes');
        
        // With that done, we're ready to send a reply
        die(json_encode(['result'=>'success']));
    }
?>