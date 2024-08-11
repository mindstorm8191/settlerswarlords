<?php
    /*  signup.php
        Allows new players to sign up to start playing the game. Exciting!
        For the game Settlers & Warlords
    */

    require_once("../config.php");
    require_once("../libs/common.php");
    require_once("../libs/DanGlobal.php");
    require_once("../libs/clustermap.php");

    // Start by collecting the data
    require_once("../getInput.php");

    // Validate the input
    $con = verifyInput($msg, [
        ['name'=>'username', 'required'=>true, 'format'=>'stringnotempty'],
        ['name'=>'password', 'required'=>true, 'format'=>'stringnotempty'],
        ['name'=>'pass2', 'required'=>true, 'format'=>'stringnotempty'],
        ['name'=>'email', 'required'=>true, 'format'=>'email']
    ], 'server/routes/signup.php->verify input');

    // Check that the two passwords match
    if($con['password'] !== $con['pass2']) ajaxreject('badinput', 'Your passwords do not match');

    $testUserList = DanDBList("SELECT * FROM sw_player WHERE name=?;", 's', [$con['username']], 'routes/signup/check username in db');
    if(sizeof($testUserList)!==0) {
        // We got a hit... this name is used. The front end will decide what to do from here
        ajaxreject('badinput', 'That username already exists. Try another');
    }

    srand(time());
    $ajaxcode = rand(0, pow(2,31));
    $emailcode = rand(0, pow(2,31));
    $location = json_encode([4,4,6]); // We are storing the player's location as JSON content, as we don't (normally) need to access it on the server side
    // Note that positional data will be a floating point value, not an int.
    // We should be sending the user a verification email, but we don't have that option on Localhost

    DanDBList("INSERT INTO sw_player (name, password, email, ajaxcode, emailcode, ipaddress, lastlogin, location) VALUES ".
              "(?,?,?,?,?,?,NOW(),?);", 'sssiiss', [
                  $con['username'], $con['password'], $con['email'], $ajaxcode, $emailcode, $_SERVER['REMOTE_ADDR'], $location
              ], 'server/routes/signup.php->add new player');
    $playerid = mysqli_insert_id($db);
    $playername = $con['username'];

    // Next, we need to generate a map tile for this player to be on. Fortunately, we have a function that can load content when players log in, and
    // if no map chunk exists, one can be created on demand.
    /*
    // Previously, this would be the time to check that the world exists, and generate it if not. But with 3D, we are handling map generation much differently.
    // For now, we need to make some land to 'put the player on'. We'll transfer this to its own function soon so we can generate more land using it

    $fullMap = forrange(0,7,1,function($z) {
        return forrange(0,7,1, function($y) use ($z) {
            return forrange(0,7,1, function($x) use ($y,$z) {
                if($y>4) return 'air';
                if($y<4) return 'dirt';
                return 'grassydirt';
            });
        });
    });

    //reporterror('server/routes/signup.php->mid map generation', 'got the map generated');

    // We need a conversion chart, to change block names into numbered types, for easier storage
    $tileConversion = ['air', 'dirt', 'grassydirt', 'rock'];
    // Floor types
    // 0 = open air
    // 1 = solid rock
    // 2 = bare dirt
    // 3 = short grass
    // 4 = wheat
    // 5 = oat
    // 6 = rye
    // 7 = barley
    // 8 = millet
    // 9 = foresty flooring
    // 10 = covered in leaves
    // 

    // From this, we can turn it into a flat array. Since it is a fixed size array, we can assume the coordinates of each tile within the chunk,
    // but the rest will be variable data so it'll be wise to use JSON content
    $flatMap = [];
    for($z=0; $z<=7; $z++) {
        for($y=0; $y<=7; $y++) {
            for($x=0; $x<=7; $x++) {
                $slot = JSFindIndex($tileConversion, function($i) use ($fullMap, $z, $y, $x) {
                    return $i===$fullMap[$z][$y][$x];
                });
                array_push($flatMap, ['t'=>$slot, 'h'=>100]);
                // This'll have to do for now; we will work on additional complexities later, such as:
                // t = tile type
                // h = tile health
                // f = floor type
                // n,s,e,w = type of wall for each direction
                // c = ceiling type
                // pollution will be handled on a chunk level, not a per-tile level
            }
        }
    }
    

    // With our flat map we should be ready to save to the database
    DanDBList("INSERT INTO sw_mapchunk (chunkx,chunky,chunkz,content) VALUES (0,0,0,?);", 's', [json_encode($flatMap)], 'server/routes/signup.php->save map chunk');
    */

    // That should be enough to complete our work here. To get the user to log in, we need to use the finishLogin script
    include_once("../finishLogin.php");
    
    /*
    // Ensure we have a world map generated. If there isn't one, we can generate one now.
    // We will still manage the world map as a 2D grid; this will be the easiest way to generate biomes
    // This time, many additional settings won't be specified on map generation - which will hopefully save on generation processing time.
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
    */

    function worldmap_generate() {
        // Creates the basis for a world map. This is called when the first player is created.

        global $db;
        global $biomeData;

        // Our goal is to create an area that spans from -50 to 50 in both x & y directions. We will also set global variables taht determine where new players will start at.

        $mapsize = 101;
        $mapminx = -50; $maxmaxx = 50;
        $mapminy = -50; $mapmaxy = 50;
        $civDensity = 5;

        $fullMap = ClusterMap($mapminx, $mapmaxx, $mapminy, $mapmaxy,
            new WeightedRandom(
                // We already have this data managed in our $biomeData structure. A useful programming concept is known as Single Source of Truth.
                // Instead of having multiple places where we need to replicate data, it is better to use a single structure. That way, if the
                // data needs to change, I don't need to search out all the places it was used. However, this means we need to morph our data into
                // something we can use here
                array_values(
                    array_filter(
                        array_map(function($biome) {
                            return ['name'=>$biome['biome'], 'amount'=>$biome['frequency']];
                        }, $biomeData),
                        function($ele) {
                            if($ele['amount']>0) return true;
                            return false;
                        }
                    )
                )
            ), 25, 0
        );

        // Next, place down some civilizations. Choices are determined by land type, so we need to determine which biome we're in before deciding the civ there
        $civCount = floor(($mapsize * $mapsize) / $civDensity);
        for($i=0; $i<$civCount; $i++) {
            $xpos = rand($mapminx, $mapminy);
            $ypos = rand($mapminy, $mapmaxy);
            // Check if there is a civilization already here
            if(isset($fullMap[$xpos][$ypos]['civ'])) {
                $i--; // move back the stepper so we can try again
                continue;
            }

            // First select the civ list from the current biome
            $biomeList = JSFind($biomeData, function($biome) use ($fullMap, $xpos, $ypos) {
                return $fullMap[$xpos][$ypos]['landType'] === $biome['biome'];
            });

            // Not all biomes will have a civilization list associated to them. If not, we should pick another location
            if($biomeList['civs']) {
                $fullMap[$xpos][$ypos]['civ'] = $biomeList['civs']->cyclePull();
            }else{
                $i--;
                continue;
            }

            // Some civilizations alter the biome they exist in
            if($fullMap[$xpos][$ypos]['civ'] == 'ice horrors') {
                $fullMap[$xpos][$ypos]['landType'] = 'frozen wasteland';
            }
            if($fullMap[$xpos][$ypos]['civ'] == 'ork tribe') {
                $fullMap[$xpos][$ypos]['landType'] = 'lavascape';
            }

            // All civilizations will have a strength value. We will also display abandoned civilizations, they'll be somewhat common
            // This range is currently from 0 to 3. To allow abandoned spaces to show up, we will need to do a bit of math on it
            $fullMap[$xpos][$ypos]['civstrength'] = max(0, randomFloat()*4.5 - 1.5);
        }

        // Now, convert the biome types to an ID, so it matches the indexing of other areas, including the database
        $fullMap = array_map(function($long) {
            return array_map(function($wide) {
                global $biomeData;
                $wide['landType'] = array_search($wide['landType'], array_map(function($biome) {
                    return $biome['biome']; // This generates only a list of names, but filters out the other content we don't need here
                }, $biomeData));
                return $wide;
            }, $long);
        }, $fullMap);

        // Saving this much data is challenging; saving each tile separately can take a very long time, but saving everything in one lump statement will be
        // too much to save in one go. We will use a mix of the two methods
        foreach($fullMap as $long) {
            $adds = implode(',', array_map(function($tile) {
                // convert our object into a string, each with surrounding parenthesis
                global $biomeData;
                global $civData;
                
                return '('.
                    $tile['x'] .','.
                    $tile['y'] .','.
                    $tile['landType'] .','.
                    (isset($tile['civ'])?
                        JSFindIndex($civData, function($civ) use ($tile) {
                            if(strtolower($civ['name']) == strtolower($tile['civ'])) return true;
                            return false;
                        }) .','. $tile['civstrength']
                    :('-1,0')) .')';
            }, $long));
            $result = $db->query("INSERT INTO sw_map (x,y,biome,civilization,civlevel) VALUES ". $adds .";");
            if(!$result) {
                reporterror('server/routes/signup.php->save world map', 'Worldmap save failed. Content='. $adds .', error='. $db->error);
                ajaxreject('internal', 'There was an error when saving the world (map)');
            }
        }
    }


?>