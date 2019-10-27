<?php
    /*  localMap.php
        for the game Settlers & Warlords
        provides the function loadLocalMap, and a few variances of that
    */

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
                },
                danqueryajax("SELECT * FROM sw_minimap WHERE mapid=". $worldData['id'] ." ORDER BY y,x;",
                             'server/localMap.php->loadLocalMap()->get bulk minimap data')
                )
            ];
    }
?>



