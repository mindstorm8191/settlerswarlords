<?php
    /*  getInput.php
        Simple flat script that collects the content from the message received
        Since all server communication is managed like an API, all routes will utilize this script
        For the game Settlers & Warlords
    */

    // Start by managing CORS. All that is necessary is to permit certain sources to be used. This will be passed back in the client's
    // response, so the browser can accept it.
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
?>