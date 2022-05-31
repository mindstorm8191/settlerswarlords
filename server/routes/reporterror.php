<?php
/*  reporterror.php
    Allows the client to report errors that it generated, so that problems can be logged and fixed
    For the game Settlers & Warlords
*/

require_once("../config.php");
require_once("../common.php");

// Start with collecting the actual message
require_once("../getInput.php");    // This will now have the full content in $msg

// Verify the input that was provided
$con = verifyInput($msg, [
    ['name'=>'location', 'required'=>true, 'format'=>'string'],
    ['name'=>'content',  'required'=>true, 'format'=>'string']
], 'server/routes/reporterror.php->validate input');

// Now, insert this error into the database
DanDBList("INSERT INTO sw_error (happens,codelocation,content) VALUES (NOW(),?,?);", 'ss', [$con['location'],$con['content']],
          'server/routes/reporterror.php->add error to db');

// ...and, that should do it
die(json_encode(['result'=>'success']));
?>