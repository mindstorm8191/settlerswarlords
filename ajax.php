<?php
    /* ajax.php
        Entry point for all messages received from the client side of this app
        for the project Settlers & Warlords
    */

    require_once("server/common.php");
    require_once('server/DanGlobal.php');
    require_once('server/jsarray.php');
    require_once('server/weightedRandom.php');

    require_once('server/globals.php');
    require_once('server/mapbuilder.php');
    require_once('server/usermap.php');
    require_once('server/process.php');
    require_once('server/event.php');

    require_once('server/route_account.php');
    require_once('server/route_admin.php');
    require_once('server/route_localMap.php');
    require_once('server/route_worldMap.php');

    // Manage the headers for this, based on where the message comes from
    if($_SERVER['HTTP_ORIGIN']=="http://localhost:3000") header('Access-Control-Allow-Origin: http://localhost:3000');
    if($_SERVER['HTTP_ORIGIN']=="http://localhost:3001") header('Access-Control-Allow-Origin: http://localhost:3001');
    if($_SERVER['HTTP_ORIGIN']=="http://localhost:80") header('Access-Control-Allow-Origin: http://localhost:80');
    
    // Getting content via javascript's fetch() command is a little more complex than jQuery's ajax() command.
    $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
    if($contentType!="text/plain;charset=UTF-8") {
        // This isn't valid data.  Return a basic error
        reporterror('ajax.php->convert message', 'Content type received is not application/json. Content type provided={'. danescape($contentType) .'}');
        ajaxreject('noinput', 'Something is wrong with the request');
    }

    // Now process the raw post data
    $content = trim(file_get_contents("php://input"));
    $msg = json_decode($content, true);
    //If json decoding failed, the JSON is invalid
    if(!is_array($msg)) {
        if($_POST['action']!='') reporterror('in action.php: post[action]='. $_POST['action']);
        reporterror('ajax.php->convert message', 'Message received is not an array. Data received={'. danescape($content) .'}');
        ajaxreject('noinput', 'message recieved is not an array');
    }

    date_default_timezone_set("America/Kentucky/Louisville");

    switch($msg['action']) {
        case 'signup': return route_signup($msg);       // reference server/route_account.php
        /*case 'login': return route_login($msg);         // reference server/route_account.php
        case 'autologin': return route_autologin($msg); // reference server/route_account.php
        case 'logout': return route_logout($msg);                     // refernece server/route_account.php
        case 'addbuilding': return route_addBuilding($msg);  // reference server/route_localMap.php
        case 'addprocess': return route_addProcess($msg);    // reference server/route_localMap.php
        case 'setpriority': return route_localMapSetPriority($msg); // reference server/route_localMap.php
        case 'getworldmap': return route_getWorldMap($msg);  // reference server/route_worldMap.php
        case 'startworldaction':       return route_startWorldAction($msg);       // reference server/route_worldMap.php
        case 'adminAddBuildingAction': return route_adminAddBuildingAction($msg); // reference server/route_admin.php
        case 'adminChangeActionItem':  return route_adminChangeActionItem($msg);  // reference server/route_admin.php
        case 'adminNewActionItem':     return route_adminNewActionItem($msg);     // reference server/route_admin.php
        //*/
        default: ajaxreject('badroute', 'Route of '. $msg['action'] .' not supported');
    }
    
/*          Functions and their locations
    global $accesscode (int) - server/globals.php
    function advanceProcesses() - server/process.php
    function advanceStartPos() - server/mapbuilder.php
    function ajaxreject() - server/common.php
    function array_key_first() - server/jsarray.php
    const $civilizations (array of objects) - server/globals.php
    const $civTypes (array of strings) - server/globals.php
    function compareObjects() - server/jsarray.php
    function DanDBList() - server/common.php
    function danescape() - server/common.php
    global $db (object?) - server/common.php
    function ensureMinimap() - server/mapbuilder.php
    function ensureMinimapId() - server/mapbuilder.php
    function ensureMinimapXY() - server/mapbuilder.php
    function finishLogin() - server/route_account.php
    function forrange() - server/jsarray.php
    function generateClusterMap() - server/mapbuilder.php
    function getGlobal() - server/DanGlobal.php
    function getMapId() - server/usermap.php
    function getMapXY() - server/usermap.php
    function getRandomFrom() - server/jsarray.php
    function includesAll() - server/jsarray.php
    function JSEvery() - server/jsarray.php
    function JSFilter() - server/jsarray.php
    function JSFilterSplit() - server/jsarray.php
    function JSFilterSplitBy() - server/jsarray.php
    function JSFind() - server/jsarray.php
    function JSFindIndex() - server/jsarray.php
    function JSMapWithKeys() - server/jsarray.php
    function JSNextId() - server/jsarray.php
    function JSSome() - server/jsarray.php
    const $knownMapBiomes (array of strings) - server/globals.php
    function localMap_addBuilding() - server/usermap.php
    function localMap_addProcess() - server/usermap.php
    function localMap_GetSquareInfo() - server/usermap.php
    function localMap_loadBuildOptions() - server/usermap.php
    function newPlayerLocation() - server/mapbuilder.php
    const $oreTypes (array of strings) - server/globals.php
    function randFloat() - server/mapbuilder.php
    function reporterror() - server/common.php
    function route_addBuilding() - server/route_localMap.php
    function route_addProcess() - server/route_localMap.php
    function route_autoLogin() - server/route_account.php
    function route_localMapSetPriority() - server/route_localMap.php
    function route_login() - server/route_account.php
    function route_signup() - server/route_account.php
    function setGlobal() - server/DanGlobal.php
    function signup_ensureUniqueUser - server/route_account.php
    function splitArray() - server/jsarray.php
    function updateknownmap() - server/usermap.php
    global $userid (int) - server/globals.php
    function validFloat() - server/common.php
    function validInt() - server/common.php
    function verifyInput() - server/common.php
    function verifyUser() - server/route_account.php
    class weightedRandom - server/weightedRandom.php
    function within() - server/mapbuilder.php
    const $worldBiomes (array of strings) - server/globals.php
    function worldmap_generate() - server/mapbuilder.php
    */
?>