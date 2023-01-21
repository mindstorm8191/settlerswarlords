<?php
    /*  savetiles.php
        Saves localmap tile content to the database. Because storing tiles into the database is managed differently, updating tiles takes
        a significantly larger amount of time. This is designed to process one chunk of tiles at a time; the client will continue sending
        new chunks until complete
        For the game Settlers & Warlords
    */

    require_once("../config.php");
    require_once("../common.php");
    require_once("../jsarray.php");

    // Collect the message
    require_once("../getInput.php");

    // verify the input
    $con = verifyInput($msg, [
        ['name'=>'userid', 'required'=>true, 'format'=>'posint'],
        ['name'=>'ajaxcode', 'required'=>true, 'format'=>'int'],
        ['name'=>'tiles', 'required'=>true, 'format'=>'array']
    ], 'server/routes/savetiles.php->verify input level 1');

    // Next, verify each of the tiles - and each item in that tile
    JSEvery($con['tiles'], function($tile) {
        verifyInput($tile, [
            ['name'=>'x',           'required'=>true, 'format'=>'int'],
            ['name'=>'y',           'required'=>true, 'format'=>'int'],
            ['name'=>'landtype',    'required'=>true, 'format'=>'int'],
            ['name'=>'newlandtype', 'required'=>true, 'format'=>'int'],
            ['name'=>'buildid',     'required'=>true, 'format'=>'int'],
            ['name'=>'items',       'required'=>true, 'format'=>'array'],
            //['name'=>'image',       'required'=>false, 'format'=>'stringnotempty']
            //['name'=>'buildImage',  'required'=>false, 'format'=>'stringnotempty']
        ], 'server/routes/savetiles.php->verify tile');
        JSEvery($tile['items'], function($item) {
            verifyInput($item, [
                ['name'=>'name',   'required'=>true, 'format'=>'stringnotempty'],
                ['name'=>'group',  'required'=>true, 'format'=>'stringnotempty'],
                ['name'=>'inTask', 'required'=>true, 'format'=>'int'],
                ['name'=>'extras', 'required'=>true, 'format'=>'array']
            ], 'server/routes/savetiles.php->verify items in tile');
            return true;
        });
        return true;
    });

    // Now, verify the user
    $res = DanDBList("SELECT * FROM sw_player WHERE id=? AND ajaxcode=?;", 'ii', [$con['userid'], $con['ajaxcode']], 'routes/savetiles.php->get player data');
    if(sizeof($res)===0) {
        // No player data was collected
        ajaxreject('invaliduser', 'Sorry, your login token is expired. Please log in again');
    }
    $player = $res[0];

    // Now get the correct worldmap tile that this user is at
    $worldTile = DanDBList("SELECT * FROM sw_map WHERE x=? AND y=?;", 'ii', [$player['currentx'], $player['currenty']], 'routes/savetiles.php->get player worldmap tile');
    $worldTile = $worldTile[0];

    // Now we are ready to save the data
    $tileString = array_map(function($tile) use ($worldTile) {
        return '('. $worldTile['id'] .','.
            $tile['x'] .','.
            $tile['y'] .','.
            $tile['newlandtype'] .','.
            $tile['buildid'] .','.
            json_encode($tile['items']) .')';
    }, $con['tiles']);
    $db->query("INSERT INTO sw_minimap (mapid, x, y, newlandtype, buildid, items) VALUES ".
        implode(',', $tileString)
    ." ON DUPLICATE KEY UPDATE newlandtype=VALUES(newlandtype), buildid=VALUES(buildid) items=VALUES(items);");

    /* old method - this is slow, because each tile requires another query to the database
    DanMultiDB("UPDATE sw_minimap SET newlandtype=?, buildid=?, items=? WHERE mapid=? AND x=? AND y=?;", 'iisiii',
        // We have an array of name-value pairs, but this function really needs only the values in the correct order
        array_map(function($tile) use ($worldTile) {
            return [
                $tile['newlandtype'],
                $tile['buildid'],
                json_encode($tile['items']),
                $worldTile['id'],
                $tile['x'],
                $tile['y']
            ];
        }, $con['tiles']), 'server/routes/savetiles.php->save tile'
    );*/


    die(json_encode(['result'=>'success']));
?>