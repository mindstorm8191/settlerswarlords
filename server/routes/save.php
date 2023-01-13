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
        //["name"=>"tiles",    "required"=>true, "format"=>"array"],
        ["name"=>"workers",  "required"=>true, "format"=>"array"]
    ], 'server/routes/save.php->verify input level 1');

    // An array doesn't really verify anything, so we need to verify the worker data now
    // verifyInput will stop the script if there are any issues

    // Start with the tile content
    /*
    JSEvery($con['tiles'], function ($ele) {
        verifyInput($ele, [
            ['name'=>'x', 'required'=>true, 'format'=>'int'],
            ['name'=>'y',           'required'=>true, 'format'=>'int'],
            ['name'=>'landtype',    'required'=>true, 'format'=>'int'],
            ['name'=>'newlandtype', 'required'=>true, 'format'=>'int'],
            ['name'=>'buildid',     'required'=>true, 'format'=>'int'],
            ['name'=>'items',       'required'=>true, 'format'=>'array']
        ], 'server/routes/save.php->verify tiles base');
        JSEvery($ele['items'], function($mel) {
            verifyInput($mel, [
                ["name"=>"name",  "required"=>true, "format"=>"stringnotempty"],
                ["name"=>"group",  "required"=>true, "format"=>"stringnotempty"],
                ["name"=>"inTask", "required"=>true, "format"=>"int"],
                ["name"=>"extras", "required"=>true, "format"=>"array"]
            ], 'server/routes/save.php->verify worker items');
            return true;
        });
        return true;
    });*/

    // Now, scan the worker content
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
                ["name"=>"inTask", "required"=>true, "format"=>"int"],
                ["name"=>"extras", "required"=>true, "format"=>"array"]
            ], 'server/routes/save.php->verify worker items');
            return true;
        });
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

    // Finally! We are ready to save data to the database
    // Local map tiles have the potential to have a lot of items in each tile. Fortunately, we still have the data stored as individual tiles in the
    // database. It'll take a bit more work here, but that's bearable
    /*
    DanMultiDB("UPDATE sw_minimap SET newlandtype=?, buildid=?, items=? WHERE x=? AND y=?;", 'iisii', 
        array_map(function($ele) {
            return [
                $ele['newlandtype'],
                $ele['buildid'],
                json_encode($ele['items']),
                $ele['x'],
                $ele['y']
                //'x'=>$ele['x'],
                //'y'=>$ele['y'],
                //'newlandtype'=>$ele['newlandtype'],
                //'buildid'=>$ele['buildid'],
                //'items'=>json_encode($ele['items'])
            ];
        }, $con['tiles']),
        'server/routes/save.php->save minimap tiles'
    );*/

    // Now for the workers
    DanDBList("UPDATE sw_map SET workers=? WHERE x=? AND y=?;", 'sii', 
        [json_encode($con['workers']), $player['currentx'], $player['currenty']], 'routes/save.php->save map content'
    );

    // With that over, we're done here. Send a success response
    die(json_encode(['result'=>'success']));
?>


