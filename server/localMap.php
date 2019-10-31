<?php
    /*  localMap.php
        for the game Settlers & Warlords
        provides the function loadLocalMap, and a few variances of that
    */

    function loadBuildOptions($worldMapId) {
        // Outputs an array of building types that this user is able to build, at their current location

        // For now, our data is pretty fixed (we only have two buildings so far). Go ahead and output those building types, including the
        // fields we need. Later, we will have to determine what can be built here based on available resources (and/or what the user can
        // build everywhere).
        return danqueryajax("SELECT name, image, buildtime, resources, landtype, minworkers, maxworkers, resourcesUsed, output, description ".
                            "FROM sw_structuretype WHERE resources='';",
                            'server/localMap.php->loadBuildOptions()');
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

        // There are a few localMap-related fields that are needed here, that are not part of the minimap structure
        //$localMap = danget("SELECT * FROM map WHERE id=". worldId .";",
                           //'server/localMap.php->loadLocalMap()->get remaining map data');
        // The rest can be handled in a single large statement
        return [
            "biome"=>$WorldBiomes[$worldData['biome']],
            "ugresource"=>$worldData['ugresource'],
            "ugamount"=>$worldData['ugamount'],
            "owner"=>$worldData['owner'],
            "population"=>$worldData['population'],
            "minimap"=>array_map(function($ele) {
                    if($ele['buildid']==0) return $ele;

                    // Append our map tile square with information about the building here (and building type info too)

                    // We don't really have to combine our data, if we grab the data we need correctly
                    $building = danget("SELECT buildtype, devlevel, fortlevel, detail, workersassigned, assigned FROM sw_structure WHERE id=".
                                       $ele['buildid'] .";",
                                       'server/localMap.php->loadLocalMap()->get building data');
                    $buildType = danget("SELECT name, image, description FROM sw_structuretype WHERE id=". $building['buildtype'] .
                                        " AND level=". $building['devlevel'] .";",
                                        'server/localMap.php->loadLocalMap()->get building kind data');
                    
                    // For actions on this building, it is possible that a building has no actions, so we have to account for that
                    $actions = danqueryajax("SELECT name, minWorkers, maxWorkers, workerBonus, cycleTime, inputGroup, outputGroup FROM ".
                                            "sw_structureaction WHERE buildType=". $building['buildtype'] ." AND minLevel<=".
                                            $building['devlevel'] .";",
                                            'server/localMap.php->loadLocalMap()->get building actions');
                    if(sizeof($actions)>0) {
                        $actions = array_map(function($single) {
                            // for each inputGroup and outputGroup in the individual actions, we need to query & store the inner items listed for those
                            if($single['inputGroup']!=0) {
                                $single['inputGroup'] = danqueryajax("SELECT * FROM sw_item WHERE groupID=". $single['inputGroup'] .";",
                                                                    'server/localMap.php->loadLocalMap()->get inputGroup of actions');
                            }
                            if($single['outputGroup']!=0) {
                                $single['outputGroup'] = danqueryajax("SELECT * FROM sw_item WHERE groupID=". $single['outputGroup'] .";",
                                                                    'server/localMap.php->loadLocalMap()->get outputGroup of actions');
                            }
                            return $single;
                        }, $actions);
                    }else{
                        $actions = array();
                    }
                    $ele['building'] = $building;
                    $ele['buildType'] = $buildType;
                    $ele['actions'] = $actions;
                    return $ele;
                    /*
                    return array_merge(
                        $ele, danget(
                            "SELECT sw_structure.buildtype AS buildtype, sw_structure.devlevel AS devlevel, sw_structure.fortlevel AS fortlevel, ".
                            "sw_structure.detail AS detail, sw_structure.workersassigned AS workersassigned, sw_structure.assigned AS assigned, ".
                            "sw_structuretype.name AS name, sw_structuretype.image AS image, sw_structuretype.minworkers AS minworkers, ".
                            "sw_structuretype.maxworkers AS maxworkers, sw_structuretype.workerbonus AS workerbonus, ".
                            "sw_structuretype.resourcesUsed AS resourcesUsed, sw_structuretype.output AS output, ".
                            "sw_structuretype.description AS description FROM sw_structure INNER JOIN sw_structuretype ON ".
                            "sw_structure.buildtype=sw_structuretype.id WHERE sw_structure.id=". $ele['buildid'] .";",
                            'server/localMap.php->loadLocalMap()->get building data'));
                    */
                },
                danqueryajax("SELECT * FROM sw_minimap WHERE mapid=". $worldData['id'] ." ORDER BY y,x;",
                             'server/localMap.php->loadLocalMap()->get bulk minimap data')
                )
            ];
    }
?>



