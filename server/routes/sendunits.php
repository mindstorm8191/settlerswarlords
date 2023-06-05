<?php
    /*  sendunits.php
        Allows the player to send workers to neighboring world map tiles
        For the game Settlers & Warlords
    */

    require_once("../config.php");
    require_once("../libs/common.php");
    require_once("../libs/jsarray.php");
    require_once("../events.php");

    // Get the message
    require_once("../getInput.php");

    // Process any existing events now
    processEvents();

    // Verify the input
    $con = verifyInput($msg, [
        ['name'=>'userid',    'required'=>true, 'format'=>'posint'],
        ['name'=>'ajaxcode',  'required'=>true, 'format'=>'int'],
        ['name'=>'people',    'required'=>true, 'format'=>'posint'],
        ['name'=>'targetx',   'required'=>true, 'format'=>'int'],
        ['name'=>'targety',   'required'=>true, 'format'=>'int'],
        ['name'=>'action',    'required'=>true, 'format'=>'stringnotempty'],
        ['name'=>'equipment', 'required'=>false, 'format'=>'array'] // we don't yet have this field, but we can generate it later
    ], 'server/routes/sendunits.php->verify input');

    // Validate the user info
    $res = DanDBList("SELECT * FROM sw_player WHERE id=? AND ajaxcode=?;", 'ii', [$con['userid'], $con['ajaxcode']],
                     'server/routes/sendunits.php->get player record');
    if(sizeof($res)===0) {
        // No player data was found
        ajaxreject('invaliduser', 'Sorry, your login token is expired. Please log in again');
    }
    $player = $res[0];  // This will tell us which worldmap tile to update

    // Now we introduce the event system! This is a system I even used back in my days of Vesuvius. Why do I use it here? Because it's simple,
    // and it works. The premise is simple: When something needs to happen in the future, we create an event for it. Later, when serverside
    // code is ran, we process all events that have already happened (in the order they happened). Event updates can trigger additional events
    // of all types; it is important to keep all events completed in order.

    // For this operation we will still need to select a worker for our travels. Later on we will let the user determine which worker to
    // send, but that is for another layer of development
    $workerdata = json_decode(DanDBList("SELECT workers FROM sw_map WHERE x=? AND y=?;", 'ii', [$player['currentx'], $player['currenty']],
                                        'server/routes/sendunits.php->get workers on map')[0]['workers'], true);

    // We will also introduce travelling parties to the game (known as travelers in the database)
    DanDBList("INSERT INTO sw_traveler (player, sourcex, sourcey, x, y, workers, items, commands, detail) VALUES (?,?,?,?,?,?,?,?,?);", 'iiiiissss',
              [$player['id'], $player['currentx'], $player['currenty'], $player['currentx'], $player['currenty'],
              json_encode([$workerdata[0]]),
              json_encode([]),
              json_encode([
                // I think we won't worry about operational commands yet
                // The challenging part about this is, we are trying to create multiple commands when none have ever been created
                //['name'=>'goto', 'targetx'=>$con['targetx'], 'targety'=>$con['targety'], 'ondanger'=>'returnhome'],
                // we will probably add a path variable to this (above) later
                //['name'=>'scout', 'ondanger'=>'abort'],
                //['name'=>'returnhome', 'ondanger'=>'usenewroute']
              ]),
              json_encode([])
              ], 'server/routes/sendunits.php->create traveller group');
    $travelerid = mysqli_insert_id($db);

    // For this route, we only need to create the event (with all the related components to it)
    // event record fields
    // id (this gets set automatically)
    // task (type of operation for this event)
    // timepoint (when this event should happen)
    // detail (specifics about this event)
    DanDBList("INSERT INTO sw_event (task,detail,timepoint) VALUES ('unittravel',?,DATE_ADD(NOW(), INTERVAL 5 MINUTE));", 's',
              [json_encode([
                'traveler'=>$travelerid,
                'fromx'=>$player['currentx'],
                'fromy'=>$player['currenty'],
                'targetx'=>$con['targetx'],
                'targety'=>$con['targety'],
              ])],
              'server/routes/sendunits.php->create event');
    $eventid = mysqli_insert_id($db);

    // While we are waiting for these units to reach their destination & return, we can tag the target tile as being explored
    updateKnownMap($player['id'], $con['targetx'], $con['targety'], "NOW()", "auto", "auto", "auto", "auto", 1);
    
    // Well, that's all we can do for now. We need to end an update to the known map to the user now
    die(json_encode([
        'result'=>'success',
        'tileupdate'=>[
            'x'=>$con['targetx'], 'y'=>$con['targety'],
            'lastcheck'=>'none',
            'owner'=>0, 'civ'=>-1, 'population'=>0, 'biome'=>8,
            'isexploring'=>1
        ]
    ]));
?>
