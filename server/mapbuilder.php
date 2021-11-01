<?php
    // mapbuilder.php
    // Functions that handle generating world map data and local map data
    // for the game Settlers & Warlords
    
    function randfloat() {
        // Returns a random float value between 0 and 1.
        return mt_rand(0, PHP_INT_MAX)/PHP_INT_MAX;
    }

    function within($val, $min, $max, $inclusive) {
        // returns true if $val falls within $min and $max
        // We had goodSpot() for this job, but it expected fixed boundaries

        if($inclusive) return $val >= $min && $val <= $max;
        return $val > $min && $val < $max;
    }

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

    function worldmap_generate() {
        // Our goal will be to create an area that spans from -50 to +50 in both x and y directions. At the same time, we will set global
        // variables to help control where the next player will spawn at

        global $db;
        global $civilizations;
        global $biomeData;

        $mapsize = 101;
        $mapminx = -50; $mapmaxx = 50;
        $mapminy = -50; $mapmaxy = 50;
        $civdensity = 5;
        
        // We need to generate the clustered map, as a base. This has been moved to its own function, since the clustering system is
        // also done on the localmap, too.
        $fullMap = generateClusterMap(-50, 50, -50, 50, new WeightedRandom([
            ['name'=>'grassland', 'amount'=>10],
            ['name'=>'forest', 'amount'=>10],
            ['name'=>'desert', 'amount'=>7],
            ['name'=>'swamp', 'amount'=>6],
            ['name'=>'water', 'amount'=>12],
            ['name'=>'jungle', 'amount'=>9]
        ]), 25);

        // We need to convert our biome names to an ID, as it matches the indexing of other parts, including the database
        reporterror('server/mapbuilder.php->worldmap_generate()->before landType update', 'Center land type='. $fullMap[0][0]['landType']);
        $fullMap = array_map(function($long) {
            return array_map(function($wide) {
                global $worldBiomes;
                $wide['landType'] = array_search($wide['landType'], $worldBiomes);
                return $wide;
            }, $long);
        }, $fullMap);
        reporterror('server/mapbuilder.php->worldmap_generate()->after landType update', 'Center  land type='. $fullMap[0][0]['landType']);

        // Place down some civilizations. Civilization choices will be determined by land types, so we need to determine which
        // biome we're at before deciding a civilization there
        $civcount = floor(($mapsize * $mapsize) / $civdensity);
        for($i=0; $i<$civcount; $i++) {
            $xspot = rand($mapminx, $mapmaxx);
            $yspot = rand($mapminy, $mapmaxy);
            // First, make sure there isn't already a civilization here. If so, find a new place
            if(isset($fullMap[$xspot][$yspot]['civ'])) {
                $i--;
            }else{
                // Since civilizations are stored in order, we can use the land type value to select which list of civilizations
                // to pick from, which will match the correct biome
                $fullMap[$xspot][$yspot]['civ'] = $biomeData[$fullMap[$xspot][$yspot]['landType']]['civs']->cyclepull();
                // Some civilizations can alter the biome they are in. Let's do that now
                if($fullMap[$xspot][$yspot]['civ'] == 'ice horrors') {
                    $fullMap[$xspot][$yspot]['landType'] = 7;//'frozen wasteland';
                }
                if($fullMap[$xspot][$yspot]['civ'] == 'ork tribe') {
                    $fullMap[$xspot][$yspot]['landType'] = 6;//'lavascape';
                }
                // Also include a strength of this civilization. We want to display lots of abandoned civilization places, too
                // Anything zero is considered abandoned, so the real range is from 0 to 3
                $fullMap[$xspot][$yspot]['civstrength'] = max(0, randfloat()*4.5-1.5);
            }
        }
        
        // Now we need to save this to the database.
        // Rather than running 101x101 queries, we need to build this into a full string. This is the part where we add additional
        // land parameters
        // The first one will be the underground resource type, which can be any of the following:
        // 0: Coal
        // 1: Banded iron
        // 2: Cassiterite (source of tin)
        // 3: Chalcopyrite (source of copper)
        // 4: Aluminum
        // 5: Bauxite (aluminum and titanium - requires advanced tech to extract, though
        // 6: Stibnite (sulfur-rich antimony)
        // 7: Limonite (more iron)
        // 8: Magnetite (iron used for magnets)
        // 9: Lignite coal (yields less coal than regular)
        // 10: Tin
        // 11: Copper
        // 12: Silicon
        // 13: Lithium
        // We may add more in the future. We may later decide to add a more balance-controlled random, but this will do for now.
        // We also need to determine how much of that resource will be there. This will be a float value ranging from 0.5 to 2.
        // We need to fit a value X between a range of 0.5 and 2.0. It starts out as between 0 and 1.
        // x = (0 to 1) * 1.5
        // x = (0 to 1.5) + 0.5
        // x = (0.5 to 2.0)

        // So, we have the data stored in a 2D array, but still need to insert one at a time
        $comm = $db->prepare('INSERT INTO sw_map (x, y, biome, ugresource, ugamount, civilization, civlevel) VALUES (?,?,?,?,?,?,?);');
        if(!$comm) {
            reporterror('server/mapbuilder.php->worldmap_generate()->save map', 'query preparation failed');
            return null;
        }
        foreach($fullMap as $long) {
            foreach($long as $wide) {
                global $civData;
                // We have a few variables left to determine. One is the civilization type, which is reduced to a number
                $civ = -1;
                $civLevel = 0;
                if(isset($wide['civ'])) {
                    // Before we can save, we need to convert our civ value to an int. Best to do that before returning a value...
                    $civObj = JSFind($civData, function($civ) use ($wide) {
                        return strtolower($civ['name']) === strtolower($wide['civ']);
                    });
                    if($civObj==null) {
                        reporterror('server/mapbuilder.php->worldmap_generate()', 'Error: civilization '. $wide['civ'] .' not found');
                    }else{
                        $civ = $civObj['id'];
                        $civLevel = $wide['civstrength'];
                    }
                }
                $ugtype = rand(0,13);
                $ugamt  = randfloat()*1.5+0.5;
                $comm->bind_param('iiiidid', $wide['x'], $wide['y'], $wide['landType'], $ugtype, $ugamt, $civ, $civLevel);
                if(!$comm->execute()) {
                    reporterror('server/mapbuilder.php->worldmap_generate()', 'Query execution failed. Mysql says '. mysqli_error($db));
                    return null;
                }        
            }
        }
    }

    function ensureMinimapXY($worldx, $worldy, $newPlayer) {
        // Allows you to create a minimap based on world coordinates, if you don't (yet) have the map object from the database
        ensureMinimap(DanDBList("SELECT * FROM sw_map WHERE x=? AND y=?;", 'ii', [$worldx,$worldy],
                                'sever/mapbuilder.php->ensureMinimapXY()')[0], $newPlayer);
        /*
        ensureMinimap(danget("SELECT * FROM sw_map WHERE x=". $worldx ." AND y=". $worldy .";",
                             'server/mapbuilder.php->generateminimapbycoords'));*/
    }

    function ensureMinimapId($worldcoordid, $newPlayer) {
        // Allows you to create a minimap based on a world coordinate ID.
        ensureMinimap(DanDBList("SELECT * FROM sw_map WHERE id=?;", 'i', [$worldcoordid],
                                'server/mapbuilder.php->ensureMinimapId()')[0], $newPlayer);
        /*ensureMinimap(danget("SELECT * FROM sw_map WHERE id=". $worldcoordid .";",
                             'server/mapbuilder.php->generateminimapfromid'));*/
    }

    function ensureMinimap($worldTile, $newPlayer) {
        // Allows us to ensure that a minimap exists for a given world map location. If none exists, one will be created for it.
        // $worldTile: full data package as received from the database about this world location
        // $newPlayer: set to true if this is for a new player. This will ensure at least 1 rock tile and 5 tree tiles exist
        //      on the map somewhere, along with 4 workers

        // Generates a minimap. Requires a full read-out of the world map coordinate from the database.  Use either
        // generateminimapfromcoords or generateminimapfromid to grab that data.

        // At some point, we may want to consider the land types of surrounding territories. But for now, we won't worry about it.

        global $db;
        global $biomeData;

        $localMapWidth = 40;
        $localMapHeight = 40;

        // Start by ensuring there is no minimap data here yet already
        if(sizeof(DanDBList("SELECT x FROM sw_minimap WHERE mapid=? LIMIT 1;", 'i', [$worldTile['id']],
                  'server/mapbuilder.php->generateminimap()->check existence of minimap'))>0)
            return;
        
        // Let's start with a chart to determing the likelihood of each land type, given the selected biome.
        // I was going to add it here, but instead, added it to the biomeData structure, as it's already built based on biome
        
        // Generate a clustered map based on the biome selected
        $localTiles = generateClusterMap(0,$localMapWidth,0,$localMapHeight,$biomeData[$worldTile['biome']]['localTiles'], 25);
        /*
        // For new players, check that they have the starting essentials
        if($newPlayer) {
            $passingSet = array_reduce($localTiles, function($carryLong, $long) {
                return array_reduce($long, function($carry, $item) {
                    if($item['landType']==='rock') {
                        $carry['rock'] +=1;
                        return $carry;
                    }
                    if($item['landType']==='trees') {
                        $carry['trees'] +=1;
                        return $carry;
                    }
                    if($item['landType']==='water') {
                        $carry['water'] +=1;
                        return $carry;
                    }
                    return $carry; // This item didn't fit any of the targets. Pass the same list forward
                }, $carryLong);
            }, ['rock'=>0, 'trees'=>0, 'water'=>0]);

            // If any are missing or insufficient, find places in the map (at random) to fill in
            if($passingSet['trees']<5) {
                reporterror('server/mapbuilder.php->ensureMinimap()->new-player checks',
                            'Notice: localMap only has '. $passingSet['trees'] .' trees. Adding more manually');
                for($i=$passingSet['trees'];$i<=5;$i++) {
                    $localTiles[mt_rand(0,$localMapHeight)][mt_rand(0,$localMapWidth)]['landType'] = 'trees';
                }
            }
            if($passingSet['rock']<1) {
                reporterror('server/mapbuilder.php->ensureMinimap()->new-player checks',
                            'Notice: localMap only has '. $passingSet['rock'] .' rocks. Adding more manually');
                $localTiles[mt_rand(0,$localMapHeight)][mt_rand(0,$localMapWidth)]['landType'] = 'rock';
            }
            if($passingSet['water']<1) {
                reporterror('server/mapbuilder.php->ensureMinimap()->new-player checks',
                            'Notice: localMap only has '. $passingSet['water'] .' water. Adding more manually');
                $localTiles[mt_rand(0,$localMapHeight)][mt_rand(0,$localMapWidth)]['landType'] = 'water';
            }
        }
            
        // Convert the tile type names to the correct tile type ID
        $localTiles = array_map(function($long) {
            return array_map(function($wide) {
                global $localTileNames;
                $wide['landType'] = array_search($wide['landType'], $localTileNames);
                return $wide;
            }, $long);
        }, $localTiles);

        // This should be all we need to do here, except for saving the content... which needs to be in a DB-ready format. Convert to string!
        $built = implode(',', array_map(function($long) use ($worldTile) {
            return implode(',', array_map(function($wide) use ($worldTile) {
                return '('. $worldTile['id'] .','. $wide['x'] .','. $wide['y'] .','. $wide['landType'] .')';
                // We don't need to include the building ID of 0, since this is a default in the DB
            }, $long));
        }, $localTiles));

        // We should be all set to save all the data
        $db->query("INSERT INTO sw_minimap (mapid,x,y,landtype) VALUES ". $built .";");
        $err = mysqli_error($db);
        if($err) {
            reporterror('server/mapbuilder.php->generateminimap()->save new map data', 'MySQL reported an error: '. $err);
            ajaxreject('internal', 'There was an error saving worldmap data. See the error log');
        }
        */
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

    function advanceStartPos($level, $mode, $count) {
        // Determines where the next position for new players should be. Returns an array of elements for the next place

        $limit = 0;  // This determines how far along
        switch($mode) {
            case 0: case 2: $limit = $level*2+1; break;
            case 1: case 3: $limit = $level*2-1; break;
        }
        if($level==0) {
            $level = 1;
            $mode = 0;
            $count = 0;
        }else{

            $count++;
            if($count>$limit) {
                $count=0;
                $mode++;
                if($mode>4) {
                    $mode = 0;
                    $level++;
                }
            }
        }
        return array(
            'level'=>$level,
            'mode'=>$mode,
            'count'=>$count
        );
    }
?>

