<?php
/*  login.php
    Allows users to log in to the game, using username & password
    For the game Settlers & Warlords
*/

require_once("../config.php");
require_once("../common.php");

// Start with collecting the actual message
require_once("../getInput.php");    // This will now have the full content in $msg

// Verify the message contents
$con = verifyInput($msg, [
    ['name'=>'username', 'required'=>true, 'format'=>'stringnotempty'],
    ['name'=>'password', 'required'=>true, 'format'=>'stringnotempty']
], 'ajax.php->action login->verify user input');

// Now, gather the user information from the database, verifying their login credentials are correct
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
$playerid = $player['id'];
$playerx = $player['currentx'];
$playery = $player['currenty'];

// Generate a new ajax code. We will need to save it to the database, along with sending it to the user
srand(time());
$ajaxcode = rand(0, pow(2, 31));
DanDBList("UPDATE sw_player SET ipaddress=?, ajaxcode=?, lastlogin=NOW() WHERE id=?;", 'sii',
          [$_SERVER['REMOTE_ADDR'], $ajaxcode, $player['id']], 'ajax.php->action login->update player at login');

// We are ready to send a response to the client
require_once("../finishLogin.php");

?>