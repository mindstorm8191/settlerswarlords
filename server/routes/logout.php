<?php
/*  logout.php
    Allows users currently signed in to log out of the game
    For the game Settlers & Warlords
*/

require_once("../config.php");
require_once("../common.php");

// Start with collecting message content
require_once("../getInput.php");

// Verify message content
$con = verifyInput($msg, [
    ['name'=>'userid', 'required'=>true, 'format'=>'int'],
    ['name'=>'ajaxcode', 'required'=>true, 'format'=>'int']
], 'server/routes/loginout.php');

// Now gather user information to verify their credentials
$res = DanDBList("SELECT * FROM sw_player WHERE id=? AND ajaxcode=?;", 'ii', [$con['userid'], $con['ajaxcode']], 'routes/logout.php->get player data');
if(sizeof($res)===0) {
    // No player data was collected
    ajaxreject('invaliduser', 'Sorry, your login token is expired. Please log in again');
}
$player = $res[0];

// Now it's just a matter of clearing out access credentials
DanDBList("UPDATE sw_player SET ipaddress='', ajaxcode=0, lastlogin=NOW() WHERE id=?", 'i', [$player['id']], 'routes/logout.php->complete logout');
// Send a success response
die(json_encode(['result'=>'success']));


