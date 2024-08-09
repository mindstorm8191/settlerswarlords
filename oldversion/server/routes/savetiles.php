<?php
    /*  savetiles.php
        Saves localmap tile content to the database. Becaus storing tiles into the database is managed differently, updating tiles takes a
        significantly larger amount of time. This is designed to process one chunk of tiles at a time; the client will continue sending
        new chunks until the job is complete
        For the game Settlers & Warlords
    */

    require_once("../config.php");
    require_once("../libs/common.php");
    require_once("../libs/jsarray.php");
    // Hmm, we just saved general data, I don't think we need to process events again here

    // Collect the message
    require_once("../getInput.php");

    // verify the input. The code only passes the tiles list, but DAX adds the userid & ajaxcode too
    $con = verifyInput($msg, [
        ['name'=>'userid', 'required'=>true, 'format'=>'posint'],
        ['name'=>'ajaxcode', 'required'=>true, 'format'=>'int'],
        ['name'=>'tiles', 'required'=>true, 'format'=>'array']
    ], 'server/routes/savetiles.php->verify base input');

    // Next, verify each of the tiles - and the items that are there
    JSEvery($con['tiles'], function($tile) {
        verifyInput($tile, [
            ['name'=>'x',           'required'=>true, 'format'=>'int'],
            ['name'=>'y',           'required'=>true, 'format'=>'int'],
            // we don't need to save the original landtype, since it never changes
            ['name'=>'landtype',    'required'=>true, 'format'=>'int'],
            ['name'=>'structureid', 'required'=>true, 'format'=>'int'],
            ['name'=>'items',       'required'=>true, 'format'=>'array'],
        ], 'server/routes/savetiles.php->verify tiles');

        // Now check the items on this tile
        // Items only have name & inTask fields that is guaranteed; everything else is optional at this point
        JSEvery($tile['items'], function($item) {
            verifyInput($item, [
                ['name'=>'name',   'required'=>true, 'format'=>'stringnotempty'],
                ['name'=>'inTask', 'required'=>true, 'format'=>'int'],
                ['name'=>'group',  'required'=>false, 'format'=>'stringnotempty'],
                ['name'=>'efficiency', 'required'=>false, 'format'=>'float'],
                ['name'=>'endurance',  'required'=>false, 'format'=>'float']
            ], 'server/routes/savetiles.php->verify tile items');
        });
    });

    // Now, verify the user
    $res = DanDBList("SELECT * FROM sw_player WHERE id=? AND ajaxcode=?;", 'ii', [$con['userid'], $con['ajaxcode']],
                     'server/routes/savetiles.php->get player data');
    if(sizeof($res)===0) {
        ajaxreject('invaliduser', 'Sorry, your login token is expired. Please log in again');
    }
    $player = $res[0];

    // Get the correct worldmap tile that this user is at
    $worldTile = DanDBList("SELECT * FROM sw_map WHERE x=? AND y=?;", 'ii', [$player['currentx'], $player['currenty']],
                           'server/routes/savetiles.php->get worldmap data')[0];

    // Now, convert the tile data into a string, so it can update the database in one go
    $tileString = array_map(function($tile) use ($worldTile) {
        return '('. $worldTile['id'] .','.
            $tile['x'] .','.
            $tile['y'] .','.
            // We don't need landtype, as that will never really change
            $tile['landtype'] .','.
            $tile['structureid'] .",'".
            json_encode($tile['items']) ."')";
    }, $con['tiles']);
    $result = $db->query("INSERT INTO sw_minimap (mapid, x, y, landtype, structureid, items) VALUES ".
        implode(',', $tileString)
    ." ON DUPLICATE KEY UPDATE landtype=VALUES(landtype), structureid=VALUES(structureid), items=VALUES(items);");
    if(!$result) {
        $error = mysqli_error($db);
        reporterror('server/routes/savetiles.php->save tiles', 'query error; mysql says '. $error);
        ajaxreject('internal', 'DB error. Mysql says '. $error);
    }

    die(json_encode(['result'=>'success']));
?>

