<?php
    /*  logout.php
        Allows the user to log out of their account
        For the game Settlers & Warlords
    */

    require_once("../config.php");
    require_once("../libs/common.php");
    require_once("../events.php");

    // Collect the message
    require_once("../getInput.php");

    processEvents();

    // Verify the input... even though there's not much
    $con = verifyInput($msg, [
        ['name'=>'userid', 'required'=>true, 'format'=>'posint'],
        ['name'=>'ajaxcode', 'required'=>true, 'format'=>'int']
    ], 'server/routes/logout.php->verify input');

    // Verify to user
    $res = DanDBList("SELECT * FROM sw_player WHERE id=? AND ajaxcode=?;", 'ii', [$con['userid'], $con['ajaxcode']],
                     'server/routes/logout.php->get player record');
    if(sizeof($res)===0) {
        // No player was found
        ajaxreject('invaliduser', 'Sorry, your login token is expired. Please log in again');
    }

    // All we really need to do is clear the ajax code for this user
    DanDBList("UPDATE sw_player SET ajaxcode=0 WHERE id=?", 'i', [$con['userid']], 'server/routes/logout.php->update ajaxcode');

    die(json_encode([
        'result'=>'success',
    ]));
?>


