<?php
/*  mapContent.php
    Has multiple functions related to creating maps, and other similar tasks
    For the game Settlers & Warlords
*/

function generateClusterMap($minX, $maxX, $minY, $maxY, $biomeGroup, $biomeDensity) {
    // Generates a cluster map, to be used for showing biome-based map content
    // $minX, $maxX, $minY, $maxY: range of points to add to this map
    // $biomeGroup - a WeightedRandom class instance, containing each biome and the probability of seeing it. This affects
    //  the number of generated sections, not how large they can become
    // $biomeDensity - Indirectly sets the size of each biome. Determines the number of biomes to place on the map
    // Returns a list of objects, each containing an X, Y coordinate, and a biome value (how that value is used is up to you)

    global $directionMap;

    // Start with building a 2D array of map plots, with basic data
    $fullMap = forrange($minY, $maxY, 1, function($y) use ($minX, $maxX) {
        return forrange($minX, $maxX, 1, function($x) use ($y) {
            return ['x'=>$x, 'y'=>$y, 'landType'=>-1];
            // This generateClusterMap() is only responsible for determining the land types. Everything else can be appended to this later
        });
    });

    srand(time());
    $mapSizeX = $maxX-$minX;
    $mapSizeY = $maxY-$minY;
    $pointCount = floor(($mapSizeX * $mapSizeY) / $biomeDensity);
    reporterror('server/mapbuilder.php->generateClusterMap()', 'We have '. $pointCount .' points to place');
    $biomePoints = forrange(0, $pointCount-1, 1, function($i) use ($minX, $maxX, $minY, $maxY, $biomeGroup) {
        $genX = rand($minX,$maxX);
        $genY = rand($minY,$maxY);
        //$biome = rand(0,$biomeCount-1);
        $biome = $biomeGroup->cyclepull();
        $fullMap[$genX][$genY]['landType'] = $biome;
        return [
            'x'=>$genX,
            'y'=>$genY,
            'biome'=>$biome,
            'captured'=>[['x'=>$genX,'y'=>$genY]]
        ];
    });

    // Run through all biome points and try to expand each one. Keep doing this until all biome points are empty
    while(sizeof($biomePoints)>0) {
        foreach($biomePoints as &$group) {  // since the internal parts of $group will be modified, we must pass by reference
            $targetSlot = rand(0,sizeof($group['captured'])-1); // This is stored for later
            $target = $group['captured'][$targetSlot];
            $choices = $directionMap[rand(0,sizeof($directionMap)-1)]; // This selects one of the direction lists, at random
            $flagged = 0;
            for($dir=0;$dir<4;$dir++) {
                $spotX = $target['x']+$choices[$dir]['x'];
                $spotY = $target['y']+$choices[$dir]['y'];
                if(within($spotX, $minX, $maxX, true) && within($spotY, $minY, $maxY, true)) {
                    if($flagged===0) {
                        if($fullMap[$spotX][$spotY]['landType']===-1) {
                            // This is a good spot to expand to. Mark this as this biome's land type, and add this location
                            // to the list of captured locations. We don't need to remove this current captured entry, as other
                            // nearby blocks might be able to be captured
                            $fullMap[$spotX][$spotY]['landType'] = $group['biome'];
                            array_push($group['captured'], ['x'=>$spotX, 'y'=>$spotY]);
                            $flagged = 1;
                        }
                    }
                }
            }
            if($flagged===0) {
                // This spot went through all 4 directions and didn't find a hit. It needs to be removed
                array_splice($group['captured'], $targetSlot, 1);
            }
        }

        // Find any biomePoint groups that are out of directions to go, and remove them
        $biomePoints = array_filter($biomePoints, function($ele) {
            return sizeof($ele['captured'])>0;
        });
    }
    return $fullMap;
}

function newPlayerLocation($level, $mode, $count) {
    // Recursive function to determine where the next player's city should be located. This will avoid full-water locations, as
    // players cannot set up there.

    // Start by determining where on the grid this will be
    $x = 0;
    $y = 0;
    $limit = 0; // How far along this line we can go before changing modes (and levels)
    switch($mode) {
        case 0: // across the top
            $limit = $level*2+1;
            $x = -$level +$count;
            $y = -$level;
        break;
        case 1: // down the right
            $limit = $level*2-1;
            $x = $level;
            $y = -$level+$count;
        break;
        case 2: // back across the bottom
            $limit = $level*2+1;
            $x = $level-$count;
            $y = $level;
        break;
        case 3: // up along the left
            $limit = $level*2-1;
            $x = -$level;
            $y = $level-$count;
        break;
    }

    // Now scale this location, to allow land between users
    $x *= 5;
    $y *= 5;

    // Determine if this is a suitable location to place a city
    $mappos = DanDBList("SELECT biome, owner FROM sw_map WHERE x=? AND y=?;", 'ii', [$x,$y], 'ajax.php->cityLocation->check map coords')[0];
    /*$mappos = danget("SELECT biome, owner FROM sw_map WHERE x=". $x ." AND y=". $y .";",
                     'ajax.php->cityLocation->check map coords');*/
    if($mappos['biome']==2 || $mappos['biome']==4 || $mappos['biome']==3 || $mappos['owner']!=0) {
        // This location will not work; it is either desert, water, swamp, or someone has already taken it. We will need to find another place
        $out = advanceStartPos($level, $mode, $count);
        return newPlayerLocation($out['level'], $out['mode'], $out['count']);
    }
    // This location is acceptable. Before returning it, update the fields in the database with the next values
    $out = advanceStartPos($level, $mode, $count);
    setGlobal("newplayerlevel", $out['level']);
    setGlobal("newplayermode", $out['mode']);
    setGlobal("newplayercount", $out['count']);
    return [$x, $y];
}

function createWorkers($workerCount) {
    // Creates a number of new workers, each with unique names, that can be stored in the database. We will place them
    // at a random location on the map, while we're at it. Multiple workers can occupy the same square, without issue
    global $workerNames;
    
    $group = [];
    for($i=0;$i<$workerCount;$i++) {
        array_push($group, ['name'=>getRandomFrom($workerNames), 'x'=>rand(0,40), 'y'=>rand(0,40), 'status'=>'idle']);
    }
    return $group;
}

function ensureMinimapXY($worldx, $worldy, $newPlayer) {
    // Allows you to create a minimap based on world coordinates, if you don't (yet) have the map object from the database
    ensureMinimap(DanDBList("SELECT * FROM sw_map WHERE x=? AND y=?;", 'ii', [$worldx,$worldy],
                            'sever/mapbuilder.php->ensureMinimapXY()')[0], $newPlayer);
    /*
    ensureMinimap(danget("SELECT * FROM sw_map WHERE x=". $worldx ." AND y=". $worldy .";",
                         'server/mapbuilder.php->generateminimapbycoords'));*/
}

function ensureMinimap($worldTile, $newPlayer) {
    // Allows us to ensure that a minimap exists for a given world map location. If none exists, one will be created for it.
    // $worldTile: full data package as received from the database about this world location
    // $newPlayer: set to true if this is for a new player. This will ensure at least 1 rock tile and 5 tree tiles exist
    //      on the map somewhere, along with 4 workers
    // No return value. All content created will be applied to the database

    // Generates a minimap. Requires a full read-out of the world map coordinate from the database.  Use either
    // generateminimapfromcoords or generateminimapfromid to grab that data.

    // At some point, we may want to consider the land types of surrounding territories. But for now, we won't worry about it.

    global $db;
    global $biomeData;

    $localMapWidth = 40;
    $localMapHeight = 40;

    // Start by ensuring there is no minimap data here yet already
    if(sizeof(DanDBList("SELECT x FROM sw_minimap WHERE mapid=? LIMIT 1;", 'i', [$worldTile['id']],
              'server/mapbuilder.php->generateminimap()->check ex*istence of minimap'))>0)
        return;
    
    // Let's start with a chart to determine the likelihood of each land type, given the selected biome.
    // I was going to add it here, but instead, added it to the biomeData structure, as it's already built based on biome
    
    // Generate a clustered map based on the biome selected
    $localTiles = generateClusterMap(0,$localMapWidth,0,$localMapHeight,$biomeData[$worldTile['biome']]['localTiles'], 25);

    // Now would be a good time to create streams. Doing so effectively is... harder than it seems. I will simply stick with a 
    // tilted line, with a fixed width of the stream for the whole route.
    //$y = 1.5*$x +2;
    // Actually, that is hard, too. Instead, we're going with a simpler option. From the top, we'll slide down, plotting single
    // water tiles the whole way. Every few blocks we'll shift over one block. This will be a very limited method of making water
    // tiles, but right now I don't care; getting this to some functionality is holding up the rest of the project.
    $startX = rand(0,40);
    $slideRate = rand(-6,6);  // for every 6 blocks, we slide one (left or right)
    $slideDirection = ($slideRate>0)? 1 : -1;
    $slideCounter = 0;
    for($y=0;$i<40;$y++) {
        $localTiles[$startX][$y]['landType'] = 'stream';
        $slideCounter++;
        if($slideCounter>$slideRate && $slideRate!==0) {
            $startX += $slideDirection;
            if($startX<0 || $startX>=40) break;
        }
    }


?>