<?php
    /*  route_account.php
    Manages all client messages directly related to managing a user's accounts
    for the game Settlers & Warlords
    */

    function route_signup($msg) {
        // Allows the user to sign up to the site. It will set up a space in the map for the user to begin
        // msg - full data package, as received from the client. This data has not been 'washed'.

        // A few globals we are going to need
        global $db;
        global $WorldBiomes;
        global $OreTypes;
        global $biomeData;

        // Start by verifying the ajax input
        $con = verifyInput($msg, [
            ["name"=>"username", "required"=>true, "format"=>"stringnotempty"],
            ["name"=>"password", "required"=>true, "format"=>"stringnotempty"],
            ["name"=>"pass2", "required"=>true, "format"=>"stringnotempty"],
            ["name"=>"email", "required"=>true, "format"=>"email"]
        ], 'server/route_account.php->route_signup()->verify input');
        // Also check that the two passwords match
        if($con['password'] !== $con['pass2']) ajaxreject('badinput', 'Your passwords did not match');

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

        // We also need to update the map location to show that the user owns this land
        DanDBList("UPDATE sw_map SET owner=?, population=4, workers=? WHERE x=? and y=?;", 'isii',
                  [ $uid, json_encode($workers), $playerx, $playery], 'ajax.php->action signup->update map with new user');
        
        // Update the player's known map now to show that they're aware of their own starting land
        worldMap_updateKnown($uid, $playerx, $playery, "NOW()", $uid, 1, 4);

        // Generate the localMap content of this worldMap tile
        ensureMiniMapXY($playerx, $playery, true);

        finishLogin($uid, $ajaxcode, $playerx, $playery);

        // With that finished, new players don't have any other content to load. We can now send a response to the user, which
        // primarily contains all the localMap content.
        
        /*
        // Before wrapping up, we need to update the production of the bread resource we have. We will have to grab the map data first.
        $worldTile = updateProcesses($worldTile, "NOW()");
        // Now save it before proceeding
        DanDBList("UPDATE sw_map SET items=? WHERE x=? AND y=?;", 'sii',
                  [$worldTile['items'], $playerx, $playery], 'server/route_account.php->route_signup()->save world map data');

        // Create a population-check event. We can use our createEvent function b/c it's easier. Triggers every 30 minutes
        createEvent(0, $worldTile['id'], 'CheckPopulation', '', "NOW()", 1800, false);
        
        // Now, we only have to send a response to the client. Since we have three routes to do that, we made a function to handle it
        finishLogin($uid, $ajaxcode, $playerx, $playery);
        */
    }

    function finishLogin($userid, $accesscode, $playerx, $playery) {
        // Handles sending the full login package to the user. This is the same response from all three sources:
        // signup, login and autologin.
        // $userid - ID of the user to send data for
        // $accesscode - AJAX code to provide to the client
        // $playerx, $playery - current player coordinates (to keep from querying this data again)
        // No return value.

        global $WorldBiomes;
        global $OreTypes;
        global $biomeData;

        $worldTile = DanDBList("SELECT * FROM sw_map WHERE x=? AND y=?;", 'ii', [$playerx, $playery],
                               'server/route_account.php->route_signup()->get world map data')[0];
        $localTiles = DanDBList("SELECT x,y,landtype,buildid,newlandtype FROM sw_minimap WHERE mapid=? ORDER BY y,x;", 'i',
                                [$worldTile['id']], 'server/route_account.php->route_signup()->get local map tiles');
        die(json_encode([
            'result'=>'success',
            'userid'=>$userid,
            'userType'=>'player',
            'access'=>$accesscode,
            'localContent'=>[
                'biome'=>$biomeData[$worldTile['biome']]['biome'],
                'ugresource'=>$OreTypes[$worldTile['ugresource']],
                'ugamount'=>$worldTile['ugamount'],
                'population'=>$worldTile['population']
            ],
            'localTiles'=>$localTiles,
            'blocks'       =>json_decode($worldTile['blocks'], true),
            'workers'      =>json_decode($worldTile['workers'], true),
            'unlockedItems'=>json_decode($worldTile['unlockeditems'], true),
            'allItems'     =>json_decode($worldTile['allItems'], true),
            'foodCounter'  =>$worldTile['foodCounter']
        ]));
/*
        $worldMapData = DanDBList("SELECT * FROM sw_map WHERE x=? AND y=?;", 'ii', [$playerx, $playery],
                                  'ajax.php->action login->get world map data')[0];
        // Now is a good time to update the stats of this world
        $worldMapData = processEvents($worldMapData);

        // Next, advance processes to current time
        $worldMapData = advanceProcesses($worldMapData, "NOW()");
        // Update the world with the new data
        DanDBList("UPDATE sw_map SET items=?, resourceTime=NOW() WHERE id=?;", 'si',
                  [$worldMapData['items'], $worldMapData['id']],
                  'server/route_localMap.php->route_AddProcess()->save world map changes');
        reporterror('server/route_account.php->finishLogin()->after advanceProcesses()', 'Storing items as '. $worldMapData['items']);

        // Because event and process changes can potentially update world stats (such as population), we need to collect
        // data about this worldmap tile again.
        //$worldMapData = DanDBList("SELECT * FROM sw_map WHERE id=?;", 'i', [$worldMapData['id']],
        //                          'server/route_Account.php->route_login()->refresh worldmap data')[0];
        $mapTileList = DanDBList("SELECT mapid,x,y,landtype,buildid FROM sw_minimap WHERE mapid=?;", 'i', [$worldMapData['id']],
                'ajax.php->action login->get local map data');
        // We also want to collect all events related to this tile. Previously, I queried events specific to each building,
        // but that needed an extra query for each tile scanned. It would be better to provide all events in one lump
        $eventList = DanDBList("SELECT * FROM sw_event WHERE mapid=?;", 'i', [$worldMapData['id']],
                               'server/route_account.php->finishLogin()->get events list');
        die(json_encode([
            "result"=>"success",
            'userid'=>$userid,
            'userType'=>'player',
            'access'=>$accesscode,
            'mapcontent'=>[
                "biome"=>$WorldBiomes[$worldMapData['biome']],
                "ugresource"=>$OreTypes[$worldMapData['ugresource']],
                "ugamount"=>$worldMapData['ugamount'],
                "owner"=>$worldMapData['owner'],
                "id"=>$worldMapData['id'],
                "population"=>$worldMapData['population'],
                "minimap"=>array_map(function($ele) use ($worldMapData) {
                    return localMap_getSquareInfo($ele, $worldMapData);
                }, $mapTileList),
                "buildoptions"=>localMap_loadBuildOptions($worldMapData),
                'items'=>json_decode($worldMapData['items'], true),
                'processes'=>json_decode($worldMapData['processes'], true),
                'events'=>$eventList
            ],
        ]));*/
    }

    function route_login($msg) {
        // Allows a user to log into their existing account

        global $WorldBiomes;
        global $OreTypes;

        $con = verifyInput($msg, [
            ['name'=>'username', 'required'=>true, 'format'=>'stringnotempty'],
            ['name'=>'password', 'required'=>true, 'format'=>'stringnotempty']
        ], 'ajax.php->action login->verify user input');
        
        $res = DanDBList("SELECT * FROM sw_player WHERE name=?;", 's', [$con['username']], 'ajax.php->case login->get player data');
        if(sizeof($res)===0) {
            // There was no player data found
            ajaxreject('invaliduser', 'Sorry, that user name doesn\'t exist. Please try again');
        }
        $player = $res[0];
        if($player['password']!=$con['password']) {
            // The password provided doesn't match
            ajaxreject('invaliduser', 'Sorry, that password doesn\'t match. Please try again');
        }

        // Before continuing, we need to generate a new ajax code - and not forget to save it to the user's record
        srand(time());
        $accesscode = rand(0, pow(2, 31));
        DanDBList("UPDATE sw_player SET ipaddress=?, ajaxcode=?, lastlogin=NOW() WHERE id=?;", 'sii',
                    [$_SERVER['REMOTE_ADDR'], $accesscode, $player['id']], 'ajax.php->action login->update player at login');
        
        // Now, determine if this user is an admin. If so, they won't be provided with their local map data - they
        // won't be a part of the game at all.
        if($player['userType']===1) admin_onLogin($player, $accesscode);

        finishLogin($player['id'], $accesscode, $player['currentx'], $player['currenty']);
    }

    function route_autoLogin($msg) {
        // Handles allowing the client to automatically log the user in
        // msg - full data array as received from the user. This data has not been sanitized

        global $WorldBiomes;
        global $OreTypes;

        $con = verifyInput($msg, [
            ['name'=>'userid', 'required'=>true, 'format'=>'int'],
            ['name'=>'access', 'required'=>true, 'format'=>'int']
        ], 'server/route_account.php->route_autologin()->verify input');

        // We need the player data anyway, so go ahead and verify the input is a valid player
        // We also want to check that the user's last login was less than 24 hours ago. We will politely reject
        // the auto-login if it's been too long
        $res = DanDBList("SELECT *, TIME_TO_SEC(TIMEDIFF(NOW(), lastlogin)) AS diff FROM sw_player WHERE id=? AND ajaxcode=? ".
                         "AND ipaddress=?;", 'iis', [$con['userid'], $con['access'], $_SERVER['REMOTE_ADDR']],
                         'server/route_account.php->route_autologin()->get/verify user input');
        if(sizeof($res)===0) ajaxreject('invaliduser', 'Sorry, that user does not exist.');
        $player=$res[0];
        // 1 day = 86,400 seconds
        if($player['diff']>86400) ajaxreject('expired', 'Session expired. Please log in again!');

        // Handle any admin users
        if($player['userType']===1) admin_onLogin($player, $con['access']);

        finishLogin($player['id'], $con['access'], $player['currentx'], $player['currenty']);
    }

    function route_logout($msg) {
        // Allows the current user to log out

        global $userid;

        $con = verifyInput($msg, [
            ['name'=>'userid', 'required'=>true, 'format'=>'int'],
            ['name'=>'access', 'required'=>true, 'format'=>'int']
        ], 'server/route_account.php->route_logout()->verify input');
        verifyUser($con);

        // To ensure we have logged out the user, we need to change the ajax code. A value of zero won't work
        srand(time());
        $accesscode = rand(0, pow(2, 31));
        DanDBList("UPDATE sw_player SET ajaxcode=? WHERE id=?;", 'ii', [$accesscode, $userid],
                  'server/route_Account.php->route_logout()->update player ajax code');
        
        // Now, just send a success response to the user
        die(json_encode(['result'=>'success']));
    }


    function signup_ensureUniqueUser($username, $email) {
        // Verifies that a given username & email address has not already been used
        // This will exit the script if there is an issue
        
        $existing = DanDBList("SELECT * FROM sw_player WHERE name=? OR email=?", "ss", [$username,$email], 'ajax.php->signup_validateNewUser');
        // This should return an empty set if the username is new
        if(sizeof($existing)!=0) {
            // We have at least a hit on something. Determine if this is a match on the username or the email
            if($existing[0]['name']===$username) {
                ajaxreject('claimedname', 'Sorry, this username has already been registered. Please try another');
            }
            ajaxreject('claimedemail', 'Sorry, this email address has already been registered');
        }
    }

    function verifyUser($message) {
        // Verifies that a user's credentials are valid.  Note that this portion is not handled through verifyInput.
        // $message - full content received from the ajax call. This should be filtered to ensure 

        global $userid;
        
        $res = DanDBList("SELECT id, ajaxcode, ipaddress, TIME_TO_SEC(TIMEDIFF(NOW(), lastlogin)) AS elapsed FROM sw_player WHERE id=?;",
                         'i', [intval(danescape($message['userid']))], 'ajax.php->verifyuser()->get player info');
        if(sizeof($res)===0) ajaxreject('useraccess', 'Your login credentials are not valid. Please log in');
        $user = $res[0];
        //reporterror('Debug in server/common.php->verifyUser(): user record found successfully');
        if($user['elapsed'] > 60*60*24) ajaxreject('useraccess', 'Your session has expired. Please log in again');
        if($user['ajaxcode']!=$message['access']) ajaxreject('useraccess', 'Your login credentials are not valid. Please log in again');
        if($user['ipaddress']!=$_SERVER['REMOTE_ADDR']) ajaxreject('useraccess', 'Your login credentials are not valid. Please log in again');
        $userid = $user['id'];
    }
?>