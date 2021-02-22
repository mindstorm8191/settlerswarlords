<?php
    /*  usermap.php
        Contains various functions related to the map, both world and local; 
        For the game Settlers & Warlords

        Note that world map content is as the user understands it, not as it is in real time
    */

    function getMapId($xpos, $ypos) {
        // Returns the map's ID, when given the map's X & Y coordinates
        return DanDBList("SELECT id FROM sw_map WHERE x=? AND y=?;", 'ii', [$xpos,$ypos],'server/mapbuilder.php->getMapID()')[0]['id'];
        /*
        return danget("SELECT id FROM sw_map WHERE x=". $xpos ." AND y=". $ypos .";",
                      'server/mapbuilder.php->getMapID()')['id'];
        */
    }

    function getMapXY($id) {
        // Returns a map's X & Y coordinates, when given the map ID value.
        // Note that this returns an array containing X & Y properties
        return DanDBList("SELECT x,y FROM sw_map WHERE id=?", 'i', [$id], 'server/mapbuilder.php->getMapXY()')[0];
        /*
        return danget("SELECT x,y FROM sw_map WHERE id=". $id .";",
                      'server/mapbuilder.php->getMapXY()');
        */
    }

    function localMap_getSquareInfo($pack, $worldMapContent) {
        // Appends additional information about a given tile with stats about the building there, along with active
        // events.

        global $buildingEvents;

        // If there is no building here, there's nothing extra to add
        if($pack['buildid']===0) return $pack;
        
        $pack['building'] = DanDBList("SELECT id, buildtype, devlevel, fortlevel, detail, workersassigned, assigned FROM sw_structure WHERE id=?",
                                    'i', [$pack['buildid']], 'server/localMap.php->localMap_getSquareInfo()->load building stats')[0];
        $pack['buildType'] = DanDBList("SELECT name, image, description FROM sw_structuretype WHERE id=? AND devlevel=? AND fortlevel=?;",
                                    'iii', [$pack['building']['buildtype'], $pack['building']['devlevel'], $pack['building']['fortlevel']],
                                    'server/localMap.php->localMap_getSquareInfo()->load building type data')[0];
        
        // Pick up all events as an array. Determining which events are actually related to this building will take a bit of work
        /* We don't really need to do this yet, since we have no events tied directly to buildings (yet)
        $eventsList = DanDBList("SELECT * FROM sw_event WHERE mapid=?;", 'i', [$pack['mapid']],
                                'server/localMap.php->localMap_getSquareInfo()->get all map events');
        $pack['events'] = JSFilter($eventsList, function($ele) use ($pack, $buildingEvents) {
                // First, determine if this is a building event. We created a constant array for comparison.
            if(!in_array($ele['task'], $buildingEvents)) return false;
                // The real determining factor is if we have the building id stored with this event, in its detail text
            $content = json_decode($ele['detail'], true);
            if(!isset($content['buildid'])) return false;
            if($content['buildid']!==$pack['building']['id']) return false;
            return true;
        });
        //reporterror('server/usermap.php->localMap_getSquareInfo(): events structure', 'before='. json_encode($eventsList) .
          //          ', after='. json_encode($pack['events']));
        */
        // Actions is a bit more complicated; not all buildings will have actions
        $actions = DanDBList("SELECT name, minWorkers, maxWorkers, workerBonus, cycleTime, inputGroup, outputGroup FROM ".
                            "sw_structureaction WHERE buildType=? AND minLevel<=?;", 'ii',
                            [$pack['building']['buildtype'], $pack['building']['devlevel']],
                            'server/localMap.php->localMap_getSquareInfo()->collect all actions');
        $pack['actions'] = array_map(function($ele) {
            /*if($ele['name']==='Craft Hide Armor') {
                reporterror('server/usermap.php->localMap_getSquareInfo()->converting actions',
                            'dataType of inputGroup='. gettype($ele['inputGroup']) .', sizeof(inputGroup)='.
                            sizeof(json_decode($ele['inputGroup'])));
            }*/
            $ele['inputGroup'] = ($ele['inputGroup']=='')?[]:json_decode($ele['inputGroup'], false);
            $ele['outputGroup'] = ($ele['outputGroup']=='')?[]:json_decode($ele['outputGroup'], false);
            return $ele;
        }, $actions);

        if($pack['actions'][0]['name']==='Craft Hide Armor') {
            reporterror('server/usermap.php->localMap_getSquareInfo()->converting actions',
                        'sizeof(inputGroup)='. sizeof($pack['actions'][0]['inputGroup']));
        }

        //
        //reporterror('server/usermap.php->localMap_getSquareInfo', 'Debugging actions: '. json_encode($pack['actions']));
        /*
        $process = null;
        if(sizeof($actions)>0) {
            // For this tile, we want to find any active processes associated with it, from the world map data

            // So, this really depends on how we store the data (and that isn't set in stone yet). We want to associate the
            // process to the correct building, so we should store the building ID with the process
            $mapProcesses = json_decode($worldMapContent['processes'], true);
            $pack['activeprocesses'] = array_filter($mapProcesses, function($ele) use ($pack) {
                if(isset($ele['buildingid'])) {
                    return ($pack['building']['id']===$ele['buildingid']);
                }else{
                    return false;
                }
            });

            // If there are actions, there may be active processes for this action
            /*
            $res = DanDBList("SELECT sw_structureaction.name, ".
                            "sw_structureaction.cycleTime-TIME_TO_SEC(TIMEDIFF(NOW(), sw_process.timeBalance)) AS time, ".
                            "sw_process.targetCount AS target, ".
                            "sw_process.priority AS priority, ".
                            "sw_structureaction.inputGroup AS inputGroup, ".
                            "sw_structureaction.outputGroup as outputGroup ".
                            "FROM sw_process INNER JOIN sw_structureaction ON sw_process.actionid = sw_structureaction.id ".
                            "WHERE buildingid=?;", 'i', [$pack['buildid']],
                            'server/localMap.php->localMap_getSquareInfo()->get active processes');
            if(sizeof($res)>0) {
                // We found an active process
                $process = $res[0];
                // Now, with the input and output groups, we want to generate a list of item names, their current inventory
                // values, and hourly production rates (negatives are allowed)
                if($process['inputGroup']!==0) {
                    $inGroup = array_map(function($ele) {
                        return $ele['name'];
                    }, DanDBList("SELECT name FROM sw_structureitem WHERE resourceGroup=?;",
                                'i', [$process['inputGroup']],
                                'server/localMap.php->localMap_getSquareInfo()->get process inputGroup data'));
                    // This gives us a list of names (as only strings, not objects) which we can use for the next query
                    $inGroupPlus = $inGroup;
                    array_push($inGroupPlus, $pack['mapid']);
                    $process['inputGroup'] = DanDBList(
                        "SELECT name, FLOOR(amount) AS amount, production FROM sw_item WHERE name IN(".
                            implode(str_split(str_repeat("?", sizeof($inGroup)), 1), ',')
                        .") AND mapID=?;", str_repeat('s', sizeof($inGroup)) .'i', $inGroupPlus,
                        'server/localMap.php->localMap_getSquareInfo()->get current input inventory');
                }
                // Do the same for the output group
                if($process['outputGroup']!==0) {
                    $outGroup = array_map(function($ele) {
                        return $ele['name'];
                    }, DanDBList("SELECT name FROM sw_structureitem WHERE resourceGroup=?;", 'i', [$process['outputGroup']],
                                'server/localMap.php->localMap_getSquareInfo()->get process outputGroup data'));
                    $outGroupPlus = $outGroup;
                    array_push($outGroupPlus, $pack['mapid']);
                    $process['outputGroup'] = DanDBList(
                        "SELECT name, FLOOR(amount) AS amount, production FROM sw_item WHERE name IN(".
                            implode(str_split(str_repeat("?", sizeof($outGroup)), 1), ',')
                        .") AND mapID=?;", str_repeat('s', sizeof($outGroup)) .'i', $outGroupPlus,
                        'server/localMap.php->localMap_getSquareInfo()->get current output inventory');
                }
            }

            // For our list of actions, we also need to append resource stats to them. Each action can potentially have
            // a list of input items, and a list of output items
            $actions = array_map(function($single) use ($pack) {
                // If there are no items in an inputGroup, the action's inputGroup id will be zero.
                if($single['inputGroup']!=0) {
                    // The resource group ID does no good on the client side. Convert this group into a structure 
                    $inGroup = DanDBList("SELECT name,amount FROM sw_structureitem WHERE resourceGroup=?;",
                                        'i', [$single['inputGroup']],
                                        'server/localMap.php->localMap_getSquareInfo()->get action inputGroup data');
                    $single['inputGroup'] = localMap_GetItemQuantities($inGroup, "supply", $pack['mapid']);
                }
                // Do the same for the outputGroup
                if($single['outputGroup']!=0) {
                    $outGroup = DanDBList("SELECT name,amount FROM sw_structureitem WHERE resourceGroup=?;",
                                        'i', [$single['outputGroup']],
                                        'server/localMap.php->localMap_getSquareInfo()->get action outputGroup data');
                    $single['outputGroup'] = localMap_GetItemQuantities($outGroup, "supply", $pack['mapid']);
                }
                return $single;
            }, $actions);
        }
        // Attach the actions and processes, then we're ready to 'turn this in'
        $pack['actions'] = $actions;
        $pack['process'] = $process;
        */
        return $pack;
    }

    function localMap_loadBuildOptions($worldMap) {
        // Outputs an array of building types that this use is able to build, at their current location

        // While doing this, we need to consider the prerequisites of the building. Get a list of item types accessible at this location
        // This gives us an array of item names
        /*$itemsAccessed = []; /*array_map(function($ele) {
            return $ele['name'];
        }, DanDBList("SELECT `name` FROM sw_item WHERE mapID=?;", 'i', [$worldMapId], 'ajax.php->loadBuildOptions()->get items list'));*/
        $itemsAccessed = array_map(function($ele) {
            return $ele['name'];
        },json_decode($worldMap['items'], true));

        // Now get all the buildings
        $buildList = DanDBList("SELECT name, image, buildtime, resources, landtype, minworkers, maxworkers, resourcesUsed, ".
                               "output, prereqs, description FROM sw_structuretype;", '', [], 'ajax->loadBuildOptions->get all buildings');
        // Filter out all inaccessible buildings
        return array_filter($buildList, function($single) use ($itemsAccessed) {
            if($single['prereqs']==='') return true;
            return includesAll($itemsAccessed, explode(",", $single['prereqs']));
        });
    }

    /*
    function updateknownmap($playerid, $xpos, $ypos) {
        // Updates the user's known map, based on a given coordinate.  If they don't have information about the given location, it
        // will be generated.

        // Start with getting current information about the given map square
        $square = DanDBList("SELECT * FROM sw_map WHERE x=? AND y=?;", 'ii', [$xpos, $ypos], "server/mapbuilder.php->updateknownmap->get map data")[0];

        // With 3 variables serving as the 'key', we can't really do the 'on duplicate key update' trick. So, start by checking if
        // this knownmap location exists (for this player)
        if(sizeof(DanDBList("SELECT * FROM sw_knownmap WHERE playerid=? AND x=? AND y=?;", 'iii', [$playerid, $xpos, $ypos],
                        'server/mapbuilder.php->updateknownmap()->find existing known square'))>0) {
            // Record already exists. Update it
            DanDBList("UPDATE sw_knownmap SET lastcheck=NOW(), owner=?, civ=0, population=? WHERE playerid=? AND x=? AND y=?;",
                      'iiiii', [$square['owner'], $square['population'], $playerid, $xpos, $ypos],
                      'server/mapbuilder.php->updateknownmap()->update existing instance');
        }else{
            // No record was found. Create a new one
            DanDBList("INSERT INTO sw_knownmap (playerid,x,y,lastcheck,owner,civ,population) VALUES (?,?,?,NOW(),?,0,?);",
                     'iiiii', [$playerid, $xpos, $ypos, $square['owner'], $square['population']],
                    'server/mapbuilder.php->updateknownmap()->add new spot to KnownMap');
        }
    }
    */

    function worldMap_updateKnown($userid, $updatex, $updatey, $timepoint, $owner, $civ, $pop, $biome=-1) {
        // Updates a tile of the user's known map. If they don't have any existing information about the specified
        // location, basic information will be generated
        //  userid - which user this known map is for
        //  updatex/updatey - world coordinates to collect data about
        //  timepoint - relative time point when the user knows about this map tile. Keep in mind that any
        //  owner - ID of the owner player for this land, or zero if none
        //  civ - ID of the civilization type owning this land
        //  pop - population of this land, based on civilization, or zero if none
        //  biome - What biome code to put here. If -1, will use the code provided from the world map

        // If we don't have the biome provided, grab the biome from the map's database record
        if($biome===-1) {
            $biome = DanDBList("SELECT biome FROM sw_map WHERE x=? AND y=?;", 'ii', [$updatex, $updatey],
                               'server/usermap.php->worldMap_updateKnown()->get biome from database')[0]['biome'];
        }
        // Next, determine if this tile exists in the user's known map. With 3 variables as a 'key', we can't do the
        // 'on duplicate key' trick.
        $known = DanDBList("SELECT * FROM sw_knownmap WHERE playerid=? AND x=? AND y=?;", 'iii', [$userid, $updatex, $updatey],
                           'server/usermap.php->worldMap_updateKnown()->find existing known square');
        if(sizeof($known)>0) {
            // A tile here already exists. Update it. Our handling of the timepoint will vary, though
            reporterror('server/usermap.php->worldMap_updateKnown()->check known', 'existing tile found');
            if($timepoint==="NOW()") {
                DanDBList("UPDATE sw_knownmap SET lastcheck=NOW(), owner=?, civ=?, population=?, biome=? WHERE playerid=? AND x=? AND y=?;",
                          'iiiiiii', [$owner, $civ, $pop, $biome, $userid, $updatex, $updatey],
                          'server/usermap.php->worldMap_updateKnown()->update existing record with now');
            }else{
                DanDBList("UPDATE sw_knownmap SET lastcheck=?, owner=?, civ=?, population=?, biome=? WHERE playerid=? AND x=? AND y=?;",
                          'siiiiiii', [$timepoint, $owner, $civ, $pop, $biome, $userid, $updatex, $updatey],
                          'server/usermap.php->worldMap_updateKnown()->update existing record for time point');
            }
        }else{
            // No tile was found. Create one now. Again, handling depends on timepoint
            reporterror('server/usermap.php->worldMap_updateKnown()->check known', 'adding new tile');
            if($timepoint==="NOW()") {
                DanDBList("INSERT INTO sw_knownmap (playerid,x,y,lastcheck,owner,civ,population,biome) VALUES (?,?,?,NOW(),?,?,?,?);",
                          'iiiiiii', [$userid, $updatex, $updatey, $owner, $civ, $pop, $biome],
                          'server/route_worldMap.php->worldMap_updateKnown()->insert new record with now');
            }else{
                DanDBList("INSERT INTO sw_knownmap (playerid,x,y,lastcheck,owner,civ,population,biome) VALUES (?,?,?,?,?,?,?,?);",
                          'iiisiiii', [$userid, $updatex, $updatey, $timepoint, $owner, $civ, $pop, $biome],
                          'server/usermap.php->worldMap_updateKnown()->insert new record for time point');
            }
        }
    }

    function updatePopulation($mapContent) {
        // Handles updating the population of the selected tile
        // $mapContent - full map package, as received from the database
        // Returns an array:
        //      0: $mapContent again, possibly with updated population value
        //      1: true or false if population had been adjusted

        // With $mapContent, find all the food items, and determine total production rate (and on-hand value)
        $items = json_decode($mapContent['items'], true);
        [$onhand, $production] = array_reduce($items, function($carry, $ele) {
            if($ele['isFood']==0) return $carry;  // This is not food, it doesn't count
            return [$carry[0]+$ele['amount'], $carry[1]+$ele['production']-$ele['consumption']];
        }, [0.0, 0.0]);

        // if on-hand amount is at zero, we should reduce population anyway
        if($onhand<1) {
            $mapContent['population']--;
            return [$mapContent, true];
        }else{
            // Population may grow if 1) current production rates can handle an extra mouth to feed, and 2) if player has enough food
            // to feed everyone twice, for 30 minutes, even with the extra member
            // per-person use per hour = 12
            // pop = 4, so that equals 48 food per hour. To increase, production must be 5*12 = 60 per hour
            // Wait, that won't work, as $production accounts for consumption as well. We need to have >12 per hour to feed the extra mouth
            if($production>12) {
                // Food on hand: with pop=4, need 24 on hand for growth
                // An extra person would be 5*6=30 on hand
                if($onhand>=($mapContent['population']+1)*6) {
                    $mapContent['population']++;
                    return [$mapContent, true];
                }
            }
        }
        return [$mapContent, false];
    }
?>