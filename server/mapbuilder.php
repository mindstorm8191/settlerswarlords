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


    function generatemap() {
        // Our goal will be to create an area that spans from -50 to +50 in both x and y directions. At the same time, we will set global
        // variables to help control where the next player will spawn at

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
        // pick a random direction, but if that doesn't work, pick another one. Picking one, and trying to prevent re-using that
        // for another pass, results in code that is much more complicated than desired. Here, you select a top-level array entry
        // at random. You then use the first 'set' of that as your random direction. If that doesn't work, try the next one.
        // If you go through all four sets, there are no other possible directions to go.

        // Next, we need to have an array of map plots (with data applied to it).
        $fullmap = forrange(-50, 50, 1, function($y) {
            return forrange(-50, 50, 1, function($x) use ($y) {
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
        $chunkdensity = 25;
        $pointcount = floor(($mapsize * $mapsize) / $chunkdensity);
        //reporterror('Debug in server/mapbuilder.php->generatemap(): we have '. $pointcount .' biome points to generate');
        $biomepoint = forrange(0, $pointcount-1, 1, function($i) {
            $genx = rand(-50,50);
            $geny = rand(-50,50);
            $biome = rand(0,4);
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
            /*reporterror('Debugging result: '. $logging);
            $logging = '';
            reporterror('Debugging in server/mapbuilder.php->generatemap(): there are '. array_sum(array_map(function($ele) {
                return sizeof($ele['captured']);
            }, $biomepoint)) .' points left'); */
        }
        // With all the biomepoints gone, the map should be fully populated with land types. Now we need to save this to the database.
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

        $built = implode(',', array_map(function($long) {
            return implode(',', array_map(function($wide) {
                return '('. $wide['x'] .','. $wide['y'] .','. $wide['landtype'] .','. rand(0,13) .','. (randfloat()*1.5+0.5) .')';
            }, $long));
        },$fullmap));
        //reporterror('Build content: '. $built);
        danpost("INSERT INTO sw_map (x, y, biome, ugresource, ugamount) VALUES ". $built .";",
                'server/mapbuild.php->generatemap()->save map content');
        // And... that should be everything we need
    }

    function ensureMinimapXY($worldx, $worldy) {
        // Allows you to create a minimap based on world coordinates, if you don't (yet) have the ID of the world coordinates
        ensureMinimap(danget("SELECT * FROM sw_map WHERE x=". $worldx ." AND y=". $worldy .";",
                             'server/mapbuilder.php->generateminimapbycoords'));
    }

    function ensureMinimapId($worldcoordid) {
        // Allows you to create a minimap based on a world coordinate ID.
        ensureMinimap(danget("SELECT * FROM sw_map WHERE id=". $worldcoordid .";",
                             'server/mapbuilder.php->generateminimapfromid'));
    }

    function ensureMinimap($mapdata) {
        // Allows us to ensure that a minimap exists for a given world map location. If none exists, one will be created for it.

        // Generates a minimap. Requires a full read-out of the world map coordinate from the database.  Use either
        // generateminimapfromcoords or generateminimapfromid to grab that data.

        // At some point, we may want to consider the land types of surrounding territories. But for now, we won't worry about it.

        // Start by ensuring there is no minimap data here yet already
        if(danget("SELECT x FROM sw_minimap WHERE mapid=". $mapdata['id'] .";",
                  'server/mapbuilder.php->generateminimap()->check existence of minimap', true))
            return false;
        
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
            ['name'=>'desert', 'major'=>'desert', 'minor'=>'grass', 'rock'=>'rock', 'rare'=>'water', 'ore'=>'ore'],
            ['name'=>'swamp', 'major'=>'swamp', 'minor'=>'trees', 'rock'=>'rock', 'rare'=>'grass', 'ore'=>'ore'],
            ['name'=>'water', 'major'=>'water', 'minor'=>'grass', 'rock'=>'rock', 'rare'=>'trees', 'ore'=>'ore']
        ];
        $names = ['grass', 'trees', 'swamp', 'desert', 'water', 'rock', 'ore'];

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
            reporterror('Debug in server/mapbuilder.php->generateminimap(): From '. $ele .' to '. $landtype .' to '. $landid);
            return '('. $mapdata['id'] .','. ($slot%8) .','. (floor($slot/8.0)) .','. $landid .')';
        }, $source));
        //$send = implode(',', $list);

        // Now we are ready to send this to the database
        danpost("INSERT INTO sw_minimap (mapid,x,y,landtype) VALUES ". $send .";",
                'server/mapbuilder.php->generateminimap()->save new map data');
    }

    function cityLocation($level, $mode, $count) {
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
        $mappos = danget("SELECT biome, owner FROM sw_map WHERE x=". $x ." AND y=". $y .";",
                         'ajax.php->cityLocation->check map coords');
        if($mappos['biome']==2 || $mappos['biome']==4 || $mappos['owner']!=0) {
            // This location will not work; it is either desert, water, or someone has already taken it. We will need to find another place
            $out = advanceStartPos($level, $mode, $count);
            return cityLocation($out['level'], $out['mode'], $out['count']);
        }
        // This location is acceptable. Before returning it, update the fields in the database with the next values
        $out = advanceStartPos($level, $mode, $count);
        setGlobal("newplayerlevel", $out['level']);
        setGlobal("newplayermode", $out['mode']);
        setGlobal("newplayercount", $out['count']);
        return array('x'=>$x, 'y'=>$y);
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

    function updateknownmap($playerid, $xpos, $ypos) {
        // Updates the user's known map, based on a given coordinate.  If they don't have information about the given location, it
        // will be generated.

        // Start with getting current information about the given map square
        $square = danget("SELECT * FROM sw_map WHERE x=". $xpos ." AND y=". $ypos .";",
                         'server/mapbuilder.php->updateknownmap->get map data');
        // With 3 variables serving as the 'key', we can't really do the 'on duplicate key update' trick. So, start by checking if
        // this knownmap location exists (for this player)
        if(danget("SELECT * FROM sw_knownmap WHERE playerid=". $playerid ." AND x=". $xpos ." AND y=". $ypos .";",
                        'server/mapbuilder.php->updateknownmap()->find existing known square', true)) {
            // Record already exists. Update it
            danpost("UPDATE sw_knownmap SET lastcheck=NOW(), owner=". $square['owner'] .",civ=0,population=". $square['population'] ." WHERE playerid=".
                    $playerid ." AND x=". $xpos ." AND y=". $ypos .";",
                    'server/mapbuilder.php->updateknownmap()->update existing instance');
        }else{
            // No record was found. Create a new one
            danpost("INSERT INTO sw_knownmap (playerid,x,y,lastcheck,owner,civ,population) VALUES (". $playerid .",". $xpos .",". $ypos .
                    ",NOW(),". $square['owner'] .",0,". $square['population'] .");",
                    'server/mapbuilder.php->updateknownmap()->add new spot to map');
        }
    }
?>

