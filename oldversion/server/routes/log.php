<?php
    /*  log.php
        Manages saving logging content from the client, storing it in the database. Note that this is kind of risky, as it will
        require a lot of throughput into the database, without any user-specific safeguards
    */

    require_once("../config.php");
    require_once("../libs/common.php");
    // ehhh, let's not worry about processing events with this one. It's only for error recording anyway

    // Collect the message
    require_once("../getInput.php");

    // Ensure we have at least the basic fields needed
    $logs = $msg['logs'];
    for($i=0; $i<sizeof($logs); $i++) {
        if(!isset($logs[$i]['codeSpot'])) ajaxreject('badinput', 'entry missing codeSpot');
        if(!isset($logs[$i]['happens'])) ajaxreject('badinput', 'entry missing happens');
        if(!isset($logs[$i]['grouping'])) ajaxreject('badinput', 'entry missing grouping');
    }

    // Put together a single query to save this to the database
    $result = $db->query("INSERT INTO sw_log (happens, codelocation, loggroup, content) VALUES ". 
        implode(',', array_map(function($single) {
            // our log entries will contain the 3 main variables, but we will need to remove them from the object before inserting it
            $location = $single['codeSpot']; unset($single['codeSpot']);
            $happens = $single['happens']; unset($single['happens']);
            $group = $single['grouping']; unset($single['grouping']);
            return "('". danescape($happens) ."','". danescape($location) ."','". danescape($group) ."','". danescape(json_encode($single)) ."')";
        }, $logs)) .";");
    if(!$result) {
        reporterror('server/log.php->save logs', 'error saving. MySQL says '. mysqli_error($db));
        ajaxreject('internal', 'DB error');
    }
    die(json_encode(['result'=>'success']));
?>


