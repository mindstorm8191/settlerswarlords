<?php
/*  login.php
    Allows existing users to log in and continue their game
    For the game Settlers & Warlords
*/

    require_once("../config.php");
    require_once("../libs/common.php");
    
    // Start with collecting the message
    require_once("../getInput.php");

    // Verify our input
    $con = verifyInput($msg, [
        ['name'=>'username', 'required'=>true, 'format'=>'stringnotempty'],
        ['name'=>'password', 'required'=>true, 'format'=>'stringnotempty']
    ], 'server/routes/login.php->verify input');

    // We do it this way so we can, on the server side, check the password. It also allows us to respond differently for username or password errors
    $res = DanDBList("SELECT * FROM sw_player WHERE name=?;", 's', [$con['username']], 'server/routes/login.php->get player data');
    if(sizeof($res)==0) {
        // No player of that name was found
        ajaxreject('invaliduser', "Sorry, that user name doesn't exist. Please try again");
    }
    // Now get the player, and validate the password
    $player = $res[0];
    if($player['password']!=$con['password']) {
        ajaxreject('invaliduser', "Sorry, that password doesn't match. Please try again");
    }

    // Generate a new ajax code. We will need to save it to the database too
    srand(time());
    $ajaxcode = rand(0, pow(2,31));
    DanDBList("UPDATE sw_player SET ipaddress=?, ajaxcode=?, lastlogin=NOW() WHERE id=?;", 'ssi',
              [$_SERVER['REMOTE_ADDR'], $ajaxcode, $player['id']], 'server/routes/login.php->update player at login');

    // We should be ready to finish the login process, but first, set the needed variables for the script
    $playerid = $player['id'];
    $playername = $player['name'];
    $unlockeditems = json_decode($player['unlockedItems']);
    $location = json_decode($player['location']);
    
    require_once("../finishLogin.php");
?>