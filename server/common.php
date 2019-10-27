<?php

    $db = mysqli_connect('localhost:3306', 'tucker', 'starburst', 'settlerswarlords');


    function validInt($value) {
        // Returns true if the string $value is a valid int (and only an int), or false if not.
        return (strval(intval($value))==$value);
    }

    function validFloat($value) {
        // Returns true if the string $value is a valid float (and nothing but a float), or false if not.
        return (strval(floatval($value))==$value);
    }

    function reporterror($errordesc) {
        //Generates an error report for the database.
        global $db;

        $db->query("INSERT INTO sw_error (happens, content) VALUES (NOW(), '" . danescape((string) $errordesc) . "');");
    }

    function danescape($rawstring) {
        // A shortened version of mysqli_real_escape_string. Used to help prevent attacks through 
        global $db;

        return mysqli_real_escape_string($db, $rawstring);
    }

    function danquery($content, $codesection) {
        //Executes a sql query and returns the resulting data structure.  A basic wrapper for the mysql_query function, that includes error reporting.  If you are after a
        //specific field, use getfield.
        //  $content     - specific sql content to send to the database
        //  $codesection - which code section made this call.  Used to determine where errors happened.
        global $db;

        $query = $db->query($content);
        if (!$query) {
            reporterror($codesection . ": query returned an error in danquery(), query = {" . $content . "} mysql says " . mysqli_error($db));
            return null;
        }
        return $query;
    }

    function danqueryajax($content, $codesection) {
        // Executes a sql query and returns the resulting data structure. A Basic wrapper function for the $db->query function call, that
        // includes error management. If the query fails, both reporterror() and ajaxreject() will be called, thus ending the script.
        // $content - specific sql content to send to the database
        // $codesection - which code section this query is being ran from

        global $db;
        $query = $db->query($content);
        if (!$query) {
            reporterror($codesection . ": query returned an error state. Query = {" . $content . "}, MySQL says " . mysqli_error($db));
            ajaxreject('DB query failure', 'There was an error in an SQL query. Please contact the admin.');
        }

        // Instead of returning the query handle, we want to organize any & all data into a data structure that can be handled on the
        // recieving end
        $output = [];
        //if ($query == true) {
        //return true;
        //}
        $content = mysqli_fetch_assoc($query);
        while ($content) {
            array_push($output, $content);
            $content = mysqli_fetch_assoc($query);
        }
        return $output;
    }

    function danpost($content, $codesection) {
        // Executes an sql query, just like danqueryajax, but does not worry about output values. Good for insert, update
        // and delete calls, where no data reply is expected

        global $db;
        $query = $db->query($content);
        if(!$query) {
            reporterror($codesection . ": query returned an error state. Query = {" . $content . "}, MySQL says " . mysqli_error($db));
            ajaxreject('DB query failure', 'There was an error in an SQL query. Please contact the admin.');
        }
        return;
    }

    function danget($content, $codeSection, $zeroaccepted=false) {
        // Executes an sql query, just like danqueryajax, but expects exactly one record to be returned. Any more or less is considered a
        // fail state.
        // $content - full content of the SQL query to call
        // $codeSection - where this code is being called from, for error reporting
        // $zeroaccepted - set to true to allow results where zero results might be possible

        global $db;
        $query = $db->query($content);
        if(!$query) {
            reporterror($codeSection . ": query returned an error state. Query = {" . $content . "}, MySQL says " . mysqli_error($db));
            ajaxreject('DB query failure', 'There was an error in an SQL query. Please contact the admin.');
        }

        // Now, collect the results
        $result = mysqli_fetch_assoc($query);
        if(!$result && $zeroaccepted==false) {
            reporterror('Error: danget (called from '. $codeSection .') returned no records. Query: '. $content .
                        '. Note that danget() expects to return a single record');
            ajaxreject('DB query failure', 'No records was found, when one should exist.');
        }
        if(mysqli_fetch_assoc($query)) {
            // aka that function returned more data... we don't need to know what it was, though
            reporterror('Error: danget (called from '. $codeSection .') returned more than one record. Query: '. $content);
            ajaxreject('DB query failure', 'More than one record was found, when only one should exist');
        }
        return $result;
    }

    function ajaxreject($failreason, $failmessage) {
        // Builds an array object to manage sending a fail state back to the client
        // $failreason - string containing a general code of why this failed
        // $failmessage - text shown to the user providing a reason for the failure
        
        die(json_encode(array(
            "result" => "fail",
            "cause" => $failreason,
            "message" => $failmessage,
        )));
    }

    function verifyInput($content, $standards, $callfrom) {
        // Verifies that the input content (array) matches all the parameters that is specified in standards (also an array). If any
        // parameters are not satisfied, the program will abort from here
        // $content - array recieved from the client
        // $standards - array of objects. Each object contains:
        //      name - what name of the variable to accept
        //      format - type of variable this is. Values consist of int, float, string, email
        //      required - set to true if this variable must be provided by the client, or false if it is optional
        // $callfrom - location in the code that this function is called from. Helps in determining its source
        // Returns an array of the specified input parameters, which have been 'washed'.

        // First, check that all the required parameters have been provided
        foreach($standards as $value) {
            if(!JSFind(array_keys($content), function($ele) use ($value) {
                return $ele==$value['name'];
            })) {
                reporterror('Input error in '. $callfrom .'->verifyInput(): parameter '. $value['name'] .' missing.');
                ajaxreject('missingfields', 'Input error: missing parameter '. $value['name']);
            }
        }

        return JSMapWithKeys($content, function($ele, $key) use ($standards, $callfrom) {

            // Actually, we should be expecting the action keyword (but don't want to write that in every call to this function)
            if($key=='action') return array('action', $ele);
            
            // Start by getting the correct element from $standards. Note that any unneeded parameters will generate an error
            $params = JSFind($standards, function($tel) use ($key) {
                return ($tel['name']==$key);
            });
            if($params===null) {
                reporterror('Error in '. $callfrom .'->verifyInput(): unexpected parameter = '. danescape($key) .'. IP='. $_SERVER['REMOTE_ADDR']);
                ajaxreject('badinput', 'Input error: unexpected parameter '. $key);
            }
            // Now, determine if this value satisfies the requirements

            //if($params['required']==false) {
                // Hmm. This looks at the problem backwards. $params will exist if $ele exists. If a $params doesn't exist for an $ele, the
                // user is providing an unknown variable (which is suspicious).  If the user didn't provide $ele... this function won't run
                // for that particular element
            // However, the $ele provided could be a blank or unuseable value. We should still check that here    
            if($params['required']==false) {
                if($ele=='') {
                    if($params['format']=='int' || $params['format']=='float' || $params['format']=='posint') {
                        return array(danescape($key), 0);
                    }
                    return array(danescape($key), '');
                }
            }
            
            //Next, check the variable's format
            switch($params['format']) {
                case 'int': // accepts any whole number
                    if(!validInt($ele)) {
                        reporterror('Input error in '. $callfrom .'->verifyInput(): parameter '. danescape($key) .' is not an int. IP='.
                                    $_SERVER['REMOTE_ADDR']);
                        ajaxreject('badinput', 'Input error: parameter '. $key .' must be an int');
                    }
                    return array(danescape($key), intval(danescape($ele)));
                case 'posint': // accepts any whole number greater than zero. Good for ID fields, years, etc
                    if(!validInt($ele)) {
                        reporterror('Input error in '. $callfrom .'->verifyInput(): parameter '. danescape($key) .' is not an int. IP='.
                                    $_SERVER['REMOTE_ADDR']);
                        ajaxreject('badinput', 'Input error: parameter '. $key .' must be an int');
                    }
                    if($ele<=0) {
                        reporterror('Input error in '. $callfrom .'->verifyInput(): parameter '. danescape($key) .' must be >0. IP='.
                                    $_SERVER['REMOTE_ADDR']);
                        ajaxreject('badinput', 'Input error: parameter '. $key .' must be positive');
                    }
                    return array(danescape($key), intval(danescape($ele)));
                case 'float':
                    if(!validFloat($ele)) {
                        reporterror('Input error in '. $callfrom .'->verifyInput(): parameter '. danescape($key) .' is not a float. IP='.
                                    $_SERVER['REMOTE_ADDR']);
                        ajaxreject('badinput', 'Input error: parameter '. $key .' must be a float');
                    }
                    return array(danescape($key), floatval(danescape($ele)));
                case 'string':
                    if(danescape($ele)!=danescape($ele)) {
                        reporterror('Input error in '. $callfrom .'->verifyInput(): parameter '. danescape($key) .
                                    ' is not equal after conversion. IP='. $_SERVER['REMOTE_ADDR']);
                        ajaxreject('badinput', 'Input error: parameter '. $key .' is not valid');
                    }
                    return array(danescape($key), danescape($ele));
                case 'stringnotempty':  // For any strings that must have content in them
                    if(danescape($ele)!=danescape($ele)) {
                        reporterror('Input error in '. $callfrom .'->verifyInput(): parameter '. danescape($key) .
                                    ' is not equal after conversion. IP='. $_SERVER['REMOTE_ADDR']);
                        ajaxreject('badinput', 'Input error: parameter '. $key .' is not valid');
                    }
                    if($ele=='') {
                        reporterror('Input error in '. $callfrom .'->verifyInput(): parameter '. danescape($key) .
                                    ' cannot be empty. IP='. $_SERVER['REMOTE_ADDR']);
                        ajaxreject('badinput', 'Input error: parameter '. $key .' cannot be empty');
                    }
                    return array(danescape($key), danescape($ele));
                case 'email': // For all email instances. This only checks for the existence of an @ symbol, and a dot somewhere.
                    if(danescape($ele)!=danescape($ele)) {
                        reporterror('Input error in '. $callfrom .'->verifyInput(): parameter '. danescape($key) .
                                    ' is not equal after conversion. IP='. $_SERVER['REMOTE_ADDR']);
                        ajaxreject('badinput', 'Input error: parameter '. $key .' is not valid');
                    }
                    if($ele=='') {
                        reporterror('Input error in '. $callfrom .'->verifyInput(): parameter '. danescape($key) .
                                    ' cannot be empty. IP='. $_SERVER['REMOTE_ADDR']);
                        ajaxreject('badinput', 'Input error: parameter '. $key .' cannot be empty');
                    }
                    $hold = $ele;
                    // We would check for an empty string, but checking for an @ or . will yield the same results
                    if((strpos($hold, '@') == false) || (strpos($hold, '.') == false)) {
                        reporterror('Input error in '. $callfrom .'->verifyInput(): parameter '. danescape($key) .
                                    ' is not a valid email address. IP='. $_SERVER['REMOTE_ADDR']);
                        ajaxreject('badinput', 'Input error: parameter '. $key .' must be an email');
                    }
                    return array(danescape($key), danescape($ele));
                default:
                    reporterror('Error in '. $callfrom .'->verifyInput(): format type of '. $params['format'] .' not allowed');
                    ajaxreject('badinput', 'Error in verifyInput: format '. $params['format'] .' not yet supported');
            }
        }, $content);
    }

    function verifyUser($message) {
        // Verifies that a user's credentials are valid.  Note that this portion is not handled through verifyInput.
        // $message - full content received from the ajax call. This should be filtered to ensure 

        global $userid;
        
        $user = danget("SELECT id, ajaxcode, ipaddress FROM sw_player WHERE id=". intval(danescape($message['userid'])) .";",
                       'ajax.php->verifyuser()->get player info', true);
        if(!$user) ajaxreject('useraccess', 'Your login credentials are not valid. Please log in');
        //reporterror('Debug in server/common.php->verifyUser(): user record found successfully');
        if($user['ajaxcode']!=$message['access']) ajaxreject('useraccess', 'Your login credentials are not valid. Please log in again');
        if($user['ipaddress']!=$_SERVER['REMOTE_ADDR']) ajaxreject('useraccess', 'Your login credentials are not valid. Please log in again');
        $userid = $user['id'];
    }
?>