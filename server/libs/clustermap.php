<?php
    /*  clustermap.php
        A function to generate a map using a cluster based algorithm
        For the game Settlers & Warlords
    */

    // This uses multiple functions from jsarray to do its job
    require_once("jsarray.php");

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