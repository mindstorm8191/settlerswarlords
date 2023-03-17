<?php
    /*  save.php
        Saves the player's localmap content to the database for later retrieval
        For the game Settlers & Warlords
    */

    require_once("../config.php");
    require_once("../libs/common.php");
    require_once("../libs/jsarray.php");

    // Get the input content
    require_once("../getInput.php");

    //reporterror('server/routes/save.php->before verify', 'Content received: '. $content);

    // Verify the base fields
    $con = verifyInput($msg, [
        ['name'=>'userid',        'required'=>true, 'format'=>'posint'],
        ['name'=>'ajaxcode',      'required'=>true, 'format'=>'int'],
        ['name'=>'workers',       'required'=>true, 'format'=>'array'],
        ['name'=>'structures',    'required'=>true, 'format'=>'array'],
        ['name'=>'tasks',         'required'=>true, 'format'=>'array'],
        ['name'=>'unlockeditems', 'required'=>true, 'format'=>'arrayOfStrings']
    ], 'server/routes/save.php->verify input level 1');

    // An array doesn't really verify anything, so we need to verify the worker data details now
    // verifyInput will stop the script if there are any problems
    JSEvery($con['workers'], function($wk) {
        verifyInput($wk, [
            ['name'=>'name',        'required'=>true, 'format'=>'stringnotempty'],
            ['name'=>'id',          'required'=>true, 'format'=>'posint'],
            ['name'=>'x',           'required'=>true, 'format'=>'int'],
            ['name'=>'y',           'required'=>true, 'format'=>'int'],
            ['name'=>'status',      'required'=>true, 'format'=>'stringnotempty'],
            ['name'=>'moveCounter', 'required'=>true, 'format'=>'int'],
            ['name'=>'tasks',       'required'=>true, 'format'=>'arrayOfInts'],
            ['name'=>'carrying',    'required'=>true, 'format'=>'array']
        ], 'server/routes/save.php->verify workers base');
        //JSEvery($wk['carrying'], function($items)) erm, we're not ready to manage items yet
    });

    // That's enough for now, send a response
    die(json_encode(['result'=>'success']));
?>