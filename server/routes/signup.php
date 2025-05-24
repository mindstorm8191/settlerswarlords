<?php
    /*  signup.php
        Allows new players to sign up to start playing the game. Exciting!
        For the game Settlers & Warlords
    */

    require_once("../config.php");
    require_once("../libs/common.php");
    require_once('../libs/DanGlobal.php');
    
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

    // We need to pick a location for the player
    // If the game map hasn't been generated yet (or this part of the map hasn't been made yet) this could be a challenge.
    // Go ahead and load a section of the map (building it if needed), and find a suitable spot to place the player

    // Player placement will be based on an ever-expanding spiral, to ensure all new players start with sufficient land before encountering other players
    // All players will be put 200 tiles (not chunks) apart
    // Next player locations will need to be remembered. We have a DanGlobals tool to hold long term data in the database.
    // Start with checking if any content exists at all
    $playerLevel = 0;
    $playerMode = 0;
    $playerCount = 0;
    $content = DanDBList("SELECT * from sw_mapchunk LIMIT 1;", '', [], 'server/routes/signup.php->check for existing content');
    if(sizeof($content)!=0) {
        $playerLevel = getGlobal('newPlayerLevel');
        $playerMode  = getGlobal('newPlayerMode');
        $playerCount = getGlobal('newPlayerCount');
    }
    $pack = newPlayerLocation($playerLevel, $playerMode, $playerCount, 200);
    $location = [$pack[0],4,$pack[1]]; // We are storing the player's location as JSON content, as we don't (normally) need to access it on the server side
    // Note that positional data will be a floating point value, not an int.
    // Also, when we add heightmapping to the world gen, this will need to locate a safe height to place the player... but we're not there yet.
    // We should be sending the user a verification email, but we don't have that option on Localhost

    DanDBList("INSERT INTO sw_player (name, password, email, ajaxcode, emailcode, ipaddress, lastlogin, location) VALUES ".
              "(?,?,?,?,?,?,NOW(),?);", 'sssiiss', [
                  $con['username'], $con['password'], $con['email'], $ajaxcode, $emailcode, $_SERVER['REMOTE_ADDR'], json_encode($location)
              ], 'server/routes/signup.php->add new player');
    $playerid = mysqli_insert_id($db);
    $playername = $con['username'];
    $unlockeditems = [];

    // Also, we will need to add workers around where the player is situated. For now, we will simply place down 4 surrounding the player
    createWorker($playerid, $location[0]-1, $location[1], $location[2]);
    createWorker($playerid, $location[0], $location[1], $location[2]-1);
    createWorker($playerid, $location[0]+1, $location[1], $location[2]);
    createWorker($playerid, $location[0], $location[1], $location[2]+1);
    // Since we are now managing workers by attaching them to the player record, we need to do this another way


    // Next, we need to generate a map tile for this player to be on. Fortunately, we have a function that can load content when players log in, and
    // if no map chunk exists, one can be created on demand.
    // That should be enough to complete our work here. To get the user to log in, we need to use the finishLogin script
    include_once("../finishLogin.php");

    function newPlayerLocation($level, $mode, $count, $scale) {
        // Recursive function to determine where a new player should be placed. This will avoid putting new players in inhospitable locations such
        // as oceans, lavascapes and civilization-occupied areas
        // $level, $mode, $count - variables used to determine placement. These are normally gathered from the database's globals table, but each start
        //    on zero. Level is how far from center the point is, mode determines what face of the square to move down, and count is how far along that
        //    side we have gone down
        // Returns an array holding X & Y coordinates of where the next player should be placed. The updated values for level, mode and count values
        // will be saved to the database in the Globals table

        // Start by determining where on the grid this location will be
        $x = 0;
        $y = 0;
        $limit = 0;
        switch($mode) {
            case 0: // top, from left to right
                $limit = $level*2+1;
                $x = -$level + $count;
                $y = -$level;
            break;
            case 1: // right, from top to bottom
                $limit = $level*2-1;
                $x = $level;
                $y = -$level + $count;
            break;
            case 2: // bottom, from right to left
                $limit = $level*2+1;
                $x = $level - $count;
                $y = $level;
            break;
            case 3: // left, from bottom to top
                $limit = $level*2-1;
                $x = -$level;
                $y = $level - $count;
            break;
        }

        // Scale this position up to the rate of the map
        $x = $x * $scale;
        $y = $y * $scale;

        // Because we don't yet have biomes generating yet, go ahead and accept this location

        // Our next starting location will need to be advanced from here, then saved to the database
        $out = advanceStartPos($level, $mode, $count);
        setGlobal('newPlayerLevel', $out['level']);
        setGlobal('newPlayerMode', $out['mode']);
        setGlobal('newPlayerCount', $out['count']);
        return [$x, $y];
    }

    function advanceStartPos($level, $mode, $count) {
        // Advances the values for a player's starting position. Certain advances will update all 3 values. This will be needed in more than one place
        // $level - how far from the center point that the current position is
        // $mode - which face of the square we are working at
        // $count - how far along the selected face we are at
        // Returns an object with the three variables updated to new values

        // At level 0, the only way forward is to increase the level
        if($level===0) return ['level'=>1, 'mode'=>0, 'count'=>0];

        $limit = $level * 2; // This determines how far to go before switching sides. But it's a little more complex than that
        switch($mode) {
            case 0: case 2: $limit++; break;
            case 1: case 3: $limit--; break;
        }

        $count++;
        if($count>$limit) {
            $count = 0;
            $mode++;
            if($mode>=4) {
                $mode=0;
                $level++;
            }
        }
        return ['level'=>$level, 'mode'=>$mode, 'count'=>$count];
    }

    function createWorker($ownerid, $x, $y, $z) {
        // Creates a new worker, assigning it a location in the world

        global $db;

        // Workers will all need unique IDs... this will be managed by the database now
        //$lastId = getGlobal('lastWorkerId');
        //if(is_null($lastId)) $lastId = 0;
        //setGlobal('lastWorkerId', $lastId+1);

        // Also save this worker to the database. Workers used to be attached to specific map zones. But with chunks we can't really do that, so we're going to
        // use a worker table for that.
        DanDBList("INSERT INTO sw_worker (playerid, spot, carrying, travelPath, job) VALUES (?,?,'[]', '', 'none');", 'is', [$ownerid, json_encode([$x,$y,$z], 1)],
                  'server/routes/signup.php->createWorker()->save');
        return mysqli_insert_id($db);
    }
?>


