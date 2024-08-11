<?php
    /*  generateMap.php
        Handles functions that create and expand the player's map
        For the game Settlers & Warlords
    */

    require_once("libs/common.php");

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

        // Grab the target chunk from the database
        reporterror('server/generateMap.php->loadChunk()->input', 'load chunk at coords=['. $chunkx .','. $chunky .','. $chunkz .']');
        $pick = DanDBList("SELECT * FROM sw_mapchunk WHERE chunkx=? AND chunky=? AND chunkz=?;", 'iii', [$chunkx, $chunky, $chunkz], 'server/routes/loadmap.php->fetch chunk');
        if(sizeof($pick)>0) {
            reporterror('server/generateMap.php->loadChunk()->chunk exists', 'returning with '. json_encode($pick[0]));
            return $pick[0];
        }
        reporterror('server/generateMap.php->loadChunk()->chunk not found', 'chunk was not found. Generating now');
        
        // Oh dear, we didn't find the target chunk... probably because it doesn't exist yet. No matter, we'll generate it now
        // what we generate will be based on the chunk's vertical location
        if($chunky<0) {
            $fullMap = forrange(0,7,1, function($z) {
                return forrange(0,7,1, function($y) use ($z) {
                    return forrange(0,7,1, function($x) use ($y,$z) {
                        return 'air';
                    });
                });
            });
        }else if($chunky>0) {
            $fullMap = forrange(0,7,1, function($z) {
                return forrange(0,7,1, function($y) use ($z) {
                    return forrange(0,7,1, function($x) use ($y,$z) {
                        return 'rock';
                    });
                });
            });
        }else{
            $fullMap = forrange(0,7,1, function($z) {
                return forrange(0,7,1, function($y) use ($z) {
                    return forrange(0,7,1, function($x) use ($y,$z) {
                        if($y>4) return 'air';
                        if($y<4) return 'dirt';
                        return 'grassydirt';
                    });
                });
            });
        }
        $tileConversion = ['air','dirt','grassydirt','rock','water','fire','wood'];
        $flatMap = [];
        for($z=0; $z<=7; $z++) {
            for($y=0; $y<=7; $y++) {
                for($x=0; $x<=7; $x++) {
                    $slot = JSFindIndex($tileConversion, function($i) use ($fullMap, $x, $y, $z) {
                        return $i===$fullMap[$z][$y][$x];
                    });
                    array_push($flatMap, ['t'=>$slot, 'h'=>100]);
                }
            }
        }

        // With the flat map made, we can save it to the database
        DanDBList("INSERT INTO sw_mapchunk (chunkx,chunky,chunkz,content) VALUES (?,?,?,?);", 'iiis', [$chunkx, $chunky, $chunkz, json_encode($flatMap)],
                    'server/routes/loadmap.php->save new tile content');
        // We also need to push this content onto our output value, in the same format that we would receive from the database
        return ['chunkx'=>$chunkx, 'chunky'=>$chunky, 'chunkz'=>$chunkz, 'content'=>json_encode($flatMap)];
    }
?>