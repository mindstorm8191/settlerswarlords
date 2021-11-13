<?php
    /*  signup.php
        Allows new users to sign up to start playing the game. Exciting!
        For the game Settlers & Warlords
    */

    require_once("../config.php");
    require_once("../common.php");
    require_once("../mapContent.php");
    require_once("../globals.php");
    require_once("../DanGlobal.php"); // A simple library w/ a DB table to manage global game variables

    // Start with collecting the actual message
    require_once("../getInput.php");

    // Verify the input that was provided
    $con = verifyInput($msg, [
        ["name"=>"username", "required"=>true, "format"=>"stringnotempty"],
        ["name"=>"password", "required"=>true, "format"=>"stringnotempty"],
        ["name"=>"pass2", "required"=>true, "format"=>"stringnotempty"],
        ["name"=>"email", "required"=>true, "format"=>"email"]
    ], 'server/route_account.php->route_signup()->verify input');
    // Also check that the two passwords match
    if($con['password'] !== $con['pass2']) ajaxreject('badinput', 'Your passwords did not match');

    // Set up some randomized variables to use for this user
    srand(time());
    $ajaxcode = rand(0, pow(2, 31));
    $emailcode = rand(0, pow(2, 31)); // We should also be sending the user a verification email, but we don't have that option on LocalHost

    // Start by ensuring a map has been generated here. If not, we need to make one now
    $playerLevel = 0;
    $playerMode = 0;
    $playerCount = 0;
    if(sizeof(DanDBList("SELECT * FROM sw_map LIMIT 1;", '', [], 'ajax.php->action signup->check for existing map' ))===0) {
        worldmap_generate();
    }else{
        $playerLevel = getGlobal('newplayerlevel');
        $playerMode  = getGlobal('newplayermode');
        $playerCount = getGlobal('newplayercount');
    }

    // Next, determine where the player will be placed. Even for the first player, they may end up in a place
    // that is not ideal to build in. This will pick a location that is most suitable for a new player
    [$playerx, $playery] = newPlayerLocation($playerLevel, $playerMode, $playerCount);

    // With the player's coordinates known, we can now generate the player record
    DanDBList("INSERT INTO sw_player (name, password, email, ajaxcode, ipaddress, lastlogin, currentx, currenty) VALUES (?,?,?,?,?,NOW(),?,?);",
              'sssisii', [$con['username'], $con['password'], $con['email'], $ajaxcode, $_SERVER['REMOTE_ADDR'], $playerx, $playery],
              'ajax.php->action signup->add new user');
    $uid = mysqli_insert_id($db);

    // Now is a good time to generate the workers for this land plot
    $workers = createWorkers(4);

    // We also need to update the map location to show that the user owns this land. This is where we put active worker data into the DB
    DanDBList("UPDATE sw_map SET owner=?, population=4, workers=? WHERE x=? and y=?;", 'isii',
              [ $uid, json_encode($workers), $playerx, $playery], 'ajax.php->action signup->update map with new user');

    // Update the player's known map now to show that they're aware of their own starting land
    //worldMap_updateKnown($uid, $playerx, $playery, "NOW()", $uid, 1, 4);

    // Generate the localMap content of this worldMap tile
    ensureMiniMapXY($playerx, $playery, true);

    // With that finished, it is time to start working on the response to this request.
    $worldTile = DanDBList("SELECT * FROM sw_map WHERE x=? AND y=?;", 'ii', [$playerx,$playery],
                           'server/routes/signup.php->get world map data for response')[0];
    $localTiles = DanDBList("SELECT x,y,landtype,buildid,newlandtype,items FROM sw_minimap WHERE mapid=? ORDER BY y,x;", 'i',
                            [$worldTile['id']], 'server/routes/signup.php->get local map tiles');
    die(json_encode([
        'result'  =>'success',
        'userid'  =>$uid,
        'userType'=>'player',
        'access'  =>$ajaxcode,
        'localContent'=>[
            'biome'     =>$biomeData[$worldTile['biome']]['biome'],
            'ugresource'=>$oreTypes[$worldTile['ugresource']],
            'ugamount'  =>$worldTile['ugamount'],
            'population'=>$worldTile['population']
        ],
        'localTiles'=>$localTiles//,
        //'blocks'        => json_decode($worldTile['blocks'], true),
        //'workers'       => json_decode($worldTile['workers'], true),
        //'unlockedItems' => json_decode($worldTile['unlockeditems'], true),
        //'allItems'      => json_decode($worldTile['allItems'], true),
        //'foodCounter'   => $worldTile['foodCounter']
        // Well... we have a lot of pieces left to put into this
    ]));

    
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
        //reporterror('server/mapbuilder.php->worldmap_generate()->before landType update', 'Center land type='. $fullMap[0][0]['landType']);
        $fullMap = array_map(function($long) {
            return array_map(function($wide) {
                global $worldBiomes;
                $wide['landType'] = array_search($wide['landType'], $worldBiomes);
                return $wide;
            }, $long);
        }, $fullMap);
        //reporterror('server/mapbuilder.php->worldmap_generate()->after landType update', 'Center  land type='. $fullMap[0][0]['landType']);

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
                $fullMap[$xspot][$yspot]['civstrength'] = max(0, randomFloat()*4.5-1.5);
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
                $ugamt  = randomFloat()*1.5+0.5;
                $comm->bind_param('iiiidid', $wide['x'], $wide['y'], $wide['landType'], $ugtype, $ugamt, $civ, $civLevel);
                if(!$comm->execute()) {
                    reporterror('server/mapbuilder.php->worldmap_generate()', 'Query execution failed. Mysql says '. mysqli_error($db));
                    return null;
                }        
            }
        }
    }
    
?>