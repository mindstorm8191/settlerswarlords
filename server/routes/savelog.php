<?php
    /* savelog.php
       Manages receiving log content from the client, and storing it into the database. Note that this is kind of risky, as it will
       require a lot of throughput into the database, without any user-specific safeguards
    */

    require_once("../config.php");
    require_once("../common.php");
    require_once("../jsarray.php");

    // Start with collecting the message
    require_once("../getInput.php");

    // Ensure we have at least the basic fields needed
    $logs = $msg['logs'];
    for($i=0; $i<sizeof($logs); $i++) {
        if(!isset($logs[$i]['codeSpot'])) ajaxreject('badinput', 'entry missing codeSpot');
        if(!isset($logs[$i]['happens'])) ajaxreject('badinput', 'entry missing happens');
        if(!isset($logs[$i]['grouping'])) ajaxreject('badinput', 'entry missing grouping');
    }
    reporterror('savelog.php', 'log save verified');

    // Start putting together a single string t insert this content
    /*
    for($i=0; $i<sizeof($logs); $i++) {
        $location = $logs[$i]['codeSpot'];
        $happens = $logs[$i]['happens'];
        unset($logs[$i]['codeSpot']);
        unset($logs[$i]['happens']);
    }*/
    $result = $db->query("INSERT INTO sw_log (happens, codelocation, loggroup, content) VALUES ".
        implode(',', array_map(function($single) {
            $location = $single['codeSpot'];
            $happens = $single['happens'];
            $group = $single['grouping'];
            unset($single['codeSpot']);
            unset($single['happens']);
            unset($single['grouping']);
            return "('". danescape($happens) ."','". danescape($location) ."','". danescape($group) ."','". danescape(json_encode($single)) ."')";
        }, $logs)) .";");
    if(!$result) {
        reporterror("server/savelog.php->query", "error; mysql says ". mysqli_error($db));
        ajaxreject('internal', 'DB error');
    }
    die(json_encode(['result'=>'success']));
?>