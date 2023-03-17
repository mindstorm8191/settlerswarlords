<?php
    /*  signup.php
        Allows new users to sign up to start playing the game. Exciting!
        For the game Settlers & Warlords
    */

    require_once("../config.php");
    require_once("../libs/common.php");
    require_once("../libs/DanGlobal.php");
    require_once("../libs/clustermap.php");

    require_once("../globals.php");
    require_once("../minimap.php");

    // Start by collecting the data
    require_once("../getInput.php");

    // Validate the input
    $con = verifyInput($msg, [
        ['name'=>'username', 'required'=>true, 'format'=>'stringnotempty'],
        ['name'=>'password', 'required'=>true, 'format'=>'stringnotempty'],
        ['name'=>'pass2', 'required'=>true, 'format'=>'stringnotempty'],
        ['name'=>'email', 'required'=>true, 'format'=>'email']
    ], 'server/routes/signup.php->verify input');

    // check that the two passwords match
    if($con['password'] !== $con['pass2']) ajaxreject('badinput', 'Your passwords did not match');

    // Check that the username provided doesn't already exist
    $testUser = DanDBList("SELECT * FROM sw_player WHERE name=?;", 's', [$con['username']], 'routes->signup->check username in db');
    if(sizeof($testUser)!==0) {
        // Oh - we found one... Return an error. The front end will decide what to do from here
        ajaxreject('badinput', 'That username already exists. Try another');
    }

    srand(time());
    $ajaxcode = rand(0, pow(2,31));
    $emailcode = rand(0, pow(2,31));
    // We should be sending the user a verification email, but we don't have that option on Localhost

    // Ensure we have a world map generated. If there isn't one, we can generate one now
    $playerLevel = 0;
    $playerMode = 0;
    $playerCount = 0;  // These will be the initial values for the first player
    if(sizeof(DanDBList("SELECT * FROM sw_map LIMIT 1;", '', [], 'server/routes/signup.php->verify world map exists'))===0) {
        worldmap_generate();
    }else{
        $playerLevel = getGlobal('newPlayerLevel');
        $playerMode  = getGlobal('newPlayerMode');
        $playerCount = getGlobal('newPlayerCount');
    }

    // Next, determine where the player will be placed. Even for the first player, they may end up in a place that is not ideal
    // to start in.
    [$playerx, $playery] = newPlayerLocation($playerLevel, $playerMode, $playerCount);

    DanDBList("INSERT INTO sw_player (name, password, email, ajaxcode, emailcode, ipaddress, lastlogin, currentx, currenty) ".
              "VALUES (?,?,?,?,?,?,NOW(),?,?);", 'sssiisii', [
                  $con['username'], $con['password'], $con['email'], $ajaxcode, $emailcode, $_SERVER['REMOTE_ADDR'],
                  $playerx, $playery
              ], 'server/routes/signup.php->add new player');
    $playerid = mysqli_insert_id($db);

    // Now is a good time to create the workers on this map
    $workers = createWorkers(4);

    DanDBList("UPDATE sw_map SET owner=?, population=4, workers=? WHERE x=? AND y=?;", 'isii',
              [$playerid, json_encode($workers), $playerx, $playery], 'server/routes/signup.php->update players map');
    
    // Update the player's known map now to show they're aware of their own starting land
    // worldMap_updateKnown($playerid, $playerx, $playery, "NOW()", $uid, 1, 4);

    // Generate the localMap content for this worldMap tile
    ensureMinimap($playerx, $playery, true);

    // We're ready to send a response to the user. This will be the same response as when a user signs back in, so we have combined
    // that into one script
    include("../finishLogin.php");


    function randomFloat() {
        // Returns a random float value between 0 and 1.
        return mt_rand(0, PHP_INT_MAX)/PHP_INT_MAX;
    }

    function newPlayerLocation($level, $mode, $count) {
        // Recursive function to determine where a new player should be placed. This will avoid inhospitable locations such as oceans,
        // lavascapes and civilization-occupied tiles.
        // $level, $mode, $count - variables used to determine placement. These are normally gathered from the database's globals
        //      table, but each start on zero. Level is how far from center the point is, mode determines what face of the square
        //      it is on, and count is how far along that face the location is from a corner
        // Returns an array holding X & Y coordinates of where the next player should be placed. The level, mode and count values
        // will be saved to the database's globals table

        global $biomeData;

        // Start by determining where on the grid this location will be
        $x = 0;
        $y = 0;
        $limit = 0;  // How far along this line we can go before changing modes (and/or levels)
        switch($mode) {
            case 0: // top, from left to right
                $limit = $level*2+1;
                $x = -$level +$count;
                $y = -$level;
            break;
            case 1: // right, from top to bottom
                $limit = $level*2 -1;
                $x = $level;
                $y = -$level +$count;
            break;
            case 2: // bottom, from right to left
                $limit = $level*2 +1;
                $x = $level -$count;
                $y = $level;
            break;
            case 3: // left, from bottom to top
                $limit = $level*2 -1;
                $x = -$level;
                $y = $level -$count;
            break;
        }

        // No matter what mode, we need to scale this, giving more space between each user
        $x = $x *5;
        $y = $y *5;

        // Determine if this is a suitable location to place a player
        $mappos = DanDBList("SELECT biome, owner, civilization FROM sw_map WHERE x=? AND y=?;", 'ii', [$x,$y],
                            'server/routes/signup.php->newPlayerLocation->check location')[0];
        if(
            $biomeData[$mappos['biome']]['supportsNewPlayers']===false ||
            $mappos['owner'] !== 0 ||
            $mappos['civilization'] !== -1
        ) {
            $out = advanceStartPos($level, $mode, $count);
            return newPlayerLocation($out['level'], $out['mode'], $out['count']);
        }
        // This location is acceptable. Before returning it, update the fields in the database with the next values
        $out = advanceStartPos($level, $mode, $count);
        setGlobal('newPlayerLevel', $out['level']);
        setGlobal('newPlayerMode', $out['mode']);
        setGlobal('newPlayerCount', $out['count']);
        return [$x, $y];
    }

    function advanceStartPos($level, $mode, $count) {
        // Determines where the next position for a new player should be.
        // $level - how far from the center of the map the current location is
        // $mode - which face of the square we are working at
        // $count - how far along this face of the square we are

        // At level 0, the only way forward is to increase level
        if($level===0) return ['level'=>1, 'mode'=>0, 'count'=>0];

        $limit = $level * 2; // This determines how far we should go before switching sides
        switch($mode) {
            case 0: case 2: $limit++; break;
            case 1: case 3: $limit--; break;
        }
        
        $count++;
        if($count>$limit) {
            $count=0;
            $mode++;
            if($mode>4) {
                $mode=0;
                $level++;
            }
        }
        return ['level'=>$level, 'mode'=>$mode, 'count'=>$count];
    }

    function worldmap_generate() {
        // Creates an entire new world. This is called when the first player is created.

        global $db;
        global $biomeData;

        // Our goal is to create an area that spans from -50 to 50 in both x & y directions. We will also set global variables that determine
        // where new players will spawn at.

        $mapsize = 101;
        $mapminx = -50; $mapmaxx = 50;
        $mapminy = -50; $mapmaxy = 50;
        $civDensity = 5;

        //$time = microtime(true);
        // Start by generating a clustered map, as a base
        $fullMap = ClusterMap($mapminx, $mapmaxx, $mapminy, $mapmaxy,
            new WeightedRandom(
                // We already have this data managed in our $biomeData structure. A useful programming concept is known as Single Source of Truth.
                // Instead of having multiple places where we need to replicate data, it is better to use a single structure. That way, if the
                // data needs to change, I don't need to search out all the places it was used.
                array_values(
                    array_filter(
                        array_map(function($biome) {
                            //reporterror('server/routes/signup.php->worldmap_generate()->create weighted randoms list',
                            //            'name='. $biome['biome'] .', amount='. $biome['frequency']);
                            return ['name'=>$biome['biome'], 'amount'=>$biome['frequency']];
                        }, $biomeData),
                        function($ele) {
                            //reporterror('server/routes/signup.php->worldmap_generate()->filter weighted randoms list', json_encode($ele));
                            //return $ele['amount']>0; this doesn't work the same way in php
                            if($ele['amount']>0) return true;
                            //reporterror('server/routes/signup.php->worldmap_generate()->filter weighted randoms list',
                            //            'Biome '. $ele['name'] .' has no civilizations listed');
                            return false;
                        }
                    )
                )
            ),
            25, 0
        );
        //$time = (microtime(true) - $time) * 1000;
        //reporterror('server/routes/signup.php->worldmap_generate()', 'ClusterMap run time: '. $time);

        // Place down some civilizations. Choices are determined by land types, so we need to determine which biome we're at before
        // deciding a civilization there
        $civCount = floor(($mapsize * $mapsize) / $civDensity);
        reporterror('server/routes/signup.php->worldmap_generate()', 'We have '. $civCount .' civs to add');
        $time = microtime(true);
        for($i=0; $i<$civCount; $i++) {
            $xpos = rand($mapminx, $mapmaxx);
            $ypos = rand($mapminy, $mapmaxy);
            // First, make sure there isn't already a civilization here
            if(isset($fullMap[$xpos][$ypos]['civ'])) {
                //reporterror('server/routes/signup.php->worldmap_generate()->civ generator',
                //            'i'. $i .', @'. $xpos .'x'. $ypos .', civ '. $fullMap[$xpos][$ypos]['civ'] .' already here');
                $i--; // move back the stepper so we can try again
                continue;
            }
            // First select the civ list from the current biome
            $biomeList = JSFind($biomeData, function($biome) use ($fullMap, $xpos, $ypos) {
                //reporterror('server/routes/signup.php->worldmap_generate()->civ generator->find biome structure',
                //            $fullMap[$xpos][$ypos]['landType'] .' vs '. $biome['biome']);
                return $fullMap[$xpos][$ypos]['landType'] === $biome['biome'];
            });
            
            // Not all biomes will have a civilization list associated to them. If not, we should pick another location
            if($biomeList['civs']) {
                $fullMap[$xpos][$ypos]['civ'] = $biomeList['civs']->cyclepull();
            }else{
                //reporterror('server/routes/signup.php->worldmap_generate()->civ generator',
                //            'i'. $i .', @'. $xpos .'x'. $ypos .', biome '. $biomeList['name'] .' has no civ');
                $i--;
                continue;
            }

            // Some civilizations alter the biome they exist in. Let's do that now
            if($fullMap[$xpos][$ypos]['civ'] == 'ice horrors') {
                $fullMap[$xpos][$ypos]['landType'] = 'frozen wasteland';
            }
            if($fullMap[$xpos][$ypos]['civ'] == 'ork tribe') {
                $fullMap[$xpos][$ypos]['landType'] = 'lavascape';
            }

            // All civilizations will have a strength value. We will also display abandoned civilizations.
            // This range is currently from 0 to 3; I would like to eventually have civs expand to additional territories if it is strong enough
            $fullMap[$xpos][$ypos]['civstrength'] = max(0, randomFloat()*4.5 -1.5);
            //reporterror('server/routes/signup.php->worldmap_generate()->civ generator',
            //            'i'. $i .', @'. $xpos .'x'. $ypos .' now has '. $fullMap[$xpos][$ypos]['civ'] .' at strength '. $fullMap[$xpos][$ypos]['civstrength']);
        }
        $time = (microtime(true) - $time) * 1000;
        reporterror('server/routes/signup.php->worldmap_generate()->after civs', 'civ adds took time='. $time);

        // We need to convert biome names to an ID, so it matches the indexing of other areas, including the database
        $fullMap = array_map(function($long) {
            return array_map(function($wide) {
                global $biomeData;
                $wide['landType'] = array_search($wide['landType'], array_map(function($biome) {
                    return $biome['biome']; // this gives us only a list of names
                }, $biomeData));
                return $wide;
            }, $long);
        }, $fullMap);

        // Ore types and their amount can be determined while saving our content
        
        // Saving this much data is challenging; saving each tile separately can take a very long time. But saving everything in one lump
        // statement may be too large to save in one go. We will try a mix of the two methods
        //$comm = $db->prepare('INSERT INTO sw_map (x,y,biome,ugresource,ugamount,civilization,civlevel) VALUES (?,?,?,?,?,?,?);');
        foreach($fullMap as $long) {
            $adds = implode(',', array_map(function($tile) {
                // Convert our object into a string, each with surrounding parenthesis
                global $biomeData;
                global $civData;
                global $oreTypes;

                return '('.
                    $tile['x'] .','.
                    $tile['y'] .','.
                    $tile['landType'] .','.
                    rand(0,sizeof($oreTypes)-1) .','.
                    (randomFloat()*1.5+0.5) .','.
                    (isset($tile['civ'])?
                        JSFindIndex($civData, function($civ) use ($tile) {
                            if(strtolower($civ['name']) == strtolower($tile['civ'])) return true;
                            return false;
                        }) .','. $tile['civstrength']
                    :('-1,0')) .')';
            }, $long));
            $result = $db->query("INSERT INTO sw_map (x,y,biome,ugresource,ugamount,civilization,civlevel) VALUES ". $adds .";");
            if(!$result) {
                reporterror('server/routes/signup.php->save world map', 'Worldmap save failed. Content='. $adds .', error='. $db->error);
                ajaxreject('internal', 'There was an error when saving the world (map)');
            }
        }
    }

    function createWorkers($workerCount) {
        // Creates new workers, each with a unique name and location on the local map.
        // workerCount - how many workers to produce in this batch

        // Workers all need unique IDs. And since workers will (eventually) be able to change local maps, they all need unique IDs across the
        // map. So we'll use a global variable to hold that
        $lastId = getGlobal('lastWorkerId');
        if(is_null($lastId)) $lastId = 0;

        $workers = forrange2($workerCount, function($v) use ($lastId) {
            global $workerNames;
            //$lastId = $lastId +1;
            return [
                'name'=>getRandomFrom($workerNames),
                'id'=>$lastId +1 +$v,
                'x'=>rand(0,40),
                'y'=>rand(0,40),
                'status'=>'idle',
                'moveCounter'=>0,
                'tasks'=>[],
                'carrying'=>[]
            ];
        });

        // With that done, we need to save the last used ID
        setGlobal('lastWorkerId', $lastId+$workerCount);
        return $workers;
    }
?>


