<?php
    /*  signup.php
        Allows new players to sign up to start playing the game. Exciting!
        For the game Settlers & Warlords
    */

    require_once("../config.php");
    require_once("../libs/common.php");
    
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
    $location = [4,4,6]; // We are storing the player's location as JSON content, as we don't (normally) need to access it on the server side
    // Note that positional data will be a floating point value, not an int.
    // We should be sending the user a verification email, but we don't have that option on Localhost

    DanDBList("INSERT INTO sw_player (name, password, email, ajaxcode, emailcode, ipaddress, lastlogin, location) VALUES ".
              "(?,?,?,?,?,?,NOW(),?);", 'sssiiss', [
                  $con['username'], $con['password'], $con['email'], $ajaxcode, $emailcode, $_SERVER['REMOTE_ADDR'], json_encode($location)
              ], 'server/routes/signup.php->add new player');
    $playerid = mysqli_insert_id($db);
    $playername = $con['username'];

    // Next, we need to generate a map tile for this player to be on. Fortunately, we have a function that can load content when players log in, and
    // if no map chunk exists, one can be created on demand.
    // That should be enough to complete our work here. To get the user to log in, we need to use the finishLogin script
    include_once("../finishLogin.php");
?>


