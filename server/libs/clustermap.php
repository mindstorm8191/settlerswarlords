<?php
    /*  clustermap.php
        A function to generate a map using a cluster based algorithm
        For the game Settlers & Warlords
    */

    // This uses multiple functions from jsarray to do its job
    require_once("jsarray.php");
    require_once("../biomeBlock.php");

    function ClusterMap2($minX, $maxX, $minY, $maxY, $biomeGroup, $biomeDensity, $existingMap) {
        // Generates and returns a new map area, where land types are determined by cluster generation
        // $minX, $maxX, $minY, $maxY - range of points, inclusively, that will be added to the map
        // $biomeGroup - a WeightedRandom class instance containing each land type and the probability of seeing it. This affects the
        //      number of tile types and how often they are seen, not how large they can be
        // $biomeDensity - Determines roughly how large each cluster should be
        // $existingMap - a biomeChunk class instance containing all surrounding tiles. We will use the edges of these sections to
        //      extend the cluster in neighboring sections into this new one. If any or all sides are missing, they will be skipped.
        // Returns a new biomeChunk instance containing ints for all the tile types. The neighboring chunk content will be removed

        global $directionMap;
        srand(time());  // Make sure we have set this

        // The algorithm strategy here is simple. Start with a set of randomly placed points, each with a tile type. Each of these will keep
        // a list of tiles already marked that also can be expanded from (starting from 1 tile). Each cycle, for each point we will select a
        // tile from its list at random, and try to expand in any direction from it. For the list of tiles, when the selected tile cannot be
        // expanded from (including being part of its own point), the point will abandon that tile. The point will be 'finished' (and
        // removed) when there are no tiles left to expand from. Eventually, all points will exhaust their tiles list, and we'll have a
        // completed map.

        // Start with building a 2D array of map plots, with default data
        $fullMap = new biomeBlock;
        //reporterror('server/libs/clustermap.php->ClusterMap2()', 'values passed: ['. $minX .'-'. $maxX .']['. $minY .'-'. $maxY .']');
        for($y=$minY; $y<=$maxY; $y++) {
            for($x=$minX; $x<=$maxX; $x++) {
                $fullMap->set($x, $y, ['x'=>$x, 'y'=>$y, 'landType'=>-1]);
            }
        }

        // Next, calculate the number of individual clusters we need
        $mapSizeX = $maxX-$minX;
        $mapSizeY = $maxY-$minY;
        if($mapSizeX==0) {
            reporterror('server/libs/clustermap.php->ClusterMap2()->before points placement', 'Error - map provided is 0 tiles wide (from '. $minX .' to '. $maxX .'). Check parameters');
            return [];
        }
        if($mapSizeY==0) {
            reporterror('server/libs/clustermap.php->ClusterMap2()->before points placement', 'Error - map provided is 0 tiles tall (from '. $minY .' to '. $maxY .'). Check parameters');
            return [];
        }
        $pointCount = floor(($mapSizeX * $mapSizeY) / $biomeDensity);

        // Create a set of cluster points, to coordinate growing the clusters from
        $biomePoints = forrange(0, $pointCount-1, 1, function($i) use ($minX, $maxX, $minY, $maxY, $biomeGroup) {
            $genX = rand($minX, $maxX);
            $genY = rand($minY, $maxY);
            $biome = $biomeGroup->cyclePull();
            //$fullMap->set($genX, $genY, ['x'=>$genX, 'y'=>$genY, 'landType'=>$biome]);
            return [
                'x'=>$genX,
                'y'=>$genY,
                'biome'=>$biome,
                'captured'=>[['x'=>$genX, 'y'=>$genY]]  // This is a list of all the tiles that still need processing for this cluster
            ];
        }, 'server/libs/clustermap.php->ClusterMap2()->biome points');
        $oldSize = sizeof($biomePoints);
        
        // Next, factor in neighboring content. Our previous strategy of getting this from a function parameter wasn't working; we'll try
        // a 'direct insertion' approach this time.
        // Translate our coordinates to biome chunk coordinates
        global $chunkWidth, $biomeTileSize, $localTileNames;
        $biomeChunkX = floor($minX / floatval($chunkWidth * $biomeTileSize));
        $biomeChunkY = floor($minY / floatval($chunkWidth * $biomeTileSize));
        // North side!
        $nb = DanDBList("SELECT content FROM sw_biomemap WHERE chunkx=? AND chunkz=?;", 'ii', [$biomeChunkX, $biomeChunkY-1],
                        'server/libs/clustermap.php->ClusterMap2()->get north neighbors');
        if(sizeof($nb)!=0) {
            $nb = json_decode($nb[0]['content']);
            // Content is laid out in a flat array. So our target content will be the last 64 tiles of the array
            $lastPoint = 0;
            $zOffset = $chunkWidth * $biomeTileSize * (($chunkWidth * $biomeTileSize)-1);
            $lastColorMatch = $nb[$zOffset+0]; // Note that this will give us an integer. We will need to translate it to a local tile name as we create the biome point
            for($x=1; $x<$chunkWidth*$biomeTileSize; $x++) {
                if($nb[$zOffset+$x]!=$lastColorMatch) {
                    $midPoint = $lastPoint + floor((($x-1)-$lastPoint)/2.0);
                    array_push($biomePoints, [
                        'x'=>$minX + $midPoint, // while placing this, we will need to translate for world map coordinates
                        'y'=>$minY,
                        'biome'=>$localTileNames[$lastColorMatch],
                        'captured'=>[['x'=>$minX + $midPoint, 'y'=>$minY]]
                    ]);
                    $lastPoint = $x;
                    $lastColorMatch = $nb[$zOffset+$x];
                }
            }
            // Don't forget to include the last section
            $midPoint = $lastPoint + floor(($maxX-$lastPoint)/2.0);
            reporterror('server/libs/clustermap.php->ClusterMap2()->north side', 'final midPoint='. $midPoint .' to be '. $lastColorMatch .' aka '. $localTileNames[$lastColorMatch]);
            array_push($biomePoints, [
                'x'=>$minX + $midPoint,
                'y'=>$minY,
                'biome'=>$localTileNames[$lastColorMatch],
                'captured'=>[['x'=>$minX + $midPoint, 'y'=>$minY]]
            ]);
        }

        // East side!
        $nb = DanDBList("SELECT content FROM sw_biomemap WHERE chunkx=? AND chunkz=?;", 'ii', [$biomeChunkX+1, $biomeChunkY],
                        'server/libs/clustermap.php->ClusterMap2()->get east neighbors');
        if(sizeof($nb)!=0) {
            $nb = json_decode($nb[0]['content']);
            // target content here is the first value of each column
            $yStep = $chunkWidth * $biomeTileSize;
            $lastPoint = 0;
            $lastColorMatch = $nb[0];
            for($y=1; $y<$chunkWidth*$biomeTileSize; $y++) {
                if($nb[$y*$yStep]!=$lastColorMatch) {
                    $midPoint = $lastPoint + floor((($y-1)-$lastPoint)/2.0);
                    array_push($biomePoints, [
                        'x'=>$maxX,
                        'y'=>$minY + $midPoint,
                        'biome'=>$localTileNames[$lastColorMatch],
                        'captured'=>[['x'=>$maxX, 'y'=>$minY + $midPoint]]
                    ]);
                }
                $lastPoint = $y;
                $lastColorMatch = $nb[$y*$yStep];
            }
            $midPoint = $lastPoint + floor(($maxY-$lastPoint)/2.0);
            reporterror('server/libs/clustermap.php->ClusterMap2()->east side', 'final midPoint='. $midPoint .' to be '. $lastColorMatch .' aka '. $localTileNames[$lastColorMatch]);
            array_push($biomePoints, [
                'x'=>$maxX,
                'y'=>$minY + $midPoint,
                'biome'=> $localTileNames[$lastColorMatch],
                'captured'=>[['x'=>$maxX, 'y'=>$minY + $midPoint]]
            ]);
        }

        // South side!
        $nb = DanDBList("SELECT content FROM sw_biomemap WHERE chunkx=? AND chunkz=?;", 'ii', [$biomeChunkX, $biomeChunkY+1],
                        'server/libs/clustermap.php->ClusterMap2()->get south neighbor');
        if(sizeof($nb)!=0) {
            $nb = json_decode($nb[0]['content']);
            // target content here is across the top - the first slots of the array
            $lastPoint = 0;
            $lastColorMatch = $nb[0];
            for($x=1; $x<$chunkWidth*$biomeTileSize; $x++) {
                if($nb[$x]!=$lastColorMatch) {
                    $midPoint = $lastPoint + floor((($x-1)-$lastPoint)/2.0);
                    array_push($biomePoints, [
                        'x'=>$minX + $midPoint,
                        'y'=>$maxY,
                        'biome'=>$localTileNames[$lastColorMatch],
                        'captured'=>[['x'=>$minX+$midPoint, 'y'=>$maxY]]
                    ]);
                }
                $lastPoint = $x;
                $lastColorMatch = $nb[$x];
            }
            $midPoint = $lastPoint + floor(($maxX-$lastPoint)/2.0);
            reporterror('server/libs/clustermap.php->ClusterMap2()->south side', 'final midPoint='. $midPoint .' to be '. $lastColorMatch .' aka '. $localTileNames[$lastColorMatch]);
            array_push($biomePoints, [
                'x'=>$minX + $midPoint,
                'y'=>$maxY,
                'biome'=>$localTileNames[$lastColorMatch],
                'captured'=>[['x'=>$minX + $midPoint, 'y'=>$maxY]]
            ]);
        }

        // West side!
        $nb = DanDBList("SELECT content FROM sw_biomemap WHERE chunkx=? AND chunkz=?;", 'ii', [$biomeChunkX-1, $biomeChunkY],
                        'server/libs/clustermap.hpp->ClusterMap2()->get west neighbor');
        if(sizeof($nb)!=0) {
            $nb = json_decode($nb[0]['content']);
            // target content is the last column of each row
            $xShift = $chunkWidth * $biomeTileSize -1;
            $yStep = $chunkWidth * $biomeTileSize;
            $lastPoint = 0;
            $lastColorMatch = $nb[$xShift];
            for($y=1; $y<$chunkWidth*$biomeTileSize; $y++) {
                if($nb[$y*$yStep+$xShift]!=$lastColorMatch) {
                    $midPoint = $lastPoint + floor((($y-1)-$lastPoint)/2.0);
                    array_push($biomePoints, [
                        'x'=>$minX,
                        'y'=>$minY +$midPoint,
                        'biome'=>$localTileNames[$lastColorMatch],
                        'captured'=>[['x'=>$minX, 'y'=>$minY+$midPoint]]
                    ]);
                }
                $lastPoint = $x;
                $lastColorMatch = $nb[$y*$yStep+$xShift];
            }
            $midPoint = $lastPoint + floor(($maxY-$lastPoint)/2.0);
            reporterror('server/libs/clustermap.php->ClusterMap2()->west side', 'final midPoint='. $midPoint .' to be '. $lastColorMatch .' aka '. $localTileNames[$lastColorMatch]);
            array_push($biomePoints, [
                'x'=>$minX,
                'y'=>$minY +$midPoint,
                'biome'=>$localTileNames[$lastColorMatch],
                'captured'=>[['x'=>$minX, 'y'=>$minY+$midPoint]]
            ]);
        }

        /*
        // Next, factor in neighboring content. We will add additional biome points for all sides, trying to center them based on the
        // extent of each 'face'
        reporterror('server/libs/clustermap.php->ClusterMap2()->before existing', 'Building map for ['. $minX .'-'. $maxX .']['. $minY .'-'. $maxY .']');
        reporterror('server/libs/clustermap.php->ClusterMap2()->before existing additions', 'existing map has range ['. $existingMap->minx .'-'. $existingMap->maxx .']['. $existingMap->miny .'-'. $existingMap->maxy .']');
        if(!is_array($existingMap)) {
            if(!is_null($existingMap->minx)) {
                // For each side, first check if we have any content in that direction
                if($existingMap->miny < $minY) {  // Top side!
                    $lastPoint = 0;
                    $lastColorMatch = $existingMap->get($minX, $minY-1)['landType'];
                    reporterror('server/libs/clustermap.php->ClusterMap2()->top side', 'top: '. $existingMap->get($minX, $minY-1)['landType']);
                    for($x=$minX; $x<=$maxX; $x++) {
                        if(gettype($lastColorMatch)!=='string') {
                            reporterror('server/libs/clustermap.php->ClusterMap2()->top side', 'Error: invalid colorMatch (type='. gettype($lastColorMatch) .') from ['. $x .','. ($minY-1) .']. value='. json_encode($existingMap->get($x,$minY-1)));
                            $lastColorMatch = $existingMap->get($x, $minY-1)['landType'];
                        }
                        if($existingMap->get($x, $minY-1)['landType']==$lastColorMatch) {
                            // No change; extend existing range
                            //$spans++;
                        }else{
                            // This is a new tile type. Apply a new biome point just south of here
                            $range = ($x-1)-$lastPoint;
                            $midPoint = $lastPoint + floor($range/2.0);
                            array_push($biomePoints, [
                                'x'=>$midPoint,
                                'y'=>$minY,
                                'biome'=>$lastColorMatch,
                                'captured'=>[['x'=>$midPoint, 'y'=>$minY]]
                            ]);
                            // reset the important variables
                            $lastPoint = $x;
                            $lastColorMatch = $existingMap->get($x, $minY-1)['landType'];
                        }
                    }
                    // Add an additional point for the last section. There will always be at least one biome point added for an existing side
                    $range = $maxX-$lastPoint;
                    $midPoint = $lastPoint + floor($range/2.0);
                    array_push($biomePoints, [
                        'x'=>$midPoint,
                        'y'=>$minY,
                        'biome'=>$lastColorMatch,
                        'captured'=>[['x'=>$midPoint, 'y'=>$minY]]
                    ]);
                }
                if($existingMap->maxx > $maxX) { // right side!
                    $lastPoint = 0;
                    $lastColorMatch = $existingMap->get($maxX+1, $minY)['landType'];
                    reporterror('server/libs/clustermap.php->ClusterMap2()->right side', 'right: '. $existingMap->get($maxX+1, $minY)['landType']);
                    for($y=$minY; $y<=$maxY; $y++) {
                        if(gettype($lastColorMatch)!=='string') {
                            reporterror('server/libs/clustermap.php->ClusterMap2()->right side', 'Error: invalid colorMatch (type='. gettype($lastColorMatch) .') from ['. ($maxX+1) .','. $y .']. value='. json_encode($existingMap->get($maxX+1,$y)));
                            $lastColorMatch = $existingMap->get($maxX+1, $y)['landType'];
                        }
                        if($existingMap->get($maxX+1, $y)['landType']!=$lastColorMatch) {
                            // We'll condense the math from now on
                            $midPoint = $lastPoint + floor((($y-1)-$lastPoint)/2);
                            array_push($biomePoints, [
                                'x'=>$maxX,
                                'y'=>$midPoint,
                                'biome'=>$lastColorMatch,
                                'captured'=>[['x'=>$maxX, 'y'=>$midPoint]]
                            ]);
                            $lastPoint = $y;
                            $lastColorMatch = $existingMap->get($maxX+1, $y)['landType'];
                        }
                    }
                    $midPoint = $lastPoint + floor(($maxY-$lastPoint)/2);
                    array_push($biomePoints, [
                        'x'=>$maxX,
                        'y'=>$midPoint,
                        'biome'=>$lastColorMatch,
                        'captured'=>[['x'=>$maxX, 'y'=>$midPoint]]
                    ]);
                }
                if($existingMap->maxy > $maxY) { // bottom side!
                    $lastPoint = 0;
                    $lastColorMatch = $existingMap->get($minX, $maxY+1)['landType'];
                    reporterror('server/libs/clustermap.php->ClusterMap2()->bottom side', 'bottom: '. $existingMap->get($minX, $maxY+1)['landType']);
                    for($x=$minX; $x<=$maxX; $x++) {
                        if(gettype($lastColorMatch)!=='string') {
                            reporterror('server/libs/clustermap.php->ClusterMap2()->bottom side', 'Error: invalid colorMatch (type='. gettype($lastColorMatch) .') from ['. $x .','. ($maxY+1) .']. value='. json_encode($existingMap->get($x,$maxY+1)));
                            $lastColorMatch = $existingMap->get($x, $maxY+1)['landType'];
                        }
                        if($existingMap->get($x, $maxY+1)['landType']!=$lastColorMatch) {
                            $midPoint = $lastPoint + floor((($x-1)-$lastPoint)/2);
                            array_push($biomePoints, [
                                'x'=>$midPoint,
                                'y'=>$maxY,
                                'biome'=>$lastColorMatch,
                                'captured'=>[['x'=>$midPoint, 'y'=>$maxY]]
                            ]);
                            $lastPoint = $x;
                            $lastColorMatch = $existingMap->get($x, $maxY+1)['landType'];
                        }
                    }
                    $midPoint = $lastPoint + floor(($maxX-$lastPoint)/2);
                    array_push($biomePoints, [
                        'x'=>$midPoint,
                        'y'=>$maxY,
                        'biome'=>$lastColorMatch,
                        'captured'=>[['x'=>$midPoint, 'y'=>$maxY]]
                    ]);
                }
                if($existingMap->minx < $minX) { // left side!
                    $lastPoint = 0;
                    $lastColorMatch = $existingMap->get($minX-1, $minY)['landType'];
                    reporterror('server/libs/clustermap.php->ClusterMap2()->left side', 'left: '. $existingMap->get($minX-1, $minY)['landType']);
                    for($y=$minY; $y<=$maxY; $y++) {
                        if(gettype($lastColorMatch)!=='string') {
                            reporterror('server/libs/clustermap.php->ClusterMap2()->left side', 'Error: invalid colorMatch (type='. gettype($lastColorMatch) .') from ['. ($minX-1) .','. $y .']. value='. json_encode($existingMap->get($minX-1,$y)));
                            $lastColorMatch = $existingMap->get($minX-1, $y)['landType'];
                        }
                        if($existingMap->get($minX-1, $y)['landType']!=$lastColorMatch) {
                            $midPoint = $lastPoint + floor((($y-1)-$lastPoint)/2);
                            array_push($biomePoints, [
                                'x'=>$minX,
                                'y'=>$midPoint,
                                'biome'=>$lastColorMatch,
                                'captured'=>[['x'=>$minX, 'y'=>$midPoint]]
                            ]);
                            $lastPoint = $y;
                            $lastColorMatch = $existingMap->get($minX-1, $y)['landType'];
                        }
                    }
                    $midPoint = $lastPoint +floor(($maxY-$lastPoint)/2);
                    array_push($biomePoints, [
                        'x'=>$minX,
                        'y'=>$midPoint,
                        'biome'=>$lastColorMatch,
                        'captured'=>[['x'=>$minX, 'y'=>$midPoint]]
                    ]);
                }
            }
        }
        */

        reporterror('server/libs/clustermap.php->ClusterMap2()->pre main loop', 'biome points was '. $oldSize .', is now '. sizeof($biomePoints));
        reporterror('server/libs/clustermap.php->ClusterMap2()->pre main loop', 'biome points: '. $biomePoints[0]['biome'] .' to '. $biomePoints[sizeof($biomePoints)-1]['biome']);
        // With each biome point decided now, we need to mark each of these tiles on the final map as the picked tile type
        for($i=0; $i<sizeof($biomePoints); $i++) {
            if(gettype($biomePoints[$i]['biome'])!=='string')
                reporterror('server/libs/clustermap.php->ClusterMap2()->paste to map', 'Error: land type of biomePoint['. $i .'] is of type '. gettype($biomePoints[$i]['biome']));
            $fullMap->append($biomePoints[$i]['x'], $biomePoints[$i]['y'], 'landType', $biomePoints[$i]['biome']);
        }

        // Now we're ready to run the primary loop
        while(sizeof($biomePoints)>0) {
            foreach($biomePoints as &$group) { // group gets modified here, so we must pass by reference
                $targetSlot = rand(0,sizeof($group['captured'])-1);
                $target = $group['captured'][$targetSlot];
                $choices = $directionMap[rand(0,sizeof($directionMap)-1)];
                $flagged = 0;
                for($dir=0; $dir<4; $dir++) {
                    $spotX = $target['x'] + $choices[$dir]['x'];
                    $spotY = $target['y'] + $choices[$dir]['y'];

                    // Keep within the map's boundaries
                    if(within($spotX, $minX, $maxX, true) && within($spotY, $minY, $maxY, true)) {
                        if($flagged==0) {
                            if($fullMap->get($spotX, $spotY)['landType']==-1) {
                                // This is a good spot to expand this cluster to. Mark this as this tile's land type, and add this
                                // location to the list of captured locations. We will keep this location entry, as other blocks
                                // around it might be able to be captured as well
                                $fullMap->append($spotX, $spotY, 'landType', $group['biome']);
                                array_push($group['captured'], ['x'=>$spotX, 'y'=>$spotY]);
                                $flagged = 1;
                                break;
                            }
                        }
                    }
                }
                // If we go through all 4 directions without any hits, this location needs to be removed
                if($flagged==0) array_splice($group['captured'], $targetSlot, 1);
            }

            // With this cycle of the primary loop complete, find any clusters that have no more captured tiles. They need to be removed
            $biomePoints = array_filter($biomePoints, function($ele) {
                if(sizeof($ele['captured'])>0) return true;
                return false;
            });
        }
        return $fullMap;
    }

    // We're keeping this old function in case the new one never works
    function ClusterMap($minX, $maxX, $minY, $maxY, $biomeGroup, $biomeDensity, $existingMap) {
        // Generates and returns a new cluster map
        // $minX, $maxX, $minY, $maxY - range of points that will be added to the map
        // $biomeGroup - a WeightedRandom class instance containing each biome and the probability of seeing it. This affects the number of
        //      section types, not how large they can be
        // $biomeDensity - How many cluster instances to generate on the given map; indirectly determines the size of each biome
        // $existingMap - (not used yet) existing content of the map that the generated map will connect to. This ensures that biomes on the
        //      edge of the existing map will be shared with the new map area, creating a seamless crossing
        // Returns a list of objects representing the map. Each contains an X & Y coordinate and a biome value

        global $directionMap;
        srand(time());

        // The algorithm strategy here is simple. Start with a set of randomly placed points. These will hold a list of tiles that can be
        // expanded from, potentially (starting from 1 tile). Each cycle, for each point we will select a tile from its list at random, and
        // try to expand in any direction from it. For the list of tiles, when the selected tile cannot be expanded from (including being part
        // of its own point), the point will abandon that tile. The point will be 'finished' (and removed) when there are no tiles left to
        // expand from. Eventually, all points will exhaust their tiles list.

        // Start with building a 2D array of map plots, with default data
        $fullMap = forrange($minY, $maxY, 1, function($y) use ($minX, $maxX) {
            return forrange($minX, $maxX, 1, function($x) use ($y) {
                return ['x'=>$x, 'y'=>$y, 'landType'=>-1];
                // This generateClusterMap() is only responsible for determining the land types. Everything else can be appended to this later
            }, 'server/libs/clustermap.php->ClusterMap()->build x');
        }, 'server/libs/clustermap.php->ClusterMap()->build y');

        $mapSizeX = $maxX-$minX;
        $mapSizeY = $maxY-$minY;
        if($mapSizeX==0) {
            reporterror('server/libs/clustermap.php->ClusterMap()->before points placement', 'Error - map provided is 0 tiles wide (from '. $minX .' to '. $maxX .'). Check parameters');
            return [];
        }
        if($mapSizeY==0) {
            reporterror('server/libs/clustermap.php->ClusterMap()->before points placement', 'Error - map provided is 0 tiles tall (from '. $minY .' to '. $maxY .'). Check parameters');
            return [];
        }
        $pointCount = floor(($mapSizeX * $mapSizeY) / $biomeDensity);
        //reporterror('server/libs/clustermap.php->ClusterMap()->before points placement', '['. $minX .'-'. $maxX .']['. $minY .'-'. $maxY .']');
        //reporterror('server/libs/clustermap.php->ClusterMap()->before points placement', 'for a map of ['. $mapSizeX .','. $mapSizeY .'] we have '. $pointCount .' points to start from');

        // Create a set of cluster points, to coordinate growing the clusters from
        $biomePoints = forrange(0, $pointCount-1, 1, function($i) use ($minX, $maxX, $minY, $maxY, $biomeGroup) {
            $genX = rand($minX, $maxX);
            $genY = rand($minY, $maxY);
            $biome = $biomeGroup->cyclePull();
            $fullMap[$genX][$genY]['landType'] = $biome;
            return [
                'x'=>$genX,
                'y'=>$genY,
                'biome'=>$biome,
                'captured'=>[['x'=>$genX, 'y'=>$genY]]  // This is a list of all the tiles that still need processing for this cluster
            ];
        }, 'server/libs/clustermap.php->ClusterMap()->biome points');
        //reporterror('server/libs/clustermap.php->ClusterMap()->after biome points creation', json_encode($biomePoints));

        // Run through all the biome points and try to expand each one. Continue until all points can't expand
        while(sizeof($biomePoints)>0) {
            foreach($biomePoints as &$group) { // $group gets modified here, so we must pass by reference
                $targetSlot = rand(0,sizeof($group['captured'])-1);  // This is the point we're expanding, today
                $target = $group['captured'][$targetSlot];
                $choices = $directionMap[rand(0,sizeof($directionMap)-1)]; // Select one of the direction lists, at random
                $flagged = 0;
                for($dir=0; $dir<4; $dir++) {
                    $spotX = $target['x'] +$choices[$dir]['x'];
                    $spotY = $target['y'] +$choices[$dir]['y'];

                    //reporterror('server/libs/clustermap.php->ClusterMap()->middle step',
                    //            'targetSlot='. $targetSlot .', target='. json_encode($target) .', choices='. json_encode($choices[$dir]) .', '.
                    //            'within('. $spotX .','. $minX .','. $maxX .') && within('. $spotY .','. $minY .','. $maxY .'), flagged='. $flagged);

                    // Make sure we're not out of the map bounds
                    if(within($spotX, $minX, $maxX, true) && within($spotY, $minY, $maxY, true)) {
                        if($flagged==0) {
                            if($fullMap[$spotX][$spotY]['landType']==-1) {
                                // This is a good spot to expand this cluster to. Mark this as this biome's land type, and add this location
                                // to the list of captured locations. We will keep this location entry, as other nearby blocks might be
                                // able to be captured as well
                                $fullMap[$spotX][$spotY]['landType'] = $group['biome'];
                                array_push($group['captured'], ['x'=>$spotX, 'y'=>$spotY]);
                                $flagged = 1;
                                break;
                            }
                        }
                    }
                }
                if($flagged==0) {
                    // We went through all 4 directions and didn't find a hit. This location needs to be removed
                    array_splice($group['captured'], $targetSlot, 1);
                }
            }
            //reporterror('server/libs/clustermap.php->ClusterMap->post-step', json_encode($biomePoints));
            //reporterror('server/libs/clustermap.php->ClusterMap->post-step2', 'There are '. sizeof($biomePoints) .' points remaining');

            // With the primary loop complete, we now need to remove any clusters that have no more captured tiles (because no captured tiles
            // can be expanded any more)
            $biomePoints = array_filter($biomePoints, function($ele) {
                //return sizeof($ele['captured'])>0;
                if(sizeof($ele['captured'])>0) return true;
                return false;
            });
        }
        // With no more biome points existing, our map is complete.
        return $fullMap;
    }

    function within($val, $min, $max, $inclusive) {
        // returns true if $val falls within $min and $max
        // We had goodSpot() for this job, but it expected fixed boundaries
    
        if($inclusive) return $val >= $min && $val <= $max;
        return $val > $min && $val < $max;
    }

    define('x', 'x');
    define('y', 'y');
    $directionMap = [
        [[x=> 0, y=>-1], [x=> 1, y=> 0], [x=> 0, y=> 1], [x=>-1, y=> 0]],
        [[x=> 0, y=>-1], [x=> 1, y=> 0], [x=>-1, y=> 0], [x=> 0, y=> 1]],
        [[x=> 0, y=>-1], [x=> 0, y=> 1], [x=> 1, y=> 0], [x=>-1, y=> 0]],
        [[x=> 0, y=>-1], [x=> 0, y=> 1], [x=>-1, y=> 0], [x=> 1, y=> 0]],
        [[x=> 0, y=>-1], [x=>-1, y=> 0], [x=> 1, y=> 0], [x=> 0, y=> 1]],
        [[x=> 0, y=>-1], [x=>-1, y=> 0], [x=> 0, y=> 1], [x=> 1, y=> 0]],
        [[x=> 1, y=> 0], [x=> 0, y=>-1], [x=> 0, y=> 1], [x=>-1, y=> 0]],
        [[x=> 1, y=> 0], [x=> 0, y=>-1], [x=>-1, y=> 0], [x=> 0, y=> 1]],
        [[x=> 1, y=> 0], [x=> 0, y=> 1], [x=> 0, y=>-1], [x=>-1, y=> 0]],
        [[x=> 1, y=> 0], [x=> 0, y=> 1], [x=>-1, y=> 0], [x=> 0, y=>-1]],
        [[x=> 1, y=> 0], [x=>-1, y=> 0], [x=> 0, y=>-1], [x=> 0, y=> 1]],
        [[x=> 1, y=> 0], [x=>-1, y=> 0], [x=> 0, y=> 1], [x=> 0, y=>-1]],
        [[x=> 0, y=> 1], [x=> 0, y=>-1], [x=> 1, y=> 0], [x=>-1, y=> 0]],
        [[x=> 0, y=> 1], [x=> 0, y=>-1], [x=>-1, y=> 0], [x=> 1, y=> 0]],
        [[x=> 0, y=> 1], [x=> 1, y=> 0], [x=> 0, y=>-1], [x=>-1, y=> 0]],
        [[x=> 0, y=> 1], [x=> 1, y=> 0], [x=>-1, y=> 0], [x=> 0, y=>-1]],
        [[x=> 0, y=> 1], [x=>-1, y=> 0], [x=> 0, y=>-1], [x=> 1, y=> 0]],
        [[x=> 0, y=> 1], [x=>-1, y=> 0], [x=> 1, y=> 0], [x=> 0, y=>-1]],
        [[x=>-1, y=> 0], [x=> 0, y=>-1], [x=> 1, y=> 0], [x=> 0, y=> 1]],
        [[x=>-1, y=> 0], [x=> 0, y=>-1], [x=> 0, y=> 1], [x=> 1, y=> 0]],
        [[x=>-1, y=> 0], [x=> 1, y=> 0], [x=> 0, y=>-1], [x=> 0, y=> 1]],
        [[x=>-1, y=> 0], [x=> 1, y=> 0], [x=> 0, y=> 1], [x=> 0, y=>-1]],
        [[x=>-1, y=> 0], [x=> 0, y=> 1], [x=> 1, y=> 0], [x=> 0, y=> 1]],
        [[x=>-1, y=> 0], [x=> 0, y=> 1], [x=> 0, y=> 1], [x=> 1, y=> 0]]
    ];