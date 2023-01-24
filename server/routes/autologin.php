<?php
/*  autologin.php
    Allows the client to automatically log users back into the game. Players must have logged in within the last 24 hours, or this will
    (politely) reject the auto-login request
    For the game Settlers & Warlords
*/

require_once("../config.php");
require_once("../common.php");

// Start with collecting the actual message
require_once("../getInput.php");    // This will now have the full content in $msg

// Verify the input that was provided
$con = verifyInput($msg, [
    ['name'=>'userid', 'required'=>true, 'format'=>'int'],
    ['name'=>'ajaxcode', 'required'=>true, 'format'=>'int']
], 'server/routes/autologin.php');

// We need the player data anyway, so get the player info and verify the input is valid
// Also, check that the user has logged in within the last 24 hours
$res = DanDBList("SELECT *, TIME_TO_SEC(TIMEDIFF(NOW(), lastlogin)) AS diff FROM sw_player WHERE id=? AND ajaxcode=? AND ipaddress=?;", 'iis',
                 [$con['userid'], $con['ajaxcode'], $_SERVER['REMOTE_ADDR']], 'server/routes/autologin.php->verify user input');
if(sizeof($res)===0) ajaxreject('invaliduser', 'Sorry, that user does not exist');
$player = $res[0];
// 1 day = 86,400 seconds
if($player['diff']>86400) ajaxreject('expired', 'Session expired. Please log in again');

// Now we can send a response to the client. We have a single script to handle this for us, but needs a few parameters set, first
$playerid = $player['id'];
$playerx = $player['currentx'];
$playery = $player['currenty'];
$ajaxcode = $con['ajaxcode'];
require_once("../finishLogin.php");

?>


