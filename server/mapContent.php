<?php
/*  mapContent.php
    Has multiple functions related to creating maps, and other similar tasks
    For the game Settlers & Warlords
*/

function within($val, $min, $max, $inclusive) {
    // returns true if $val falls within $min and $max
    // We had goodSpot() for this job, but it expected fixed boundaries

    if($inclusive) return $val >= $min && $val <= $max;
    return $val > $min && $val < $max;
}

function randomFloat() {
    // Returns a random float value between 0 and 1.
    return mt_rand(0, PHP_INT_MAX)/PHP_INT_MAX;
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
    for($y=0;$y<40;$y++) {
        $localTiles[$startX][$y]['landType'] = 'stream';
        $slideCounter++;
        if($slideCounter>$slideRate && $slideRate!==0) {
            $startX += $slideDirection;
            if($startX<0 || $startX>=40) break;
        }
    }

    // Now, for new players, ensure that they have some basic elements for starting out. Since we now have streams anyway,
    // just check for trees and some rocks
    if($newPlayer) {
        $passingSet = array_reduce($localTiles, function($carrying, $long) {
            return array_reduce($long, function($carry, $item) {
                if($item['landType']==='rock') {
                    $carry['rock'] +=1;
                    return $carry;
                }
                if($item['landType']==='maple') {
                    $carry['maple'] +=1;
                    return $carry;
                }
                return $carry; // This item didn't fit any of the targets. Pass the same list forward
            }, $carrying);
        }, ['rock'=>0, 'maple'=>0]);

        // If any are missing or insufficient, pick random places on the map to fill it in
        if($passingSet['maple']<5) {
            reporterror('server/mapContent.php->ensureMinimap()->new player checks',
                        'Notice: localMap only has '. $passingSet['maple'] .' maple trees. Adding more manually');
            for($i=$passingSet['maple'];$i<=5;$i++) {
                $localTiles[mt_rand(0,$localMapHeight)][mt_rand(0,$localMapWidth)]['landType'] = 'maple';
            }
        }
        if($passingSet['rock']<1) {
            reporterror('server/mapContent.php->ensureMinimap()->new player checks', 'Noticed: localMap has no rocks. Adding one manually');
            $localTiles[mt_rand(0,$localMapHeight)][mt_rand(0,$localMapWidth)]['landType'] = 'rock';
        }
    }

    // Now, we need to fill out these tiles with additional item content. Usually for forest tiles, this will be trees of various sizes
    // We don't really have much to fill in here besides trees yet, but we can expand on this later
    $localTiles = array_map(function($long) {
        return array_map(function($wide) {
            switch($wide['landType']) {
                case 'wheat': // Wheat fields
                    $wheatAmount = rand(5,30);
                    $wide['items'] = [
                        ['name'=>'Wheat', 'amount'=>$wheatAmount],
                        ['name'=>'Wheat Seeds', 'amount'=>$wheatAmount/2]
                    ];
                break;
                case 'oat': // Oat fields
                    $oatAmount = rand(5,30);
                    $wide['items'] = [
                        ['name'=>'Oat', 'amount'=>$oatAmount],
                        ['name'=>'Oat Seeds', 'amount'=>$oatAmount]
                    ];
                break;
                case 'rye': // Rye fields
                    $ryeAmount = rand(5,25);
                    $wide['items'] = [
                        ['name'=>'Rye', 'amount'=>$ryeAmount],
                        ['name'=>'Rye Seeds', 'amount'=>$ryeAmount/4]
                    ];
                break;
                case 'barley': // Barley
                    $barleyAmount = rand(3,35);
                    $wide['items'] = [
                        ['name'=>'Barley', 'amount'=>$barleyAmount],
                        ['name'=>'Barley Seeds', 'amount'=>$barleyAmount*1.25]
                    ];
                break;
                case 'millet': // Millet
                    $milletAmount = rand(8,20);
                    $wide['items'] = [
                        ['name'=>'Millet', 'amount'=>$milletAmount],
                        ['name'=>'Millet Seeds', 'amount'=>$milletAmount*.75]
                    ];
                break;
                // I think trees should work a little differently. Each tree will have a fixed size and number of sticks / bark / 
                // fruits on them. But... I guess this can be calculated later on, when we start actually using the trees.
                // We don't even really need a seed count here. When a tree starts getting used, this count will decrement; this
                // also controls 
                case 'maple':
                    $wide['items'] = [ ['name'=>'Maple Tree', 'amount'=>rand(3,12)] ];
                    // Maple trees produce Samaras, the helicopter style seeds, which are edible... we won't include them here
                    if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Log', 'amount'=>rand(1,5)]); // aka 2 in 3 chances of having Fallen Logs here
                break;
                case 'birch':
                    $wide['items'] = [ ['name'=>'Birch Tree', 'amount'=>rand(8,60)] ];
                    // Birch trees are typically tall and narrow, but a lot of them grow in one area
                    // Birch trees produce seeds but aren't edible
                    if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Log', 'amount'=>rand(1,8)]);
                break;
                case 'oak':
                    $wide['items'] = [ ['name'=>'Oak Tree', 'amount'=>rand(4,16)] ];
                    // Oak trees produce acorns... we should add them at some point
                    if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Log', 'amount'=>rand(1,7)]);
                break;
                case 'mahogany':
                    $wide['items'] = [ ['name'=>'Mahogany Tree', 'amount'=>rand(3, 8)] ];
                    // Mahogany trees produce large fruits, and the insides are edible, but the outsides are poisonous
                    if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Log', 'amount'=>rand(1,4)]);
                break;
                case 'pine':
                    $pineAmount = rand(7,20);
                    $wide['items'] = [ ['name'=>'Pine Tree', 'amount'=>$pineAmount], ['name'=>'Pine Cone', 'amount'=>$pineAmount*5] ];
                    // Pine trees produce pinecones, which contain edible nuts
                    if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Log', 'amount'=>rand(1,10)]);
                break;
                case 'cedar':
                    $wide['items'] = [ ['name'=>'Cedar Tree', 'amount'=>rand(4,20)] ];
                    // Cedar trees produce nuts. While they're edible, are still poisonous in large numbers
                    if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Log', 'amount'=>rand(1,9)]);
                break;
                case 'fir':
                    $wide['items'] = [ ['name'=>'Fir Tree', 'amount'=>rand(5,16)] ];
                    // Fir trees also produce pine cones, but of a smaller variety. I think, for now, we will leave this out
                    if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Log', 'amount'=>rand(1,11)]);
                break;
                case 'hemlock':
                    $wide['items'] = [ ['name'=>'Hemlock Tree', 'amount'=>rand(8,50)] ];
                    // Hemlock trees produce even smaller pine cones
                    if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Log', 'amount'=>rand(1,4)]);
                break;
                case 'cherry':
                    // We will treat cherries as unit piles, not individual items. Also, the fruit trees are all too small to support fallen logs
                    $cherryAmount = rand(5,10);
                    $wide['items'] = [ ['name'=>'Cherry Tree', 'amount'=>$cherryAmount], ['name'=>'Cherries', 'amount'=>$cherryAmount*2] ];
                break;
                case 'apple':
                    $appleAmount = rand(5,10);
                    $wide['items'] = [ ['name'=>'Apple Tree', 'amount'=>$appleAmount], ['name'=>'Apple', 'amount'=>$appleAmount*5] ];
                break;
                case 'pear':
                    $pearAmount = rand(4,8);
                    $wide['items'] = [ ['name'=>'Pear Tree', 'amount'=>$pearAmount], ['name'=>'Pear', 'amount'=>$pearAmount*3] ];
                break;
                case 'orange':
                    $orangeAmount = rand(5,12);
                    $wide['items'] = [ ['name'=>'Orange Tree', 'amount'=>$orangeAmount], ['name'=>'Orange', 'amount'=>$orangeAmount*4] ];
                break;
                case 'hawthorn': // Hawthorne and Dogwood trees are small, too, they cannot produce Fallen Logs
                    // Hawthorn trees produce small red berries... I don't know if we'll use them or not
                    $wide['items'] = [ ['name'=>'Hawthorn Tree', 'amount'=>rand(8,20)] ];
                break;
                case 'dogwood': // Dogwoods also produce small red berries
                    $wide['items'] = [ ['name'=>'Dogwood Tree', 'amount'=>rand(3, 8)] ];
                break;
                case 'locust': // Most lucust tree fruits are not edible; only one variety is
                    $wide['items'] = [ ['name'=>'Locust Tree',    'amount'=>rand(3, 8)] ];
                    if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Log', 'amount'=>rand(4,12)]);
                break;
                case 'juniper': // Junipers produce small blue berries that are edible
                    $wide['items'] = [ ['name'=>'Juniper Tree',   'amount'=>rand(5,10)] ];
                    if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Log', 'amount'=>rand(1,3)]);
                break;
                case 'rock':  $wide['items'] = [['name'=>'Gravel', 'amount'=>rand(0,10)]]; break;
                // I think, for the remaining items, they'll start out void of items... for now. We can change that later, though
                case 'sands': $wide['items'] = []; break;
                case 'water': $wide['items'] = []; break;
                case 'lava':  $wide['items'] = []; break;
                case 'ice':   $wide['items'] = []; break;
                case 'snow':   $wide['items'] = []; break;
                case 'stream':  $wide['items'] = []; break;
                case 'wetland': $wide['items'] = []; break;
                case 'cliff':   $wide['items'] = []; break;
                case 'creekwash': $wide['items'] = []; break; // This will be an ideal source of gravel and raw metals... but we're not there yet
                case 'creekbank': $wide['items'] = []; break;
            }
            return $wide;
        }, $long);
    }, $localTiles);

    // With all the land plots decided now, we still have them all in text form. The database stores these as IDs, not names. Convert
    // all the tile names to be the correct TileType ID
    $localTiles = array_map(function($long) {
        return array_map(function($wide) {
            global $localTileNames;
            // Check that all tiles have an items attribute. We may have certain tile types that are missing it
            if(!isset($wide['items'])) {
                reporterror('server/mapContent.php->ensureMiniMap()->convert tilenames to IDs',
                            'Error: tile type '. $wide['landType'] .' was missing an items list');
                // Well, why don't we just add it here?
                $wide['items'] = [];
            }
            $wide['landType'] = array_search($wide['landType'], $localTileNames);
            return $wide;
        }, $long);
    }, $localTiles);

    // Now, we need to insert this into the database. That's not possible as an array, but we can convert this into a string instead
    $built = implode(',', array_map(function($long) use ($worldTile) {  // worldTile must be passed through both functions
        return implode(',', array_map(function($wide) use ($worldTile) {
            
            return '('. $worldTile['id'] .','. $wide['x'] .','. $wide['y'] .','. $wide['landType'] .",'". json_encode($wide['items']) ."')";
            // We don't need to include the building ID of 0, since this is a default in the database
        }, $long));
    }, $localTiles));

    reporterror('server/mapContent.php->ensureMinimap()->pre-save',
                'Minimap save: '. $built);

    // We should be all set to save the data... in one sweep
    $db->query("INSERT INTO sw_minimap (mapid,x,y,landtype,items) VALUES ". $built .";");
    $err = mysqli_error($db);
    if($err) {
        reporterror('server/mapContent.php->generateMinimap()->save new map data', 'MySQL reported an error: '. $err);
        ajaxreject('internal', 'There was an error saving localmap data. See the error log');
    }
}
?>