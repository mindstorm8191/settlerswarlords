<?php
/*  logout.php
    Allows users currently signed in to log out of the game
    For the game Settlers & Warlords
*/

require_once("../config.php");
require_once("../libs/common.php");

// Get the message content
require_once("../getInput.php");

// Verify the message
$con = verifyInput($msg, [
    ['name'=>'userid', 'required'=>true, 'format'=>'posint'],
    ['name'=>'ajaxcode', 'required'=>true, 'format'=>'int']
], 'server/routes/logout.php');

// Validate the user's credentials
$res = DanDBList("SELECT * FROM sw_player WHERE id=? AND ajaxcode=?;", 'ii', [$con['userid'], $con['ajaxcode']], 'server/routes/logout.php->validate user');
if(sizeof($res)==0) {
    ajaxreject('invaliduser', 'Sorry, your login token is expired. Please log in again');
}
$player = $res[0];

// Now it's just a matter of clearing the credentials
DanDBList("UPDATE sw_player SET ipaddress='', ajaxcode=0, lastlogin=NOW() where id=?;", 'i', [$player['id']], 'server/routes/logout.php->finish logout');

// Send a success response
die(json_encode(['result'=>'success']));
?>


