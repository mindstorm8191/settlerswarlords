<?php
    /*  generateMap.php
        Handles functions that create and expand the player's map
        For the game Settlers & Warlords
    */

    require_once("libs/common.php");
    require_once("globals.php");
    require_once("libs/clustermap.php");
    require_once("biomeBlock.php");

    // Map generation will be much more challenging this time around, not just because we're working in 3D. Previously, I could generate a 101x101 tile map of
    // clustered biomes, and it worked fine. This time, things are supposed to be seamless between biomes.
    // What we are going to do is generate a two-layer biome system. On the upper level we will select biome types to cover a certain amount of land. On the lower type,
    // we will select what individual tile types will generate

    // I have been looking at a scheme to generate biomes using a sliding scale with 4 parameters:
    // temperature (hot, warm, cool, cold)
    // moisture (wet, damp, semi-arid, dry)
    // vegetation (barren, normal, lush)
    // magical (blighted, normal, enchanted)
    // However, with this many options alone there are already 144 possible biome types that can be generated.
    // Instead we will stick with a simpler system for now: grasslands, forests, desert, jungle, swamp, ocean

    // So, we want to set up 2 layers of biomes. For the top layer, each section will consist of a 4x4 area of chunks

    function loadChunk($chunkx,$chunky,$chunkz) {
        // Loads and returns a particular chunk of the map. If that chunk hasn't been generated yet, it will be made and saved to the database.
        // $chunkx, $chunky, $chunkz - chunk coordinates to collect data from

        global $chunkWidth;
        global $localTileNames;
        global $treePlacements;
        global $vegetableSpread;

        // Grab the target chunk from the database. If it does exist, return that
        //reporterror('server/generateMap.php->loadChunk()->input', 'load chunk at coords=['. $chunkx .','. $chunky .','. $chunkz .']');
        $pick = DanDBList("SELECT * FROM sw_mapchunk WHERE chunkx=? AND chunky=? AND chunkz=?;", 'iii', [$chunkx, $chunky, $chunkz], 'server/routes/loadmap.php->fetch chunk');
        if(sizeof($pick)>0) {
            return $pick[0];
        }
        // Oh dear, we didn't find the target chunk... probably because it doesn't exist yet. No matter, we'll generate it now
        
        // As we generate tiles, we need to determine what biome this should be. It will affect what 'surface' tiles are displayed, and also what trees generate
        // Biome generation will occur on two levels; a wide-area biome and small-area biome.
        // The wide area will determine what group of tiles can generate there. Each 'tile' of this map will cover a 4x4 group of clusters
        // The small area will determine what floor tiles we will see in each location. In some situations it will also generate trees
        $biome = getBiomeTiles($chunkx, $chunkz);
        // This should give us a flat array of tile types to apply to the floor of every surface tile
        
        // what we generate will be based on the chunk's vertical location. Later, we will have to factor in a world height map... but that's difficult. For
        // now we'll use a totally flat map
        if($chunky>0) {
            $fullMap = forrange(0,$chunkWidth-1,1, function($z) {
                global $chunkWidth;
                return forrange(0,$chunkWidth-1,1, function($y) use ($z) {
                    global $chunkWidth;
                    return forrange(0,$chunkWidth-1,1, function($x) use ($y,$z) {
                        return 'air';
                    }, 'server/generateMap.php->loadChunk()->high x');
                }, 'server/generateMap.php->loadChunk()->high y');
            }, 'server/generateMap.php->loadChunk()->high z');
        }else if($chunky<0) {
            $fullMap = forrange(0,$chunkWidth-1,1, function($z) {
                global $chunkWidth;
                return forrange(0,$chunkWidth-1,1, function($y) use ($z) {
                    global $chunkWidth;
                    return forrange(0,$chunkWidth-1,1, function($x) use ($y,$z) {
                        return 'rock';
                    }, 'server/generateMap.php->loadChunk()->low x');
                }, 'server/generateMap.php->loadChunk()->low y');
            }, 'server/generateMap.php->loadChunk()->low z');
        }else{
            $fullMap = forrange(0,$chunkWidth-1,1, function($z) {
                global $chunkWidth;
                return forrange(0,$chunkWidth-1,1, function($y) use ($z) {
                    global $chunkWidth;
                    return forrange(0,$chunkWidth-1,1, function($x) use ($y,$z) {
                        if($y>4) return 'air';
                        if($y<4) return 'dirt';
                        if($y==0) return 'bottomdirt';
                        return 'grassydirt';  // This will be our 'biome-dependent' tile type
                    }, 'server/generateMap.php->loadChunk()->mid x');
                }, 'server/generateMap.php->loadChunk()->mid y');
            }, 'server/generateMap.php->loadChunk()->mid z');
        }
        //reporterror('server/generateMap.php->loadChunk()->after initial chunk build', 'last tile='. $fullMap[6][6][6]);
        // Let's now handle adding tree content to tiles above the ground
        // Where-ever we find tree tiles, we will shift 2 tiles up and fill them with treebranch tiles (this will be the full tile type, not just the floor; the floor will still be air).

        // As we do this, we also want to add tree trunks to the bottom layer. The number of tree trunks will depend on the type of tree being placed. I don't want to place
        // tree trunks based on a random number - it won't generate fair levels unless it is on a large scale. Instead, we will use a WeightedRandom class, one for each type of
        // tree; this will be in globals.php
        $forestBiomeMin = 12;
        $forestBiomeMax = 27;
        $grassBiomeMin = 6;
        $grassBiomeMax = 10;
        $hitCount = 0;
        for($z=0; $z<$chunkWidth; $z++) {
            for($y=0; $y<$chunkWidth; $y++) {
                for($x=0; $x<$chunkWidth; $x++) {
                    if($fullMap[$z][$y][$x]=='grassydirt') { // This tile floor is biome dependent... now check which biome type should be here
                        $pickedBiome = $biome[$z*$chunkWidth+$x];
                        if($pickedBiome>=$forestBiomeMin && $pickedBiome<=$forestBiomeMax) {
                            $treeStats = JSFind($treePlacements, function($t) use ($pickedBiome) {
                                if($t['id']===$pickedBiome) return true;
                                return false;
                            });
                            $hasTrunk = $treeStats['trunks']->cyclepull();
                            if($hasTrunk==='1' || $hasTrunk==='2') {
                                $fullMap[$z][$y][$x] = 'treetrunk'; // from here we will determine what object is placed based on the biome selected
                            }else{
                                $fullMap[$z][$y][$x] = 'leaffloor';
                            }
                            // y-positive is always up
                            $fullMap[$z][$y+1][$x] = 'treebranches';
                            $fullMap[$z][$y+2][$x] = 'treebranches';
                            $hitCount++;
                        }
                        // While here, let's manage grasslands, too. We want every few tiles to contain a vegetable instead
                        if($pickedBiome>=$grassBiomeMin && $pickedBiome<=$grassBiomeMax) {
                            $selected = $vegetableSpread->cyclepull();
                            if($selected !== 'empty') {  // any time we get 'empty' we leave the grass as is
                                $fullMap[$z][$y][$x] = $selected;
                            }
                        }
                    }
                }
            }
        }
        //reporterror('server/generateMap.php->loadChunk()->after trees addition', 'Added '. $hitCount .' tiles for trees');

        // All tiles will have the following fields
        // t=tile. What type of block this is. For spaces that can be travelled, this is usually Air
        // f=floor. What type of flooring this is. This is sometimes the material type of the tile below it, but can be other things, like plants
        // h=health. How much 'damage' must be done to this tile to remove it. I don't know if we'll keep this.
        // i=items list. What objects exist in this tile. This defaults to empty, and does not exist in every tile
        // s=slope. 0 if no slope, 1 if any kind of slope. The displayed slope type will depend on the slope / solid state of neighbors. This defaults to 0, and does not exist in every tile.
        
        // Convert the map to a flat array, to store it in the database. We can compute each tiles' location based on its array position
        $flatMap = [];
        for($z=0; $z<=$chunkWidth-1; $z++) {
            for($y=0; $y<=$chunkWidth-1; $y++) {
                for($x=0; $x<=$chunkWidth-1; $x++) {
                    switch($fullMap[$z][$y][$x]) {
                        case 'air':        array_push($flatMap, ['t'=>0, 'f'=>0, 'h'=>100]); break;
                        //case 'grassydirt': array_push($flatMap, ['t'=>0, 'f'=>1, 'h'=>100]); break;
                        case 'dirt':       array_push($flatMap, ['t'=>1, 'f'=>1, 'h'=>100]); break;
                        case 'bottomdirt': array_push($flatMap, ['t'=>1, 'f'=>2, 'h'=>100]); break;
                        case 'rock':       array_push($flatMap, ['t'=>2, 'f'=>2, 'h'=>100]); break;
                        case 'treebranches': array_push($flatMap, ['t'=>3, 'f'=>3, 'h'=>100]); break;
                        case 'leaffloor':
                            // There's a 50/50 chance that any tile will also contain one rotten log
                            // Note that all leafy floor tiles will also contain tree branches (until cleared). These will take 3x as long to travel through
                            // Workers will be able to climb up & through tree branches, but take 6x as long as normal walking on the ground
                            if(rand(0,2)>1) {
                                array_push($flatMap, ['t'=>3, 'f'=>11, 'h'=>100, 'i'=>[['name'=>'Rotten Log', 'amt'=>1]]]);
                            }else{
                                array_push($flatMap, ['t'=>3, 'f'=>11, 'h'=>100]);
                            }
                            
                        break;
                        case 'treetrunk':
                                // Tree trunks are going to hold the logs and sticks. We will attach all the tree related parts to the trunks. The surrounding
                                // forest floor will hold fallen sticks and logs
                                $p = $biome[$z*$chunkWidth+$x];
                                $treeSlot = JSFindIndex($treePlacements, function($r) use ($p) {
                                    // $p here should be a tile ID
                                    return $r['id']===$p;
                                });
                                if($treeSlot===-1) {
                                    array_push($flatMap, ['t'=>$biome[$z*$chunkWidth+$x], 'f'=>$biome[$z*$chunkWidth+$x], 'h'=>100]);
                                }else{
                                    array_push($flatMap, [
                                        't'=>$biome[$z*$chunkWidth+$x],
                                        'f'=>$biome[$z*$chunkWidth+$x],
                                        'h'=>100,
                                        'i'=>[
                                            ['name'=>'Attached Long Stick', 'amt'=>$treePlacements[$treeSlot]['stickspertrunk']],
                                            ['name'=>'Log', 'amt'=>$treePlacements[$treeSlot]['logspertrunk']]
                                        ]
                                    ]);
                                }
                            break;
                        case 'grassydirt':
                            // Depending on the biome chosen, we may have additional items to place here
                            $p = $biome[$z*$chunkWidth+$x];
                            switch($p) {
                                case 6: array_push($flatMap, ['t'=>0, 'f'=>$p, 'h'=>100, 'i'=>[['name'=>'Wheat Seeds', 'amt'=>7], ['name'=>'Wheat Grass', 'amt'=>10]]]); break;
                                case 7: array_push($flatMap, ['t'=>0, 'f'=>$p, 'h'=>100, 'i'=>[['name'=>'Oat Seeds', 'amt'=>8], ['name'=>'Oat Grass', 'amt'=>5]]]); break;
                                case 8: array_push($flatMap, ['t'=>0, 'f'=>$p, 'h'=>100, 'i'=>[['name'=>'Rye Seeds', 'amt'=>5], ['name'=>'Rye Grass', 'amt'=>6]]]); break;
                                case 9: array_push($flatMap, ['t'=>0, 'f'=>$p, 'h'=>100, 'i'=>[['name'=>'Barley Seeds', 'amt'=>6], ['name'=>'Barley Grass', 'amt'=>7]]]); break;
                                case 10: array_push($flatMap, ['t'=>0, 'f'=>$p, 'h'=>100, 'i'=>[['name'=>'Millet Seeds', 'amt'=>7], ['name'=>'Millet Grass', 'amt'=>9]]]); break;
                                default: array_push($flatMap, ['t'=>0, 'f'=>$p, 'h'=>100]); break;
                            }
                        break;
                        default:
                            // This should handle any vegetable types we have
                            $vegetable = $fullMap[$z][$y][$x];
                            $vegetableSlot = JSFindIndex($localTileNames, function($r) use ($vegetable) {
                                return $r === $vegetable;
                            });
                            if($vegetableSlot===-1) {
                                // We didn't find the correct vegetable
                                reporterror('server/generateMap.php->loadChunk()->convert to flat map', 'Error: vegetable type '. $fullMap[$z][$y][$x] .' not found. pos=['. $x .','. $y .','. $z .']');
                                // We still have to push something here. Just use the normal grass value
                                array_push($flatMap, ['t'=>0, 'f'=>$biome[$z*$chunkWidth+$x], 'h'=>100]);
                            }else{
                                array_push($flatMap, ['t'=>0, 'f'=>$vegetableSlot, 'h'=>100]);
                            }
                            break;
                    }
                }
            }
        }

        // With the flat map made, we can save it to the database
        DanDBList("INSERT INTO sw_mapchunk (chunkx,chunky,chunkz,content) VALUES (?,?,?,?);", 'iiis', [$chunkx, $chunky, $chunkz, json_encode($flatMap)],
                    'server/routes/loadmap.php->save new tile content');
        // We also need to push this content onto our output value, in the same format that we would receive from the database
        return ['chunkx'=>$chunkx, 'chunky'=>$chunky, 'chunkz'=>$chunkz, 'content'=>json_encode($flatMap)];
    }

    function getBiomeTiles($chunkx, $chunkz) {
        // Returns local-area biome data for a specific chunk. This will be in the form of a 2D array that can be applied to that chunk
        // If the data needed for this area doesn't exist, it will be generated

        global $biomeData, $localTileNames, $chunkWidth, $biomeTileSize;
        $biomeSize = $chunkWidth*$biomeTileSize;

        // biome chunks are larger than world chunks (currently by a factor of 8). We will still hold coordinates for our biome chunks
        $biomeChunkX = floor($chunkx/floatval($biomeTileSize));
        $biomeChunkZ = floor($chunkz/floatval($biomeTileSize));

        // From here, we need to determine if there are any neighboring biome tiles that already have content. If so, we should pull that to 'complete' our map - it will
        // affect the edges of our current region
        $flatMap = [];
        $existing = DanDBList("SELECT content FROM sw_biomemap WHERE chunkx=? AND chunkz=?;", 'ii', [$biomeChunkX, $biomeChunkZ],
                              'server/generateMap.php->getBiomeTiles()->find existing section');
        if(sizeof($existing)===0) {
            // We didn't find any content. We will need to generate some now
            
            // Start by determining which biome we should use to generate new tiles with
            $biomeType = getWideBiome(floor($chunkx/floatval($biomeTileSize)), floor($chunkz/floatval($biomeTileSize)));

            // Biome clusters will be generated in a 4x4 block of chunks, and be only 2D; they will affect the surface ('floor') of the maps only
            // Next, use our ClusterMap routine to create land tiles. Which land tiles? We will use the list from the globals file. I would move it here, but better
            // to have globals.php serve as a Single Source of Truth
            $tileSet = JSFind($biomeData, function($biome) use ($biomeType) {
                return $biome['biome']==$biomeType;
            })['localTiles'];

            // Before generating the next cluster map, see if we have any map content of surrounding areas
            /*
            $north = DanDBList("SELECT content FROM sw_biomemap WHERE chunkx=? AND chunkz=?;", 'ii',
                               [floor($chunkx/floatval($biomeTileSize)), floor($chunkz/floatval($biomeTileSize))-1],
                               'server/generateMap.php->getBiomeTiles()->get north neighbor');
            $south = DanDBList("SELECT content FROM sw_biomemap WHERE chunkx=? AND chunkz=?;", 'ii',
                               [floor($chunkx/floatval($biomeTileSize)), floor($chunkz/floatval($biomeTileSize))+1],
                               'server/generateMap.php->getBiomeTiles()->get south neighbor');
            
            $existingNeighbors = mergeMapSections([
                buildNeighborData($biomeChunkX, $biomeChunkZ-1),
                buildNeighborData($biomeChunkX+1, $biomeChunkZ),
                buildNeighborData($biomeChunkX, $biomeChunkZ+1),
                buildNeighborData($biomeChunkX-1, $biomeChunkZ)
            ]);
            */

            //$mapSet = ClusterMap(0,$biomeSize-1,0,$biomeSize-1,$tileSet,40,[]);
            $worldStartX = $biomeTileSize * $chunkWidth * $biomeChunkX;
            $worldStartZ = $biomeTileSize * $chunkWidth * $biomeChunkZ;
            //reporterror('server/generateMap.php->getBiomeTiles()->pre ClusterMap', 'Create chunk starting from ['. $worldStartX .','. $worldStartZ .']');
            $mapSet = ClusterMap2($worldStartX, $worldStartX+$biomeTileSize*$chunkWidth-1, $worldStartZ, $worldStartZ+$biomeTileSize*$chunkWidth-1, $tileSet, 40, []);
            //reporterror('server/generateMap.php->getBiomeTiles()->after clusterMap... wait. We were using the wrong function this whole time!
            //reporterror('sever/generateMap.php->getBiomeTiles()->after clusterMap2', 'Tile at ['. $worldStartX .','. $worldStartZ .'] is '. $mapSet->get($worldStartX, $worldStartZ)['landType']);
            // This is nice, but not in a good format. We need to convert it to a flat array of numbers. We will also need to convert our biome types to an int
            for($i=0; $i<$biomeSize*$biomeSize; $i++) {
                $x = $worldStartX + ($i % $biomeSize);
                $y = $worldStartZ + floor($i/floatval($biomeSize));
                //if($i==100) reporterror('server/generateMap.php->getBiomeTiles()->flatten map', 'Coords at slot '. $i .' is '. $x .','. $y);
                $biome = $mapSet->get($x, $y)['landType'];
                $flatMap[$i] = JSFindIndex($localTileNames, function($k) use ($biome) {
                    return $k===$biome;
                });
            }

            // With this data flattened, save it to the database
            DanDBList("INSERT INTO sw_biomemap (chunkx,chunkz,content) VALUES (?,?,?);", 'iis', [$biomeChunkX, $biomeChunkZ, json_encode($flatMap)],
                      'server/generateMap.php->getBiomeTiles()->save new section');
        }else{
            $flatMap = json_decode($existing[0]['content']);
        }
        
        // Now that we have saved the full biome data, we now need to isolate the data we need to return it
        $outMap = [];
        $offsetx = myModulus($chunkx, $biomeTileSize); // this function does modulus, but corrects for negative numbers, so -1%4 gives 3 instead of 1
        $offsetz = myModulus($chunkz, $biomeTileSize);
        $zShift = $chunkWidth*$biomeTileSize*$chunkWidth * $offsetz;
        $zStep = $chunkWidth*$biomeTileSize;
        $xShift = $chunkWidth * $offsetx;

        for($z=0; $z<$chunkWidth; $z++) {
            for($x=0; $x<$chunkWidth; $x++) {
                $outMap[$z*$chunkWidth + $x] = $flatMap[$zShift + ($zStep*$z) +$xShift +$x];
            }
        }
        //reporterror('server/generateMap.php->getBiomeTiles()->construct output', 'conversion: '. $records);
        return $outMap;
    }

    function buildNeighborData($targetx, $targetz) {
        // Collects biome content from the database, then converts it into a format that ClusterMap can make use of right away.
        // Returns a 2D array. If no content exists at the target location, this will return an empty array.

        global $chunkWidth, $biomeTileSize, $localTileNames;

        $result = DanDBList("SELECT content FROM sw_biomemap WHERE chunkx=? AND chunkz=?;", 'ii', [$targetx, $targetz],
                            'server/generateMap.php->getBiomeTiles()->get north neighbor');
        if(sizeof($result)==0) return 'none';
        //reporterror('server/generateMap.php->buildNeighborData()', 'Process content of '. strlen($result[0]['content']) .' length'); - yes, we're finding content
        $flatMap = json_decode($result[0]['content'], true);
        $field = [];
        

        // To use this effectively with ClusterMap, we need each tile to have an accurate world location.
        // We have a targetx & y value, but we will need to translate those based on the chunk size and biome chunk size
        $shiftx = $chunkWidth * $biomeTileSize * $targetx;
        $shiftz = $chunkWidth * $biomeTileSize * $targetz;
        reporterror('server/generateMap.php->buileNeighborData()->pre-loop', 'from target=['. $targetx .','. $targetz .'], shift=['. $shiftx .','. $shiftz .']');
        
        $newMap = new biomeBlock;
        for($i=0; $i<sizeof($flatMap); $i++) {
            $x = $i % ($chunkWidth * $biomeTileSize);
            $z = floor($i / floatval($chunkWidth * $biomeTileSize));
            $newMap->set($shiftx+$x, $shiftz+$z, ['x'=>$shiftx+$x, 'y'=>$shiftz+$z, 'landType'=>$localTileNames[$flatMap[$i]]]);
            if($i==4095) reporterror('server/generateMap.php->buildNeighborData()->loop', 'last hit='. $flatMap[$i] .' at ['. ($shiftx+$x) .','. ($shiftz+$z) .']');
        }
        reporterror('server/generateMap.php->buildNeighborData()->finish', 'Source=size('. sizeof($flatMap) .'), got content range ['. $newMap->minx .'-'. $newMap->maxx .']['. $newMap->miny .'-'. $newMap->maxy .']. Sample:'. json_encode($newMap->get($newMap->minx, $newMap->miny)));
        return $newMap;
    }

    function mergeMapSections($mapArray) {
        // Merges multiple map portions into a single section that can be passed to ClusterMap
        // $mapArray - list of array portions to merge. If any of these portions contain an empty array, they will be skipped
        // Returns the merged array

        //reporterror('server/generateMap.php->mergeMapSections()', 'Data types: '. gettype($mapArray[0]) .','. gettype($mapArray[1]) .','. gettype($mapArray[2]) .','. gettype($mapArray[3]));

        $field = new biomeBlock;
        $firstHit = -1;
        // Since we are merely merging the content, and the class manages the array bounds... this is actually very simple now
        for($u=0; $u<sizeof($mapArray); $u++) {
            // Start with determining if this array has any content
            //if(is_array($mapArray[$u])) continue;
            if($mapArray[$u]!='none') {
                if($firstHit==-1) $firstHit=$u;
                for($x=$mapArray[$u]->minx; $x<$mapArray[$u]->maxx; $x++) {
                    for($y=$mapArray[$u]->miny; $y<$mapArray[$u]->maxy; $y++) {
                        $field->set($x, $y, $mapArray[$u]->get($x, $y));
                    }
                }
            }
        }
        if($firstHit>-1) {
            reporterror('server/generateMap.php->mergeMapSections()', 'Merged '. $firstHit);
            reporterror('server/generateMap.php->mergeMapSections()',
                        'Merged. Sample='. json_encode($field->get(
                                                       $mapArray[$firstHit]->minx,
                                                       -1)));//$mapArray[$firstHit]->miny)));
        }
        return $field;
    }

    function myModulus($value, $divider) {
        // Returns the modulus of the $base value.
        // Regular modulus works differently for negative numbers. -5%4 will give you -1. This can throw off scaling when trying to grid things; Instead,
        // we want -5%4 to give us 3
        // If this receives a positive number, it will perform modulus like normal.
        if($value<=0) {
            return (-$value*$divider + $value) % $divider;
        }
        return $value % $divider;
    }

    function getWideBiome($biomeChunkx, $biomeChunkz) {
        // Returns the biome type at the biome chunk location provided. If no biome chunk exists here, one will be generated
        // $biomeChunkx, $biomeChunkz - biome-chunk location to get the biome type of
        
        // Our clustermap generation routine allows us to expand the map in any direction indefinitely, but works best when starting with / adding large chunks of land at a time
        // For this routine we will generate a 50x50 area. The map's orientation should be in the middle of this

        // For testing purposes, let's output a fixed value for now
        return 'grassland';
    }
?>


