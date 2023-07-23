<?php  /*  minimap.php
        Functions related to management of the local maps of the game
        For the game Settlers & Warlords
    */

    //require_once("libs/clustermap.php");

    require_once("libs/jsarray.php");

    function ensureMinimap($xpos, $ypos, $newPlayer) {
        // Creates new minimap content for a particular world map tile
        // $xpos - world X coordinate for this local map
        // $ypos - world Y coordinate for this local map
        // $newPlayer - set to true if this is being built for a new player. If so, an amount of exposed rock and forests will be provided
        // No return value. This will generate content in the database, if it is needed

        global $db;
        global $biomeData;

        // First, get the content for this world map tile
        $worldTile = DanDBList("SELECT * FROM sw_map WHERE x=? AND y=?;", 'ii', [$xpos, $ypos], "server/minimap.php->get world map data")[0];

        // Ensure there is no localmap data here already
        if(sizeof(DanDBList("SELECT x FROM sw_minimap WHERE mapid=? LIMIT 1;", 'i', [$worldTile['id']],
                            'server/minimap.php->check for existing content'))>0) {
            return;
        }

        $localMapWidth = 40;
        $localMapHeight = 40;
        // Generate a basic map using our cluster algorithm
        $localTiles = ClusterMap(0,$localMapWidth, 0,$localMapHeight, $biomeData[$worldTile['biome']]['localTiles'], 25, 0);
        //reporterror('server/minimap.php->ensureMinimap()->after ClusterMap call', 'LocalMap generated: '. json_encode($localTiles));

        // Now would be a good time to generate some streams. This is much harder than it first appears.  I thought I could use a linear
        // path, but calculating that is still difficult.
        // Last time I used a transition from top to bottom. I'll try something different this time
        $side = rand(0,3);
        $entry = rand(0,40);
        switch($side) {
            case 0: // top, looking down
                $x = $entry;
                $y = 0;
                $dx = -(20-$entry) / 40.0;
                $dy = 1.0;
            break;
            case 1: // right face, moving left
                $x = 40;
                $y = $entry;
                $dx = -1.0;
                $dy = -(20-$entry) / 40.0;
            break;
            case 2: // bottom face, moving up
                $x = $entry;
                $y = 40;
                $dx = -(20-$entry) / 40.0;
                $dy = -1.0;
            break;
            case 3: // left face, moving right
                $x = 0;
                $y = $entry;
                $dx = 1.0;
                $dy = -(20-$entry) / 40.0;
            break;
        }
        // Move acrosss the map. As we do so, shift by the marked amounts
        while($x>0 && $x<=40 && $y>0 && $y<=40) {
            $localTiles[round($x)][round($y)]['landType'] = 'stream';
            $x += $dx;
            $y += $dy;
        }

        // For new players, we need to ensure that there exists some rocks and trees on the land. These are needed for early players
        if($newPlayer) {
            // Instead of running through the map twice, we'll check each tile for both tile types in the same pass
            $passingSet = array_reduce($localTiles, function($carrying, $long) {
                return array_reduce($long, function($carry, $tile) {
                    if($tile['landType']==='rock') {
                        $carry['rock'] +=1;
                        return $carry;
                    }
                    if($tile['landType']==='maple') {
                        $carry['maple'] +=1;
                        return $carry;
                    }
                    return $carry;
                }, $carrying);
            }, ['rock'=>0, 'maple'=>0]);

            if($passingSet['maple']<5) {
                reporterror('server/minimap.php->ensureMinimap()->new player checks',
                            'Notice: localMap only generated '. $passingSet['maple'] .' maple trees. Adding more manually');
                for($i=$passingSet['maple']; $i<=5; $i++) {
                    $localTiles[mt_rand(0,$localMapHeight)][mt_rand(0,$localMapWidth)]['landType'] = 'maple';
                }
            }
            if($passingSet['rock']<1) {
                reporterror('server/minimap.php->ensureMinimap()->new player checks',
                            'Notice: localMap generated no rock tiles. Adding one manually');
                $localTiles[mt_rand(0,$localMapHeight)][mt_rand(0,$localMapWidth)]['landType'] = 'rock';
            }
        }

        // Add some rare plants to the map. These generate as single tiles
        for($i=0; $i<5; $i++) {
            $localTiles[rand(0,40)][rand(0,40)]['landType'] = $biomeData[$worldTile['biome']]['rarePlants']->pull();
        }

        // Add items to the tiles, based on the tile type
        $localTiles = array_map(function($long) {
            return array_map(function($wide) {
                switch($wide['landType']) {
                    case 'wheat': $wide['items'] = [['name'=>'Wheat Grass', 'amount'=>rand(5,30)]]; break; // wheat fields
                    case 'oat': $wide['items'] = [['name'=>'Oat Grass', 'amount'=>rand(5,30)]]; break; // oat fields
                    case 'rye': $wide['items'] = [['name'=>'Rye Grass', 'amount'=>rand(5,25)]]; break; // rye fields
                    case 'barley': $wide['items'] = [['name'=>'Barley Grass', 'amount'=>rand(3,35)]]; break; // barley fields
                    case 'millet': $wide['items'] = [['name'=>'Millet Grass', 'amount'=>rand(8,30)]]; break; // millet fields
                    // Trees will work a little differently. Each tree will have a fixed size and number of sticks, bark & fruit on them
                    case 'maple': // Produces Samaras, the helicopter style seeds, which are edible... we won't include that here
                        $wide['items'] = [['name'=>'Maple Tree', 'amount'=>rand(3,12)]];
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Log', 'amount'=>rand(1,5)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Branch', 'amount'=>rand(3,9)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Stick', 'amount'=>rand(6,20)]);
                    break;
                    case 'birch': // Typically tall and narrow, growing in tight clusters. Their seeds aren't edible
                        $wide['items'] = [['name'=>'Birch Tree', 'amount'=>rand(8,60)]];
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Log', 'amount'=>rand(1,8)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Branch', 'amount'=>rand(3,9)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Stick', 'amount'=>rand(6,20)]);
                    break;
                    case 'oak': // Produces acorns, which are edible... I should include those at some point
                        $wide['items'] = [['name'=>'Oak Tree', 'amount'=>rand(4,16)]];
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Log', 'amount'=>rand(1,7)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Branch', 'amount'=>rand(3,9)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Stick', 'amount'=>rand(6,20)]);
                    break;
                    case 'mahogany': // Produces large fruits, and the insides are edible, but the outsides are poisonous
                        $wide['items'] = [['name'=>'Mahogany Tree', 'amount'=>rand(3,8)]];
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Log', 'amount'=>rand(1,10)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Branch', 'amount'=>rand(3,9)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Stick', 'amount'=>rand(6,20)]);
                    break;
                    case 'pine': // Produces pinecones, that contain edible nuts
                        $a = rand(7,20);
                        $wide['items'] = [['name'=>'Pine Tree', 'amount'=>$a], ['name'=>'Pine Cone', 'amount'=>$a*rand(4,5)]];
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Log', 'amount'=>rand(1,10)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Branch', 'amount'=>rand(3,9)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Stick', 'amount'=>rand(6,20)]);
                    break;
                    case 'cedar': // Produces nuts which are edible, but poisonous in large numbers
                        $wide['items'] = [['name'=>'Cedar Tree', 'amount'=>rand(4,20)]];
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Log', 'amount'=>rand(1,9)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Branch', 'amount'=>rand(3,9)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Stick', 'amount'=>rand(6,20)]);
                    break;
                    case 'fir':  // Also produces pine cones, but a smaller variety. I think we'll leave those out
                        $wide['items'] = [['name'=>'Fir Tree', 'amount'=>rand(5,16)]];
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Log', 'amount'=>rand(1,11)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Branch', 'amount'=>rand(3,9)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Stick', 'amount'=>rand(6,20)]);
                    break;
                    case 'hemlock': // Produces even smaller pine cones
                        $wide['items'] = [['name'=>'Hemlock Tree', 'amount'=>rand(8,50)]];
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Log', 'amount'=>rand(1,4)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Branch', 'amount'=>rand(3,9)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Stick', 'amount'=>rand(6,20)]);
                    break;
                    case 'cherry': // We will treat cherries as unit piles, not individual items. Also, fruit trees are too small to produce fallen logs
                        $a = rand(5,10);
                        $wide['items'] = [['name'=>'Cherry Tree', 'amount'=>$a], ['name'=>'Cherries', 'amount'=>$a*rand(2,3)]];
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Branch', 'amount'=>rand(3,9)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Stick', 'amount'=>rand(6,20)]);
                    break;
                    case 'apple':
                        $a = rand(5,10);
                        $wide['items'] = [['name'=>'Apple Tree', 'amount'=>$a], ['name'=>'Apple', 'amount'=>$a*rand(4,6)]];
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Branch', 'amount'=>rand(3,9)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Stick', 'amount'=>rand(6,20)]);
                    break;
                    case 'pear':
                        $a = rand(4,8);
                        $wide['items'] = [['name'=>'Pear Tree', 'amount'=>$a], ['name'=>'Pear', 'amount'=>$a*rand(3,4)]];
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Branch', 'amount'=>rand(3,9)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Stick', 'amount'=>rand(6,20)]);
                    break;
                    case 'orange':
                        $a = rand(5,12);
                        $wide['items'] = [['name'=>'Orange Tree', 'amount'=>$a], ['name'=>'Orange', 'amount'=>$a*rand(4,5)]];
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Branch', 'amount'=>rand(3,9)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Stick', 'amount'=>rand(6,20)]);
                    break;
                    case 'hawthorne': // These are small trees, they won't produce fallen logs
                        $wide['items'] = [['name'=>'Hawthorne Tree', 'amount'=>rand(8,20)]];
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Branch', 'amount'=>rand(3,9)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Stick', 'amount'=>rand(6,20)]);
                    break;
                    case 'dogwood': // These are also very small trees
                        $wide['items'] = [['name'=>'Dogwood Tree', 'amount'=>rand(3,8)]];
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Branch', 'amount'=>rand(3,9)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Stick', 'amount'=>rand(6,20)]);
                    break;
                    case 'locust': // Most locust tree fruits are not edible; only one variety is
                        $wide['items'] = [['name'=>'Locust Tree', 'amount'=>rand(3,8)]];
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Log', 'amount'=>rand(4,12)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Branch', 'amount'=>rand(3,9)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Stick', 'amount'=>rand(6,20)]);
                    break;
                    case 'juniper':
                        $wide['items'] = [['name'=>'Juniper Tree', 'amount'=>rand(5,10)]];
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Log', 'amount'=>rand(1,3)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Branch', 'amount'=>rand(3,9)]);
                        if(rand(0,3)>0) array_push($wide['items'], ['name'=>'Fallen Stick', 'amount'=>rand(6,20)]);
                    break;
                    case 'rock': $wide['items'] = [['name'=>'Gravel', 'amount'=>rand(0,10)]]; break;
                    case 'carrots':  // Ground vegeatables will come only as plants. Others will come as plants & fruits
                        $wide['items'] = [['name'=>'Carrot Plant', 'amount'=>rand(3,8)]];
                    break;
                    case 'potatoes':
                        $wide['items'] = [['name'=>'Potato Plant', 'amount'=>rand(5,12)]];
                    break;
                    case 'tomatoes':
                        $wide['items'] = [['name'=>'Tomato Plant', 'amount'=>rand(2,6)], ['name'=>'Tomatoes', 'amount'=>rand(6,12)]];
                    break;
                    case 'turnip':
                        $wide['items'] = [['name'=>'Turnip Plant', 'amount'=>rand(4,8)]];
                    break;
                    case 'peanut':  // Peanuts will be treated as a pile, not individually
                        $wide['items'] = [['name'=>'Peanut Plant', 'amount'=>rand(2,10)], ['name'=>'Raw Peanuts', 'amount'=>rand(4,8)]];
                    break;
                    case 'maize':
                        $wide['items'] = [['name'=>'Maize Plant', 'amount'=>rand(6,14)], ['name'=>'Corn Cob', 'amount'=>rand(4,12)]];
                    break;
                    case 'beans':
                        $wide['items'] = [['name'=>'Bean Plant', 'amount'=>rand(5,10)], ['name'=>'Beans', 'amount'=>rand(4,8)]];
                    break;
                    case 'onion':
                        $wide['items'] = [['name'=>'Onion Plant', 'amount'=>rand(4,10)]];
                    break;
                    case 'broccoli':
                        $wide['items'] = [['name'=>'Broccoli Plant', 'amount'=>rand(5,12)]];
                    break;
                    case 'pumpkin':  // Pumpkins are naturally small fruits; they are only made large by leaving a plant with only one pumpkin to invest in
                        $wide['items'] = [['name'=>'Pumpkin Plant', 'amount'=>rand(4,9)], ['name'=>'Pumpkin', 'amount'=>rand(6,14)]];
                    break;
                    case 'mushroom':
                        $wide['items'] = [['name'=>'Mushroom', 'amount'=>rand(7,16)]];
                    break;
                    // I don't know what else to fill the rest of the tiles with, so we'll just use blank item lists
                    default: $wide['items'] = []; break;
                }
                return $wide;
            }, $long);
        }, $localTiles);
        //reporterror('server/minimap.php->ensureMinimap()->after items populate', 'LocalMap generated: '. json_encode($localTiles));

        // With all the data decided now, we still have the land types in text form. The database stores these as IDs, not names.
        // Convert them all to ID values
        $localTiles = array_map(function($long) {
            return array_map(function($wide) {
                global $localTileNames;
                //$match = array_search(strtolower($wide['landType']), strtolower($localTileNames));
                $match = JSFindIndex($localTileNames, function($name) use ($wide) {
                    if(strtolower($name) == strtolower($wide['landType'])) return true;
                    return false;
                });
                if($match==-1) {
                    reporterror('server/minimap.php->ensureMinimap()->convert tiles', 'Did not find '. $wide['landType'] .' in $localTileNames');
                    $match = 0;
                }
                $wide['landType'] = $match;
                return $wide;
            }, $long);
        }, $localTiles);

        // Now to save our content. A 41x41 list of tiles is a lot, so it's better if we do this in batches, like the world map
        foreach($localTiles as $long) {
            $adds = implode(',', array_map(function($tile) use ($worldTile) {
                return '('. $worldTile['id'] .','. $tile['x'] .','. $tile['y'] .','. $tile['landType'] .",". $tile['landType'] .",'". json_encode($tile['items']) ."')";
            }, $long));

            $result = $db->query("INSERT INTO sw_minimap (mapid, x, y, landtype, originalland, items) VALUES ". $adds .";");
            if(!$result) {
                reporterror('server/minimap.php->ensureMinimap()->save content', 'Local Map save failed. Content='. $adds .', error='. $db->error);
                ajaxreject('internal', 'There was an error when saving the local map');
            }
        }
    }
?>