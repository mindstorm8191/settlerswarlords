<?php
/*  login.php
    Allows existing users to log in and continue their game
    For the game Settlers & Warlords
*/

    require_once("../config.php");
    require_once("../libs/common.php");

    // Start with converting the message from the client
    require_once("../getInput.php"); // all content is now in $msg

    // Verify the input
    $con = verifyInput($msg, [
        ['name'=>'username', 'required'=>true, 'format'=>'stringnotempty'],
        ['name'=>'password', 'required'=>true, 'format'=>'stringnotempty']
    ], 'server/routes/login.php->verify input');

    $res = DanDBList("SELECT * FROM sw_player WHERE name=?;", 's', [$con['username']], 'server/routes/login.php->get player data');
    if(sizeof($res)==0) {
        // No player of that username was found
        ajaxreject('invaliduser', "Sorry, that user name doesn't exist. Please try again");
    }
    $player = $res[0];
    if($player['password']!=$con['password']) {
        ajaxreject('invaliduser', "Sorry, that password doesn't match. Please try again");
    }

    // Generate a new ajax code. We will need to save it to the database too
    srand(time());
    $ajaxcode = rand(0, pow(2,31));
    DanDBList("UPDATE sw_player SET ipaddress=?, ajaxcode=?, lastlogin=NOW() WHERE id=?;", 'sii',
            [$_SERVER['REMOTE_ADDR'], $ajaxcode, $player['id']], 'server/routes/login.php->update player at login');

    // Now set variable for using the response script
    $playerid = $player['id'];
    $playerx = $player['currentx'];
    $playery = $player['currenty'];
    require_once("../finishLogin.php");

?>