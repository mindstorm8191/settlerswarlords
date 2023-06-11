<?php
    /*  save.php
        Saves the player's localmap content to the database for later retrieval
        For the game Settlers & Warlords
    */

    require_once("../config.php");
    require_once("../libs/common.php");
    require_once("../libs/jsarray.php");
    require_once('../events.php');

    // Get the input content
    require_once("../getInput.php");

    // Go ahead and process events
    processEvents();

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
            ['name'=>'moveCounter', 'required'=>true, 'format'=>'float'],
            ['name'=>'tasks',       'required'=>true, 'format'=>'arrayOfInts'],
            ['name'=>'carrying',    'required'=>true, 'format'=>'array'],
            ['name'=>'walkPath',    'required'=>true, 'format'=>'string']
        ], 'server/routes/save.php->verify workers base');
        //JSEvery($wk['carrying'], function($items)) erm, we're not ready to manage items yet
    });

    JSEvery($con['structures'], function($st) {
        // Each building type will have a different set of unique variables to check for

        $baseObject = [
            ['name'=>'id',          'required'=>true, 'format'=>'posint'],
            ['name'=>'name',        'required'=>true, 'format'=>'stringnotempty'],
            ['name'=>'x',           'required'=>true, 'format'=>'int'],
            ['name'=>'y',           'required'=>true, 'format'=>'int'],
            ['name'=>'activeTasks', 'required'=>true, 'format'=>'arrayOfInts']
        ];

        switch($st['name']) {
            case 'Lean-To':
                verifyInput($st, array_merge($baseObject, [
                    ['name'=>'mode',        'required'=>true, 'format'=>'stringnotempty'],
                    ['name'=>'progress',    'required'=>true, 'format'=>'int']
                ]), 'server/routes/save.php->verify structures->LeanTo');
            break;

            case 'Dirt Source':
                verifyInput($st, array_merge($baseObject, [
                    ['name'=>'areaCleared', 'required'=>true, 'format'=>'int']
                ]), 'server/routes/save.php->verify structures->dirt source');
            break;

            case 'Rock Knapper':
            case 'Loggers Post':
            case 'Rope Maker':
            case 'Water Source':
                // There are multiple buildings that have only the basic properties
                verifyInput($st, $baseObject, 'server/routes/save.php->verify structures->all basic structures');
            break;

            default: // Erm, there shouldn't be any structures that aren't included in the group above. So this is an error
                reporterror('server/routes/save.php->verify structures', 'Structure type of '. danescape($st['name']) .' not handled. Save aborted');
                ajaxreject('badinput', 'Structure type of '. $st['name'] .' is not handled. Save aborted');
        }
    });

    JSEvery($con['tasks'], function($task) {
        verifyInput($task, [
            ['name'=>'id',       'required'=>true, 'format'=>'posint'],
            ['name'=>'building',    'required'=>true, 'format'=>'int'],
            ['name'=>'name',        'required'=>true, 'format'=>'stringnotempty'],
            ['name'=>'status',      'required'=>true, 'format'=>'stringnotempty'],
            ['name'=>'taskType',    'required'=>true, 'format'=>'stringnotempty'],
            ['name'=>'worker',      'required'=>true, 'format'=>'int'],
            ['name'=>'targetx',       'required'=>true, 'format'=>'int'],
            ['name'=>'targety',       'required'=>true, 'format'=>'int'],
            ['name'=>'targetItem',    'required'=>true, 'format'=>'string'],
            ['name'=>'recipeChoices', 'required'=>true, 'format'=>'arrayOfInts'],
            ['name'=>'quantity',    'required'=>true, 'format'=>'int'],
            ['name'=>'itemsTagged', 'required'=>true, 'format'=>'array'],
            ['name'=>'progress',    'required'=>true, 'format'=>'int']
        ], 'server/routes/save.php->verify tasks');
        // Now verify individual itemsTagged entries
        JSEvery($task['itemsTagged'], function($tag) {
            if($tag['place']=='worker') {
                verifyInput($tag, [
                    ['name'=>'place', 'required'=>true, 'format'=>'stringnotempty'],
                    ['name'=>'id',    'required'=>true, 'format'=>'posint'],
                    ['name'=>'slot',  'required'=>true, 'format'=>'int']
                ], 'server/routes/save.php->verify itemsTagged of tasks->case worker');
            }
            if($tag['place']=='tile') {
                verifyInput($tag, [
                    ['name'=>'place', 'required'=>true, 'format'=>'stringnotempty'],
                    ['name'=>'x',     'required'=>true, 'format'=>'int'],
                    ['name'=>'y',     'required'=>true, 'format'=>'int'],
                    ['name'=>'slot',  'required'=>true, 'format'=>'int']
                ], 'server/routes/save.php->verify itemsTagged of tasks->case tile');
            }
        });
    });

    // Now, verify the user
    $res = DanDBList("SELECT * FROM sw_player WHERE id=? AND ajaxcode=?;", 'ii', [$con['userid'], $con['ajaxcode']],
                     'server/routes/save.php->get player record');
    if(sizeof($res)===0) {
        // No player data was found
        ajaxreject('invaliduser', 'Sorry, your login token is expired. Please log in again');
    }
    $player = $res[0];  // This will tell us which worldmap tile to update

    // Update everything in the worldmap tile, in one go
    DanDBList("UPDATE sw_map SET workers=?, structures=?, tasks=?, unlockeditems=? WHERE x=? AND y=?;", 'ssssii',
              [json_encode($con['workers']), json_encode($con['structures']), json_encode($con['tasks']),
              json_encode($con['unlockeditems']), $player['currentx'], $player['currenty']],
              'routes/save.php->save map content');

    // With that done, the server can go back to... wait, what does a server do when it's not doing work???
    die(json_encode(['result'=>'success']));
?>