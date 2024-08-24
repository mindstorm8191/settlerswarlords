<?php
    /*  generateMap.php
        Handles functions that create and expand the player's map
        For the game Settlers & Warlords
    */

    require_once("libs/common.php");
    require_once("globals.php");
    require_once("libs/clustermap.php");

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

        // Grab the target chunk from the database
        //reporterror('server/generateMap.php->loadChunk()->input', 'load chunk at coords=['. $chunkx .','. $chunky .','. $chunkz .']');
        $pick = DanDBList("SELECT * FROM sw_mapchunk WHERE chunkx=? AND chunky=? AND chunkz=?;", 'iii', [$chunkx, $chunky, $chunkz], 'server/routes/loadmap.php->fetch chunk');
        if(sizeof($pick)>0) {
            return $pick[0];
        }

        // As we generate tiles, we need to determine what biome this should be. It will affect what 'surface' tiles are displayed, and also what trees generate
        // Biome generation will occur on two levels; a wide-area biome and small-area biome.
        // The wide area will determine what group of tiles can generate there. Each 'tile' of this map will cover a 4x4 group of clusters
        // The small area will determine what floor tiles we will see in each location. In some situations it will also generate trees
        $biome = getBiomeTiles($chunkx, $chunkz);
        // This should give us a flat array of tile types to apply to the floor of every surface tile
        
        // Oh dear, we didn't find the target chunk... probably because it doesn't exist yet. No matter, we'll generate it now
        // what we generate will be based on the chunk's vertical location
        if($chunky<0) {
            $fullMap = forrange(0,$chunkWidth-1,1, function($z) {
                global $chunkWidth;
                return forrange(0,$chunkWidth-1,1, function($y) use ($z) {
                    global $chunkWidth;
                    return forrange(0,$chunkWidth-1,1, function($x) use ($y,$z) {
                        return 'air';
                    }, 'server/generateMap.php->loadChunk()->high x');
                }, 'server/generateMap.php->loadChunk()->high y');
            }, 'server/generateMap.php->loadChunk()->high z');
        }else if($chunky>0) {
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
                        if($y<4) return 'air';
                        if($y>4) return 'dirt';
                        if($y==7) return 'bottomdirt';
                        return 'grassydirt';  // This will be our 'biome-dependent' tile type
                    }, 'server/generateMap.php->loadChunk()->mid x');
                }, 'server/generateMap.php->loadChunk()->mid y');
            }, 'server/generateMap.php->loadChunk()->mid z');
        }
        //reporterror('server/generateMap.php->loadChunk()->after initial chunk build', 'last tile='. $fullMap[6][6][6]);
        // Let's now handle adding tree content to tiles above the ground
        // Where-ever we find tree tiles, we will shift 2 tiles up and fill them with treebranch tiles (this will be the full tile type, not just the floor; the floor will still be air).
        $forestBiomeMin = 9;
        $forestBiomeMax = 24;
        $hitCount = 0;
        for($z=0; $z<$chunkWidth; $z++) {
            for($y=0; $y<$chunkWidth; $y++) {
                for($x=0; $x<$chunkWidth; $x++) {
                    if($fullMap[$z][$y][$x]=='grassydirt') { // This tile floor is biome dependent... now check which biome type should be here
                        if($biome[$z*$chunkWidth+$x]>=$forestBiomeMin && $biome[$z*$chunkWidth+$x]<=$forestBiomeMax) {
                            // y-negative is always up
                            $fullMap[$z][$y-1][$x] = 'treebranches';
                            $fullMap[$z][$y-2][$x] = 'treebranches';
                            $hitCount++;
                        }
                    }
                }
            }
        }
        reporterror('server/generateMap.php->loadChunk()->after trees addition', 'Added '. $hitCount .' tiles for trees');
        //$tileConversion = ['air','dirt','grassydirt','rock','water','fire','wood'];
        $flatMap = [];
        for($z=0; $z<=$chunkWidth-1; $z++) {
            for($y=0; $y<=$chunkWidth-1; $y++) {
                for($x=0; $x<=$chunkWidth-1; $x++) {
                    /*$slot = JSFindIndex($tileConversion, function($i) use ($fullMap, $x, $y, $z) {
                        return $i===$fullMap[$z][$y][$x];
                    });
                    array_push($flatMap, ['t'=>$slot, 'h'=>100]);*/
                    switch($fullMap[$z][$y][$x]) {
                        case 'air':        array_push($flatMap, ['t'=>0, 'f'=>0, 'h'=>100]); break;
                        //case 'grassydirt': array_push($flatMap, ['t'=>0, 'f'=>1, 'h'=>100]); break;
                        case 'dirt':       array_push($flatMap, ['t'=>1, 'f'=>1, 'h'=>100]); break;
                        case 'bottomdirt': array_push($flatMap, ['t'=>1, 'f'=>2, 'h'=>100]); break;
                        case 'rock':       array_push($flatMap, ['t'=>2, 'f'=>2, 'h'=>100]); break;
                        case 'treebranches': array_push($flatMap, ['t'=>3, 'f'=>3, 'h'=>100]); break;
                        case 'grassydirt': array_push($flatMap, ['t'=>0, 'f'=>$biome[$z*$chunkWidth+$x], 'h'=>100]); break;
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

        // If we already have this data, go ahead and return it



        // From here, we need to determine if there are any neighboring biome tiles that already have content. If so, we should pull that to 'complete' our map - it will
        // affect the edges of our current region
        $flatMap = [];
        $existing = DanDBList("SELECT content FROM sw_biomemap WHERE chunkx=? AND chunkz=?;", 'ii',
                              [floor($chunkx/floatval($biomeTileSize)), floor($chunkz/floatval($biomeTileSize))],
                              'server/generateMap.php->getBiomeTiles()->find existing section');
        if(sizeof($existing)===0) {
            // We didn't find any content. We will need to generate some now
            reporterror('server/generateMap.php->getBiomeTiles()->check for existing', 'no existing tiles found');

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
            */

            $mapSet = ClusterMap(0,$biomeSize-1,0,$biomeSize-1,$tileSet,40,[]);
            // We'll be needing to update ClusterMap() to handle receiving existing tile data
            //reporterror('server/generateMap.php->getBiomeTiles()->post clusterMap', 'sum of tiles='. sizeof($mapSet));
            // This is nice, but not in a good format. We need to convert it to a flat array of numbers. We will also need to convert our biome types to an int
            for($i=0; $i<$biomeSize*$biomeSize; $i++) {
                $x = $i % $biomeSize;
                $y = floor($i/floatval($biomeSize));
                $biome = $mapSet[$x][$y]['landType'];
                $flatMap[$i] = JSFindIndex($localTileNames, function($k) use ($biome) {
                    return $k===$biome;
                });
            }
            // With this data flattened, save it to the database
            DanDBList("INSERT INTO sw_biomemap (chunkx,chunkz,content) VALUES (?,?,?);", 'iis',
                      [floor($chunkx/floatval($biomeTileSize)), floor($chunkz/floatval($biomeTileSize)), json_encode($flatMap)],
                      'server/generateMap.php->getBiomeTiles()->save new section');
        }else{
            $flatMap = json_decode($existing[0]['content']);
        }
        
        // Now that we have saved the full biome data, we now need to isolate the data we need to return it
        $outMap = [];
        // Modulus works differently when working with negative numbers. -5%4 will give us -1. Instead, we want to shift this so that it will give us 3
        //if($chunkx>=0) { $offsetx = $chunkx % $biomeTileSize; } else { $offsetx = ((-$chunkx*$biomeTileSize) + $chunkx) % $biomeTileSize; }
        //if($chunkz>=0) { $offsetz = $chunkz % $biomeTileSize; } else { $offsetz = ((-$chunkz*$biomeTileSize) + $chunkz) % $biomeTileSize; }
        //$chunkx = 0
        //$chunkz = 1
        //biomeTileSize = 4; how many chunks wide & tall for each 'biome print'
        //chunkWidth = 8; how wide, tall and deep each chunk is
        //biomeSize = biomeTileSize * chunkWidth
        $offsetx = myModulus($chunkx, $biomeTileSize); // this function does modulus, but corrects for negative numbers, so -1%4 gives 3 instead of 1
        $offsetz = myModulus($chunkz, $biomeTileSize);
        //$records = '';
        for($z=0; $z<$chunkWidth; $z++) {
            for($x=0; $x<$chunkWidth; $x++) {
                $zShift = $chunkWidth*$biomeTileSize*$chunkWidth * $offsetz;
                $zStep = $chunkWidth*$biomeTileSize;
                $xShift = $chunkWidth * $offsetx;
                $outMap[$z*$chunkWidth + $x] = $flatMap[$zShift + ($zStep*$z) +$xShift +$x];
            }
        }
        //reporterror('server/generateMap.php->getBiomeTiles()->construct output', 'conversion: '. $records);
        return $outMap;
    }

    function buildNeigborData($targetx, $targetz) {
        // Collects biome content from the database, then converts it into a format that ClusterMap can make use of right away.
        // Returns a 2D array. If no content exists at the target location, this will return an empty array.

        global $chunkWidth, $biomeTileSize, $localTileNames;

        $result = DanDBList("SELECT content FROM sw_biomemap WHERE chunkx=? AND chunkz=?;", 'ii', [$targetx, $targetz],
                            'server/generateMap.php->getBiomeTiles()->get north neighbor');
        if(sizeof($result)==0) return [];
        $flatMap = json_decode($result[0]['content'], true);
        $field = [];

        // To use this effectively with ClusterMap, we need each tile to have an accurate world location.
        // We have a targetx & y value, but we will need to translate those based on the chunk size and biome chunk size
        $shiftx = $chunkWidth * $biomeSize * $targetx;
        $shiftz = $chunkWidth * $biomeSize * $targetz;
        for($i=0; $i<sizeof($flatMap); $i++) {
            $x = $i % ($chunkWidth * $biomeSize);
            $y = floor($i / floatval($chunkWidth * $biomeSize));
            if(!array_keys_exist($x, $field)) {
                $field[$x] = [];
            }
            if(!array_keys_exist($y, $field[$x])) {
                $field[$x][$y] = [];
            }
            $field[$x][$y] = ['x'=>$x, 'y'=>$y, 'landtype'=>$localTileNames[$flatMap[$i]]];
        }
        return $field;
    }

    function mergeMapSections($mapArray) {
        // Merges multiple map portions into a single section that can be passed to ClusterMap
        // $mapArray - list of array portions to merge. If any of these portions contain an empty array, they will be skipped
        // Returns the merged array
        $field = [];
        for($u=0; $u<sizeof($mapArray); $u++) {
            //for($i=)
        }
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