<?php

    function goodSpot($xpos, $ypos) {
        // Returns true if the given location is within the bounds of our array, or false if not
        // Since our range is fixed, this is pretty simple
        if($xpos<-50) return false;
        if($xpos>50) return false;
        if($ypos<-50) return false;
        if($ypos>50) return false;
        return true;
    }

    function randfloat() {
        // Returns a random float value between 0 and 1.
        return mt_rand(0, PHP_INT_MAX)/PHP_INT_MAX;
    }

    function worldmap_generate() {
        // Our goal will be to create an area that spans from -50 to +50 in both x and y directions. At the same time, we will set global
        // variables to help control where the next player will spawn at

        global $db;
        global $civilizations;
        global $civData;

        // Let's start with deciding how many types of land to provide. Map tile selection is still based on randomness, meaning swamps can
        // be located directly next to deserts. I don't know of any easy solution to correct that, at this time.
        define('x', 'x');
        define('y', 'y');
        $directionmap = [
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
            [[x=>-1, y=> 0], [x=> 0, y=> 1], [x=> 0, y=> 1], [x=> 1, y=> 0]]];
        // This directionmap looks complicated, but once you know how to use it, it'll make lots of sense. The objective here is to
        // pick a random direction, but if that doesn't work, pick another one. Picking one, and trying to prevent re-using the same
        // one for another pass, results in code that is much more complicated than desired. Here, you select a top-level array
        // entry at random. You then use the first 'set' of that as your random direction. If that doesn't work, try the next set.
        // If you go through all four sets, there are no other possible directions to go; options are exhausted, you're finished
        // checking.

        $mapminx = -50;
        $mapmaxx = 50;
        $mapminy = -50;
        $mapmaxy = 50;
        $biomesGenerated = 6;

        // Next, we need to have an array of map plots (with basic data applied to it).
        $fullmap = forrange($mapminy, $mapmaxy, 1, function($y) use ($mapminx, $mapmaxx) {
            return forrange($mapminx, $mapmaxx, 1, function($x) use ($y) {
                return [x=>$x,
                        y=>$y,
                        'landtype'=>-1];
                // We are only storing land type values here, since everything will be going into the database anyway, when we're done.
            });
        });

        // Now, generate a set number of points, based on the size of the map. This will manage all the tiles gathered by this point
        // land types to have now: 0=grassland, 1=forest, 2=desert, 3=swamp, 4=water
        srand(time());
        $biomepoint = [];
        $mapsize = 101;
        $chunkdensity = 25; // Here, larger numbers mean larger biomes
        $civdensity = 5; // Here, larger numbers mean fewer civilzations encountered
        $pointcount = floor(($mapsize * $mapsize) / $chunkdensity);
        //reporterror('Debug in server/mapbuilder.php->generatemap(): we have '. $pointcount .' biome points to generate');
        $biomepoint = forrange(0, $pointcount-1, 1, function($i) use ($mapminx, $mapmaxx, $mapminy, $mapmaxy, $biomesGenerated) {
            $genx = rand($mapminx,$mapmaxx);
            $geny = rand($mapminy,$mapmaxx);
            $biome = rand(0,$biomesGenerated-1);
            $fullmap[$genx][$geny]['landtype'] = $biome;
            return [
                'x'=>$genx,
                'y'=>$geny,
                'biome'=>$biome,
                'captured'=> [[
                    'x'=>$genx,
                    'y'=>$geny
                ]]
            ];
        });
        //reporterror("Debugging in server/mapbuilder.php->generatemap(): we have ". sizeof($biomepoint) ." biome points to process");
        //$logging = '';

        // Now, we need to run through all the boimepoints and try to advance each one of them. We will continue doing this until all the
        // biomepoints are empty
        while(sizeof($biomepoint)>0) {
            foreach($biomepoint as &$biome) {   // Since the internal components of $biome will be modified, we must pass by reference
                $targetslot = rand(0, sizeof($biome['captured'])-1);
                $target = $biome['captured'][$targetslot];
                $choices = $directionmap[rand(0, sizeof($directionmap)-1)]; // This selects one of the direction lists, at random
                $flagged = 0;
                //$logging .= 'Using slot '. $targetslot .' of '. sizeof($biome['captured']) .': ';
                for($dir=0; $dir<4; $dir++) {
                    $spotx = $target['x']+$choices[$dir]['x'];
                    $spoty = $target['y']+$choices[$dir]['y'];
                    if(goodSpot($spotx, $spoty)) {
                        if($flagged==0) {
                            //$logging .= 'Try #'. $dir .' = ['. $spotx .','. $spoty .']. ';
                            if($fullmap[$spotx][$spoty]['landtype']==-1) {
                                // This is a good spot to expand to. Mark this as this biomepoint's land type, and add this location to the
                                // list of captured locations.  We don't need to remove this current captured entry, as nearby blocks might 
                                // also be open to being captured.
                                //$logging .= 'Success'. PHP_EOL;
                                $fullmap[$spotx][$spoty]['landtype'] = $biome['biome'];
                                array_push($biome['captured'], ['x'=>$spotx, 'y'=>$spoty]);
                                $flagged = 1;
                            }
                        }
                    }
                }
                if($flagged==0) {
                    //$logging .= 'Source ['. $target['x'] .','. $target['y'] .'] deleted'. PHP_EOL;
                    array_splice($biome['captured'], $targetslot, 1);
                }
            }
            
            // Now, determine if there are any boimepoints that are out of directions to go, and remove them.
            // Using array_filter() here seems the best option
            $biomepoint = array_filter($biomepoint, function($ele) {
                return (sizeof($ele['captured'])>0);
            });

            // This section is only for debugging
            /*reporterror('Debugging result: '. $logging); $logging = '';
            reporterror('Debugging in server/mapbuilder.php->generatemap(): there are '. array_sum(array_map(function($ele) {
                return sizeof($ele['captured']);
            }, $biomepoint)) .' points left'); */
        }
        // With all the biomepoints gone, the map should be fully populated with biomes. Next, place down some civilizations.
        // Civilization choices will be determined by land types, so we need to determine which biome we're at before deciding
        // a civilization there
        $civcount = floor(($mapsize * $mapsize) / $civdensity);
        for($i=0; $i<$civcount; $i++) {
            $xspot = rand($mapminx, $mapmaxx);
            $yspot = rand($mapminy, $mapmaxy);
            // First, make sure there isn't already a civilization here. If so, find a new place
            if(isset($fullmap[$xspot][$yspot]['civ'])) {
                $i--;
            }else{
                // Since civilizations are stored in order, we can use the land type value to select which list of civilizations
                // to pick from, which will match the correct biome
                $fullmap[$xspot][$yspot]['civ'] = $civilizations[$fullmap[$xspot][$yspot]['landtype']]['civs']->cyclepull();
                // Some civilizations can alter the biome they are in. Let's do that now
                if($fullmap[$xspot][$yspot]['civ'] == 'ice horrors') {
                    $fullmap[$xspot][$yspot]['landtype'] = 7;
                }
                if($fullmap[$xspot][$yspot]['civ'] == 'ork tribe') {
                    $fullmap[$xspot][$yspot]['landtype'] = 6;
                }
                // Also include a strength of this civilization. We want to display lots of abandoned civilization places, too
                // Anything zero is considered abandoned, so the real range is from 0 to 3
                $fullmap[$xspot][$yspot]['civstrength'] = max(0, randfloat()*4.5-1.5);
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

        $built = implode(',', array_map(function($long) use ($civData) {
            return implode(',', array_map(function($wide) use ($civData) {
                if(isset($wide['civ'])) {
                    // Before we can save, we need to convert our civ value to an int. Best to do that before returning a value...
                    $civObj = JSFind($civData, function($civ) use ($wide) {
                        return strtolower($civ['name']) === strtolower($wide['civ']);
                    });
                    if($civObj==null) {
                        reporterror('server/mapbuilder.php->worldmap_generate()->build query',
                                    'Error: civlization '. $wide['civ'] .' was not found');
                        return '('. $wide['x'] .','. $wide['y'] .','. $wide['landtype'] .','. rand(0,13) .','. (randfloat()*1.5+0.5) .',-1,0)';
                    }
                    return '('. $wide['x'] .','. $wide['y'] .','. $wide['landtype'] .','. rand(0,13) .','. (randfloat()*1.5+0.5) .','.
                           $civObj['id'] .','. $wide['civstrength'] .')';
                }
                return '('. $wide['x'] .','. $wide['y'] .','. $wide['landtype'] .','. rand(0,13) .','. (randfloat()*1.5+0.5) .',-1,0)';
            }, $long));
        },$fullmap));
        //reporterror('Build content: '. $built);
        $db->query("INSERT INTO sw_map (x, y, biome, ugresource, ugamount, civilization, civlevel) VALUES ". $built .";");
        $err = mysqli_error($db);
        if($err) {
            reporterror('mapbuilder.php->worldmap_generate()->save all content', 'Mysql reported an error: '. $err ."\r\nFull data:". $built);
            ajaxreject('internal', "There was an error saving worldmap data. See the error log");
        }
                //'server/mapbuild.php->generatemap()->save map content');
        // And... that should be everything we need
    }

    function ensureMinimapXY($worldx, $worldy) {
        // Allows you to create a minimap based on world coordinates, if you don't (yet) have the map object from the database
        ensureMinimap(DanDBList("SELECT * FROM sw_map WHERE x=? AND y=?;", 'ii', [$worldx,$worldy],
                                'sever/mapbuilder.php->ensureMinimapXY()')[0]);
        /*
        ensureMinimap(danget("SELECT * FROM sw_map WHERE x=". $worldx ." AND y=". $worldy .";",
                             'server/mapbuilder.php->generateminimapbycoords'));*/
    }

    function ensureMinimapId($worldcoordid) {
        // Allows you to create a minimap based on a world coordinate ID.
        ensureMinimap(DanDBList("SELECT * FROM sw_map WHERE id=?;", 'i', [$worldcoordid],
                                'server/mapbuilder.php->ensureMinimapId()')[0]);
        /*ensureMinimap(danget("SELECT * FROM sw_map WHERE id=". $worldcoordid .";",
                             'server/mapbuilder.php->generateminimapfromid'));*/
    }

    function ensureMinimap($mapdata) {
        // Allows us to ensure that a minimap exists for a given world map location. If none exists, one will be created for it.

        // Generates a minimap. Requires a full read-out of the world map coordinate from the database.  Use either
        // generateminimapfromcoords or generateminimapfromid to grab that data.

        // At some point, we may want to consider the land types of surrounding territories. But for now, we won't worry about it.

        global $db;

        // Start by ensuring there is no minimap data here yet already
        if(sizeof(DanDBList("SELECT x FROM sw_minimap WHERE mapid=? LIMIT 1;", 'i', [$mapdata['id']],
                  'server/mapbuilder.php->generateminimap()->check existence of minimap'))>0)
            return;
        
        // To start with, we need to determine the probability rate of certain land types for this area.
        $ratios = [ // Determines the likelihood of seeing certain types of land (relative to the area)
            ['group'=>'major', 'amount'=>100],
            ['group'=>'minor', 'amount'=>50],
            ['group'=>'rock', 'amount'=>15], // This is exposed rock that doesn't require digging through dirt to find. For new players,
                                                    // we will guarantee at least 1 rock square on the map somewhere
            ['group'=>'rare', 'amount'=>5],
            ['group'=>'ore', 'amount'=>1], // This is exposed ore that can be mined straight away - but is rare to find
        ];
        $conversion = [ // Determines what land types we'll find, based on the land type
            ['name'=>'grassland', 'major'=>'grass', 'minor'=>'trees', 'rock'=>'rock', 'rare'=>'swamp', 'ore'=>'ore'],
            ['name'=>'forest', 'major'=>'trees', 'minor'=>'grass', 'rock'=>'rock', 'rare'=>'swamp', 'ore'=>'ore'],
            ['name'=>'desert', 'major'=>'desert', 'minor'=>'grass', 'rock'=>'rock', 'rare'=>'water', 'ore'=>'desert'],
            ['name'=>'swamp', 'major'=>'swamp', 'minor'=>'trees', 'rock'=>'rock', 'rare'=>'grass', 'ore'=>'water'],
            ['name'=>'water', 'major'=>'water', 'minor'=>'grass', 'rock'=>'rock', 'rare'=>'rock', 'ore'=>'water'],
            ['name'=>'jungle', 'major'=>'trees', 'minor'=>'water', 'rock'=>'rock', 'rare'=>'swamp', 'ore'=>'swamp'],
            ['name'=>'lavascape', 'major'=>'rock', 'minor'=>'lava', 'rock'=>'rock', 'rare'=>'lava', 'ore'=>'lava'],
            ['name'=>'frozen', 'major'=>'ice', 'minor'=>'ice', 'rock'=>'rock', 'rare'=>'ice', 'ore'=>'ice']
        ];
        $names = ['grass', 'trees', 'swamp', 'desert', 'water', 'rock', 'ore', 'lava', 'ice'];

        // Now, turn our ratios list into a flat array, with X number of elements per type
        $source = [];
        foreach($ratios as $ra) {
                // We need to append the existing array with the output of our forrange function
            $source = array_merge($source, forrange(0, $ra['amount'], 1, function() use ($ra) {
                return $ra['group'];
            }));
        }
        // Shuffle our list, and then select only the first 64 elements
        shuffle($source);
        array_splice($source, 64, sizeof($source)-64);

        // Next, we need to turn our array into a list of DB entries. Note that we need to convert our 'major/minor/rare' elements into the
        // target types for this particular land type
        $slot = -1;
        $send = implode(',', array_map(function($ele) use ($conversion, &$slot, $mapdata, $names) {
            $slot++;
            // Here, $ele is either major, minor or something similar. First, we need to convert this into one of the land types, based on
            // the $conversion array, as well as the biome ID of the world map tile.
            //$landtype = JSFind($conversion, function($reap) use ($mapdata) {  // This won't work, because $mapdata['biome'] holds an id, not a name
            //    return (name==$mapdata['biome']);
            //})[$ele];
            $landtype = $conversion[$mapdata['biome']][$ele];
            // Next, convert this from our land names, to land types. Note that the needle parameter comes first, then the haystack parameter
            $landid = array_search($landtype, $names);
            //reporterror('Debug in server/mapbuilder.php->generateminimap(): From '. $ele .' to '. $landtype .' to '. $landid);
            return '('. $mapdata['id'] .','. ($slot%8) .','. (floor($slot/8.0)) .','. $landid .')';
        }, $source));
        
        // Now we are ready to send this to the database
        $db->query("INSERT INTO sw_minimap (mapid,x,y,landtype) VALUES ". $send .";");
        $err = mysqli_error($db);
        if($err) {
            reporterror('server/mapbuilder.php->generateminimap()->save new map data', 'MySQL reported an error: '. $err);
            ajaxreject('internal', 'There was an error saving worldmap data. See the error log');
        }
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

