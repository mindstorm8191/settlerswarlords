<?php
    /*  autologin.php
        Allows the client to automatically log users back into the game when the page is reloaded. Players must have logged in within the
        last 24 hours, or the game will (politely) reject the auto-login request
        For the game Settlers & Warlords
    */

    require_once("../config.php");
    require_once("../libs/common.php");

    // Collect the actual message
    require_once("../getInput.php");

    $con = verifyInput($msg, [
        ['name'=>'userid', 'required'=>true, 'format'=>'int'],
        ['name'=>'ajaxcode', 'required'=>true, 'format'=>'int']
    ], 'server/routes/autologin.php');

    // We need the player data anyway, so get all the player data from the database
    $res = DanDBList("SELECT *, TIME_TO_SEC(TIMEDIFF(NOW(), lastlogin)) AS diff FROM sw_player WHERE id=? AND ajaxcode=? AND ipaddress=?;",
                     'iis', [$con['userid'], $con['ajaxcode'], $_SERVER['REMOTE_ADDR']], 'server/routes/autologin.php->get user data');
    if(sizeof($res)===0) ajaxreject('invaliduser', 'Sorry, that user does not exist');
    $player = $res[0];
    // Check that the user has logged in within the last 24 hours. 1 day = 86,400 seconds
    if($player['diff']>86400) ajaxreject('expored', 'Session expired. Please log in again');

    // Now use the login script to send a response to the client
    $playerid = $player['id'];
    $playerx = $player['currentx'];
    $playery = $player['currenty'];
    $ajaxcode = $con['ajaxcode'];
    require_once("../finishLogin.php");
?>


