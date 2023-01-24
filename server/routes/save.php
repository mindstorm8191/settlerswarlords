<?php
    /*  save.php
        Saves the player's localmap content to database for later retrieval
        For the game Settlers & Warlords
    */

    require_once("../config.php");
    require_once("../common.php");
    require_once("../jsarray.php");

    // Start with collecting the message
    require_once("../getInput.php");

    // Verify all the input received
    $con = verifyInput($msg, [
        ["name"=>"userid",   "required"=>true, "format"=>"posint"],
        ["name"=>"ajaxcode", "required"=>true, "format"=>"int"],
        ["name"=>"workers",  "required"=>true, "format"=>"array"],
        ['name'=>'blocks',   'required'=>true, 'format'=>'array'],
        ['name'=>'tasks',    'required'=>true, 'format'=>'array'],
        ['name'=>'unlockeditems', 'required'=>true, 'format'=>'arrayOfStrings']
    ], 'server/routes/save.php->verify input level 1');

    // An array doesn't really verify anything, so we need to verify the worker data now
    // verifyInput will stop the script if there are any issues
    JSEvery($con['workers'], function ($ele) {
        verifyInput($ele, [
            ["name"=>"name", "required"=>true, "format"=>"stringnotempty"],
            ["name"=>"id",   "required"=>true, "format"=>"posint"],
            ["name"=>"x",    "required"=>true, "format"=>"int"],
            ["name"=>"y",           "required"=>true, "format"=>"int"],
            ["name"=>"status",      "required"=>true, "format"=>"stringnotempty"],
            ["name"=>"moveCounter", "required"=>true, "format"=>"int"],
            ["name"=>"tasks",       "required"=>true, "format"=>"arrayOfInts"],
            ["name"=>"carrying",    "required"=>true, "format"=>"array"]
        ], 'server/routes/save.php->verify workers base');
        JSEvery($ele['carrying'], function($mel) {
            verifyInput($mel, [
                ["name"=>"name",   "required"=>true, "format"=>"stringnotempty"],
                ["name"=>"group",  "required"=>true, "format"=>"stringnotempty"],
                ["name"=>"inTask",    "required"=>true, "format"=>"int"],
                //["name"=>"extras", "required"=>true, "format"=>"array"]
                // we don't really have an extras column in items. We have additional optional attributes, though
                ['name'=>'endurance',  'required'=>false, 'format'=>'float'],
                ['name'=>'efficiency', 'required'=>false, 'format'=>'float']
            ], 'server/routes/save.php->verify worker items');
            return true;
        });
        return true;
    });

    JSEvery($con['blocks'], function ($block) {
        // Each block type will have different variables
        switch($block['name']) {
            case "Lean-To":
                verifyInput($block, [
                    ['name'=>'id',   'required'=>true, 'format'=>'posint'],
                    ['name'=>'name', 'required'=>true, 'format'=>'stringnotempty'],
                    ['name'=>'x',    'required'=>true, 'format'=>'int'],
                    ['name'=>'y',    'required'=>true, 'format'=>'int'],
                    ['name'=>'mode',        'required'=>true, 'format'=>'stringnotempty'],
                    ['name'=>'progressBar', 'required'=>true, 'format'=>'int'],
                    ['name'=>'activeTasks', 'required'=>true, 'format'=>'arrayOfInts']
                ], 'server/routes/save.php->verify lean-to');
                return true;

            case "Forage Post":
                verifyInput($block, [
                    ['name'=>'id',   'required'=>true, 'format'=>'posint'],
                    ['name'=>'name', 'required'=>true, 'format'=>'stringnotempty'],
                    ['name'=>'x',    'required'=>true, 'format'=>'int'],
                    ['name'=>'y',           'required'=>true, 'format'=>'int'],
                    ['name'=>'activeTasks', 'required'=>true, 'format'=>'arrayOfInts']
                ], 'server/routes/save.php->verify forage post');
                return true;
                // Hmm, all these item-builder blocks really won't need a lot of content

            case "Rock Knapper":
                verifyInput($block, [
                    ['name'=>'id',   'required'=>true, 'format'=>'posint'],
                    ['name'=>'name', 'required'=>true, 'format'=>'stringnotempty'],
                    ['name'=>'x',    'required'=>true, 'format'=>'int'],
                    ['name'=>'y',           'required'=>true, 'format'=>'int'],
                    ['name'=>'activeTasks', 'required'=>true, 'format'=>'arrayOfInts']
                ], 'server/routes/save.php->verify rock knapper');
                return true;
            
            case "Loggers Post":
                verifyInput($block, [
                    ['name'=>'id',   'required'=>true, 'format'=>'posint'],
                    ['name'=>'name', 'required'=>true, 'format'=>'stringnotempty'],
                    ['name'=>'x',    'required'=>true, 'format'=>'int'],
                    ['name'=>'y',           'required'=>true, 'format'=>'int'],
                    ['name'=>'activeTasks', 'required'=>true, 'format'=>'arrayOfInts']
                ], 'server/routes/save.php->verify loggers post');
                return true;

            case "Rope Maker":
                verifyInput($block, [
                    ['name'=>'id',   'required'=>true, 'format'=>'posint'],
                    ['name'=>'name', 'required'=>true, 'format'=>'stringnotempty'],
                    ['name'=>'x',    'required'=>true, 'format'=>'int'],
                    ['name'=>'y',           'required'=>true, 'format'=>'int'],
                    ['name'=>'activeTasks', 'required'=>true, 'format'=>'arrayOfInts']
                ], 'server/routes/save.php->verify rope maker');
                return true;

            case 'Dirt Source':
                verifyInput($block, [
                    ['name'=>'id',   'required'=>true, 'format'=>'posint'],
                    ['name'=>'name', 'required'=>true, 'format'=>'stringnotempty'],
                    ['name'=>'x',           'required'=>true, 'format'=>'int'],
                    ['name'=>'y',           'required'=>true, 'format'=>'int'],
                    ['name'=>'areaCleared', 'required'=>true, 'format'=>'stringnotempty'],
                    ['name'=>'activeTasks', 'required'=>true, 'format'=>'arrayOfInts']
                ], 'server/routes/save.php->verify dirt source');
                return true;

            case 'Water Source':
                verifyInput($block, [
                    ['name'=>'id',   'required'=>true, 'format'=>'posint'],
                    ['name'=>'name', 'required'=>true, 'format'=>'stringnotempty'],
                    ['name'=>'x',    'required'=>true, 'format'=>'int'],
                    ['name'=>'y',           'required'=>true, 'format'=>'int'],
                    ['name'=>'activeTasks', 'required'=>true, 'format'=>'arrayOfInts']
                ], 'server/routes/save.php->verify water source');
                return true;
            
            default:
                reporterror('server/routes/save.php->verify blocks', 'Unknown block type of '. danescape($block['name']) .' found. Saving cancelled');
                ajaxreject('badinput', 'Unkown block type of '. $block['name'] .'. Saving cancelled');
        }
    });

    // Validate the tasks list. Tasks have a lot of optional fields
    JSEvery($con['tasks'], function($task) {
        verifyInput($task, [
            ['name'=>'id',       'required'=>true, 'format'=>'posint'],
            ['name'=>'building', 'required'=>true, 'format'=>'posint'],
            ['name'=>'task',     'required'=>true, 'format'=>'stringnotempty'],
            ['name'=>'taskType', 'required'=>true, 'format'=>'stringnotempty'],
            ['name'=>'worker',   'required'=>true, 'format'=>'posint'],
            ['name'=>'status',      'required'=>true, 'format'=>'stringnotempty'],
            ['name'=>'targetx',     'required'=>true, 'format'=>'int'],
            ['name'=>'targety',     'required'=>true, 'format'=>'int'],
            ['name'=>'itemsNeeded', 'required'=>true,  'format'=>'array'],
            ['name'=>'toolsNeeded', 'required'=>true,  'format'=>'array'],
            ['name'=>'targetItem',  'required'=>false, 'format'=>'stringnotempty'],
            ['name'=>'carryTox',        'required'=>false, 'format'=>'int'],
            ['name'=>'carryToy',        'required'=>false, 'format'=>'int'],
            ['name'=>'ticksToComplete', 'required'=>false, 'format'=>'int'],
            ['name'=>'progress',        'required'=>false, 'format'=>'int']
        ], 'server/routes/save.php->verify tasks base');
        if(sizeof($task['itemsNeeded'])>0) {
            JSEvery($task['itemsNeeded'], function($item) {
                verifyInput($item, [
                    ['name'=>'name', 'required'=>true, 'format'=>'stringnotempty'],
                    ['name'=>'qty',  'required'=>true, 'format'=>'posint'],
                    ['name'=>'hasItem', 'required'=>true, 'format'=>'stringnotempty']
                ], 'server/routes/save.php->verify task->itemsNeeded');
                return true;
            });
        }
        if(sizeof($task['toolsNeeded'])>0) {
            JSEvery($task['toolsNeeded'], function($tool) {
                // This has one of three basic structures
                if($tool['selected']==='null') {
                    // No tool has been found here yet
                    verifyInput($tool, [
                        ['name'=>'hasTool', 'required'=>true, 'format'=>'stringnotempty'],
                        ['name'=>'tools',    'required'=>true, 'format'=>'arrayOfStrings'],
                        ['name'=>'selected', 'required'=>true, 'format'=>'stringnotempty']
                    ], 'server/routes/save.php->verify task->toolsNeeded case unselected');
                    return true;
                }
                if($tool['selectedAt']==='tile') {
                    verifyInput($tool, [
                        ['name'=>'hasTool', 'required'=>true, 'format'=>'stringnotempty'],
                        ['name'=>'tools',      'required'=>true, 'format'=>'arrayOfStrings'],
                        ['name'=>'selected',   'required'=>true, 'format'=>'stringnotempty'],
                        ['name'=>'selectedAt', 'required'=>true, 'format'=>'stringnotempty'],
                        ['name'=>'selectedx',  'required'=>true, 'format'=>'int'],
                        ['name'=>'selectedy',  'required'=>true, 'format'=>'int']
                    ], 'server/routes/save.php->verify task->toolsNeeded from tile');
                    return true;
                }
                if($tool['selectedAt']!=='worker') {
                    reporterror('server/routes/save.php->verify task->toolsNeeded', 'selectedAt is not tile or worker');
                    ajaxreject('badinput', 'invalid data found in task->toolsNeeded');
                }
                verifyInput($tool, [
                    ['name'=>'hasTool', 'required'=>true, 'format'=>'stringnotempty'],
                    ['name'=>'tools',      'required'=>true, 'format'=>'arrayOfStrings'],
                    ['name'=>'selected',   'required'=>true, 'format'=>'stringnotempty'],
                    ['name'=>'selectedAt',     'required'=>true, 'format'=>'stringnotempty'],
                    ['name'=>'selectedWorker', 'required'=>true, 'format'=>'posint']
                ], 'server.routes/save.php->verify task->toolsNeeded from worker');
                return true;
            });
        }
        return true;
    });

    // Now, verify the user
    $res = DanDBList("SELECT * FROM sw_player WHERE id=? AND ajaxcode=?;", 'ii', [$con['userid'], $con['ajaxcode']], 'routes/save.php->get player data');
    if(sizeof($res)===0) {
        // No player data was collected
        ajaxreject('invaliduser', 'Sorry, your login token is expired. Please log in again');
    }
    $player = $res[0];
    // This will tell us which map tile we need to update

    // Now update everything in the local map tile
    DanDBList("UPDATE sw_map SET workers=?, blocks=?, tasks=?, unlockeditems=? WHERE x=? AND y=?;", 'ssssii',
        [
            json_encode($con['workers']), json_encode($con['blocks']), json_encode($con['tasks']), json_encode($con['unlockeditems']),
            $player['currentx'], $player['currenty']
        ],
        'routes/save.php->save map content'
    );

    // With that over, we're done here. Send a success response
    die(json_encode(['result'=>'success']));
?>


