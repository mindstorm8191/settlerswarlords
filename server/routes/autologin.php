<?php
    /*  autologin.php
        Allows the client to automatically log user back into the game when the page is reloaded. Players must have logged
        in within the last 24 hours, or the game will (politely) reject the auto-login request
        For the game Settlers & Warlords
    */

    require_once('../config.php');
    require_once('../libs/common.php');

    // Collect the actual message
    require_once('../getInput.php');

    $con = verifyInput($msg, [
        ['name'=>'userid', 'required'=>true, 'format'=>'int'],
        ['name'=>'ajaxcode', 'required'=>true, 'format'=>'int']
    ], 'server/routes/autologin.php');

    // We need the player data anyway, so get all the content from the database
    $res = DanDBList("SELECT *, TIME_TO_SEC(TIMEDIFF(NOW(), lastlogin)) AS diff FROM sw_player WHERE id=? AND ajaxcode=? AND ipaddress=?;",
                     'iis', [$con['userid'], $con['ajaxcode'], $_SERVER['REMOTE_ADDR']], 'server/routes/autologin.php->get user data');
    if(sizeof($res)===0) ajaxreject('invaliduser', 'Something went wrong. Please log in');
    $player = $res[0];
    // Check that the user has logged in within the last 24 hours
    if($player['diff']>86400) ajaxreject('expired', 'Session expired. Please log in again');

    // Now, set up to use the login script again
    $playerid = $player['id'];
    $ajaxcode = $player['ajaxcode'];
    $playername = $player['name'];
    $location = json_decode($player['location'], 1);
    $unlockeditems = json_decode($player['unlockedItems'], 1);
    require_once("../finishLogin.php");
?>
    

    