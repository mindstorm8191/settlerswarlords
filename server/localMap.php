<?php
    /*  localMap.php
        for the game Settlers & Warlords
        provides the function loadLocalMap, and a few variances of that
    */

    function loadBuildOptions($worldMapId) {
        // Outputs an array of building types that this user is able to build, at their current location

        // While doing this, we need to consider the prerequisites of the building. Get a list of item names available here
        // This gives us a 'name' & value pair, so we need to map it to only hold the name
        $itemsAccessed = array_map(function($ele) {
            return $ele['name'];
        }, danqueryajax("SELECT `name` FROM sw_item WHERE mapID=". $worldMapId .";",
                        'server/localMap.php->loadBuildOptions()'));
        return array_filter(danqueryajax("SELECT name, image, buildtime, resources, landtype, minworkers, maxworkers, ".
                                         "resourcesUsed, output, prereqs, description FROM sw_structuretype;",
                                         'server/localMap.php->loadBuildOptions()'),
            function($single) use ($itemsAccessed) {
                // Split the prereqs list into individual items, then ensure all of them are in the
                // $itemsAccessed array. If not, return false.
                //if($single['prereqs']!='') {
                  //  reporterror('Debug in server/localMap.php->loadBuildOptions()->filter: Pond object contains '. json_encode($itemsAccessed));
                //}
                return $single['prereqs']=='' ||
                       includesAll($itemsAccessed, explode(",", $single['prereqs']));
            });
        
        // Eventually, we would also like to exclude buildings that have been deprecated by better buildings. But
        // now that I think about it, this should be handled on the client side, since the player will be able to
        // view it there anyway.
    }

    function loadLocalMapXY($worldX, $worldY) {
        // Allows us to load the local map content when we only have the world X & Y coordinates
        return loadLocalMap(danget("SELECT * FROM sw_map WHERE x=". $worldX ." AND y=". $worldY .";",
                                   'server/localMap.php->loadLocalMapXY()'));
    }

    function loadLocalMapId($worldId) {
        // Allows us to load the local map content when we only have the world map ID
        return loadLocalMap(danget("SELECT * FROM sw_map WHERE id=". $worldId .";",
                                   'server/localMap.php->loadLocalMapId()'));
    }

    function loadLocalMap($worldData) {
        // Collects a large block of data about the local map, which is used for passing to the client

        global $WorldBiomes;

        advanceProcesses($worldData['id'], 'NOW()');

        // There are a few localMap-related fields that are needed here, that are not part of the minimap structure
        //$localMap = danget("SELECT * FROM map WHERE id=". worldId .";",
                           //'server/localMap.php->loadLocalMap()->get remaining map data');
        // The rest can be handled in a single large statement
        return [
            "biome"=>$WorldBiomes[$worldData['biome']],
            "ugresource"=>$worldData['ugresource'],
            "ugamount"=>$worldData['ugamount'],
            "owner"=>$worldData['owner'],
            "id"=>$worldData['id'],
            "population"=>$worldData['population'],
            "minimap"=>array_map('getSquareInfo',
                danqueryajax("SELECT mapid,x,y,landtype,buildid FROM sw_minimap WHERE mapid=". $worldData['id'] ." ORDER BY y,x;",
                             'server/localMap.php->loadLocalMap()->get bulk minimap data')
                )
            ];
    }

    function getSquareInfo($ele) {
        // Returns an object containing all the client-important data about a given tile.
        if($ele['buildid']==0) return $ele;

        // Append our map tile square with information about the building here (and building type info too)

        // We don't really have to combine our data, if we grab the data we need correctly
        $building = danget("SELECT buildtype, devlevel, fortlevel, detail, workersassigned, assigned FROM sw_structure WHERE id=".
                            $ele['buildid'] .";",
                            'server/localMap.php->getSquareInfo()->get building data');
        $buildType = danget("SELECT name, image, description FROM sw_structuretype WHERE id=". $building['buildtype'] .
                            " AND level=". $building['devlevel'] .";",
                            'server/localMap.php->getSquareInfo()->get building kind data');
        
        // Attach any events to this output as well. Right now, we only have one event type we need to search for
        $events = danqueryajax("SELECT * FROM sw_event WHERE mapid=". $ele['mapid'] ." AND detail='". $ele['x'] .",". $ele['y'] ."';",
                               'server/localMap.php->getSquareInfo()->get all events');
        
        // For actions on this building, it is possible that a building has no actions, so we have to account for that
        $actions = danqueryajax("SELECT name, minWorkers, maxWorkers, workerBonus, cycleTime, inputGroup, outputGroup FROM ".
                                "sw_structureaction WHERE buildType=". $building['buildtype'] ." AND minLevel<=".
                                $building['devlevel'] .";",
                                'server/localMap.php->getSquareInfo()->get building actions');
        $current = null;
        if(sizeof($actions)>0) {
            // Now get the currently active action, if any. This is done here so that we can still get null if there are none
            // So far, we only need the name of the process, and the number of seconds until it triggers an update
            $current = danget("SELECT sw_structureaction.name, sw_structureaction.cycleTime - ".
                              "TIME_TO_SEC(TIMEDIFF(NOW(), sw_process.timeBalance)) AS time FROM sw_process INNER JOIN sw_structureaction ON ".
                              "sw_process.actionid = sw_structureaction.id WHERE buildingid=". $ele['buildid'] .";",
                              'server/localMap.php->getSquareInfo()->get active processes', true);
            $actions = array_map(function($single) {
                // for each inputGroup and outputGroup in the individual actions, we need to query & store the inner items listed for those
                if($single['inputGroup']!=0) {
                    $single['inputGroup'] = danqueryajax("SELECT * FROM sw_structureitem WHERE resourceGroup=".
                                                            $single['inputGroup'] .";",
                                                            'server/localMap.php->getSquareInfo()->get inputGroup of actions');
                }
                if($single['outputGroup']!=0) {
                    $single['outputGroup'] = danqueryajax("SELECT * FROM sw_structureitem WHERE resourceGroup=".
                                                            $single['outputGroup'] .";",
                                                            'server/localMap.php->getSquareInfo()->get outputGroup of actions');
                }
                return $single;
            }, $actions);
        }else{
            $actions = array();
        }
        unset($ele['mapid']);
        $ele['building'] = $building;
        $ele['buildType'] = $buildType;
        $ele['actions'] = $actions;
        $ele['process'] = $current;
        $ele['events'] = $events;
        return $ele;
    }
?>
