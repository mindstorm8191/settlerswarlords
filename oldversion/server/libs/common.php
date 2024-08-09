<?php
    /* Common.php
        Various functions of mine, that can be useful in most projects
    */

    require_once("jsarray.php");

    function validInt($value) {
        // Returns true if the string $value is a valid int (and only an int), or false if not.
        return (strval(intval($value))==$value);
    }

    function validFloat($value) {
        // Returns true if the string $value is a valid float (and nothing but a float), or false if not.
        
        // Checking for a valid float is quite a bit harder. If this is a string representing a float,
        // there are no easy ways to confirm that it is a float, since a string holding not-a-float still
        // converts to a valid float, and A equals A
        switch(gettype($value)) {
            case 'integer': case 'float': case 'double': return true;
            case 'string':
                return JSEvery(str_split($value), function($char) {
                    // With the single character, check that it is one of the valid characters
                    return JSSome(str_split('0123456789.'), function($i) use ($char) {
                        return $i===$char;
                    });
                });
            default: return false; // Any other data type will be rejected
        }
    }

    function danescape($rawstring) {
        // A shortened version of mysqli_real_escape_string. Used to help prevent attacks through SQL injection
        global $db;

        return mysqli_real_escape_string($db, $rawstring);
    }

    function ajaxreject($failreason, $failmessage) {
        // Builds an array object to manage sending a fail state back to the client
        // $failreason - string containing a general code of why this failed
        // $failmessage - text shown to the user providing a reason for the failure
        
        die(json_encode([
            "result" => "fail",
            "cause" => $failreason,
            "message" => $failmessage,
        ]));
    }

    function reporterror($codespot, $errordesc) {
        //Generates an error report to store in the database
        global $db;

        $db->query("INSERT INTO sw_error (happens, codelocation, content) VALUES (NOW(), '". 
                   danescape((string)$codespot) ."','". danescape((string) $errordesc) . "');");
    }

    function DanMultiDB($query, $varList, $varSet, $codeSection) {
        // Executes multiple mysql queries, without a return value. Use this for bulk inserts, updates or delete commands
        // $query - SQL query to run
        // $varList - List of variable types we are providing to the database, for each data set. Cannot be empty
        // $varSet - A 2D array, the 2nd layer containing the variables to pass into the query
        // $codeSection - location of the code where this was called, for error reporting

        global $db;
        if(sizeof($varSet)===0) return;
        if($varList==='') {
            reporterror($codeSection .'->DanMultiDB()', '$varList provided is empty');
            return;
        }

        $comm = $db->prepare($query);
        if(!$comm) {
            reporterror($codeSection .'->DanMultiDB()', 'Statement prepare failed. Used query {'. $query .'} MySQL response: '.
                        mysqli_error($db));
            return;
        }

        foreach($varSet as $vars) {
            if(!$comm->bind_param($varList, ...$vars)) {
                reporterror($codeSection .'->DanMultiDB()', 'Parameter binding failed. Used query {'. $query .'} & params '.
                            json_encode($vars) .'. MySQL says '. myqsli_error($db));
                return;
            }
            if(!$comm->execute()) {
                reporterror($codeSection .'->DanMultiDB()', 'Query execution failed. Used query {'. $query .'} & params '.
                            json_encode($vars) .'. Mysql says '. mysqli_error($db));
                return;
            }
        }
    }

    function DanDBList($query, $varList, $vars, $codeSection) {
        // Executes a mysql query and returns the resulting data structure. A simple wrapper for the $db->query call, but includes
        // error management
        // $query - SQL query to send to the database
        // $varList - List of variable types we are providing to the database
        // $vars - array of variables to provide with the query
        // $codeSection - location of the code where this was called. Instead of using line numbers, I recommend using a
        //                generalized path. For example, ajax.php->DanDBList()->function header

        global $db;
        $comm = $db->prepare($query);
        if(!$comm) {
            reporterror($codeSection .'->DanDBList()', 'Statement prepare failed. Used query {'. $query .'} MySQL response: '.
                        mysqli_error($db));
            return null;
        }
        if($varList!=='') {
            if(!$comm->bind_param($varList, ...$vars)) {
                reporterror($codeSection .'->DanDBList()', 'Parameter binding failed. Used query {'. $query .'} & params '.
                            json_encode($vars) .'. Mysql says '. mysqli_error($db));
                return null;
            }
        }
        if(!$comm->execute()) {
            reporterror($codeSection .'->DanDBList()', 'Query execution failed. Used query {'. $query .'} & params '.
                        json_encode($vars) .'. Mysql says '. mysqli_error($db));
            return null;
        }
        $result = $comm->get_result();
        if(!$result) return []; // There was no data returned, so we are done here.

        $output = [];
        $content = $result->fetch_assoc();
        while($content) {
            array_push($output, $content);
            $content = $result->fetch_assoc();
        }
        return $output;
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

        global $db;

        // First, check that all the required parameters have been provided
        foreach($standards as $value) {
            if(!JSFind(array_keys($content), function($ele) use ($value) {
                return $ele==$value['name'];
            })) {
                if($value['required']) {
                    reporterror($callfrom .'->verifyInput()', 'Input error: parameter '. $value['name'] .' missing, required status='. $value['required']);
                    ajaxreject('missingfields', 'Input error: missing parameter {'. $value['name'] .'} All fields received = '.
                                                json_encode(array_keys($content)));
                }
            }
        }

        return JSMapWithKeys($content, function($ele, $key) use ($standards, $callfrom) {

            // Actually, we should be expecting the action keyword (but don't want to write that in every call to this function)
            if($key=='action') return ['action', $ele];
            
            // Start by getting the correct element from $standards. Note that any unneeded parameters will generate an error
            $params = JSFind($standards, function($tel) use ($key) {
                return ($tel['name']==$key);
            });
            if($params===null) {
                reporterror($callfrom .'->verifyInput()', 'Unexpected parameter = '. danescape($key) .'. IP='. $_SERVER['REMOTE_ADDR']);
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
                        return [danescape($key), 0];
                    }
                    return [danescape($key), ''];
                }
            }
            
            //Next, check the variable's format
            switch($params['format']) {
                case 'int': // accepts any whole number
                    if(!validInt($ele)) {
                        reporterror($callfrom .'->verifyInput()', 'Input error: Parameter '. danescape($key) .' is not an int. IP='.
                                    $_SERVER['REMOTE_ADDR']);
                        ajaxreject('badinput', 'Input error: parameter '. $key .' must be an int (got '. $ele .')');
                    }
                    return [danescape($key), intval(danescape($ele))];
                case 'posint': // accepts any whole number greater than zero. Good for ID fields, years, etc
                    if(!validInt($ele)) {
                        reporterror($callfrom .'->verifyInput()', 'Input error: Parameter '. danescape($key) .' is not an int. IP='.
                                    $_SERVER['REMOTE_ADDR']);
                        ajaxreject('badinput', 'Input error: parameter '. $key .' must be an int');
                    }
                    if($ele<0) {
                        reporterror($callfrom .'->verifyInput()', 'Input error: Parameter '. danescape($key) .' must be >0. IP='.
                                    $_SERVER['REMOTE_ADDR']);
                        ajaxreject('badinput', 'Input error: parameter '. $key .' must be positive');
                    }
                    return [danescape($key), intval(danescape($ele))];
                case 'float':
                    if(!validFloat($ele)) {
                        reporterror($callfrom .'->verifyInput()', 'Input error: Parameter '. danescape($key) .' is not a float. IP='.
                                    $_SERVER['REMOTE_ADDR']);
                        ajaxreject('badinput', 'Input error: parameter '. $key .' must be a float (got '. $ele .') (type'. gettype($ele) .')');
                    }
                    return [danescape($key), floatval(danescape($ele))];
                case 'string':
                    if(danescape($ele)!=$ele) {
                        reporterror($callfrom .'->verifyInput()', 'Input error: Parameter '. danescape($key) .
                                    ' is not equal after conversion. IP='. $_SERVER['REMOTE_ADDR']);
                        ajaxreject('badinput', 'Input error: parameter '. $key .' is not valid');
                    }
                    return [danescape($key), danescape($ele)];
                case 'stringnotempty':  // For any strings that must have content in them
                    if(danescape($ele)!=danescape($ele)) {
                        reporterror($callfrom .'->verifyInput()', 'Input error: Parameter '. danescape($key) .
                                    ' is not equal after conversion. IP='. $_SERVER['REMOTE_ADDR']);
                        ajaxreject('badinput', 'Input error: parameter '. $key .' is not valid');
                    }
                    if($ele=='') {
                        reporterror($callfrom .'->verifyInput()', 'Input error: Parameter '. danescape($key) .
                                    ' cannot be empty. IP='. $_SERVER['REMOTE_ADDR']);
                        ajaxreject('badinput', 'Input error: parameter '. $key .' cannot be empty');
                    }
                    return [danescape($key), danescape($ele)];
                case 'email': // For all email instances.  Email addresses have a lot of characters that aren't allowed, but must have
                              // an '@' and a '.'
                    if($ele=='') {
                        reporterror($callfrom .'->verifyInput()', 'Input error: Parameter '. danescape($key) .
                                    ' cannot be empty. IP='. $_SERVER['REMOTE_ADDR']);
                        ajaxreject('badinput', 'Input error: parameter '. $key .' cannot be empty');
                    }
                    if(danescape($ele)!=$ele) {
                        reporterror($callfrom .'->verifyInput()', 'Input error: Parameter '. danescape($key) .
                                    ' is not equal after conversion. IP='. $_SERVER['REMOTE_ADDR']);
                        ajaxreject('badinput', 'Input error: parameter '. $key .' is not valid');
                    }
                    // Now, check for invalid characters.
                    if(JSSome(str_split(' ~`!#$%^&*()+=[]{};:",<>?/|\'\\'), function($char) use ($ele) {
                        return (strpos($ele, $char)!==false);
                    })) {
                        reporterror($callfrom .'->verifyInput()', 'Input error: Parameter '. danescape($key) .
                                    ' is not a valid email address. IP='. $_SERVER['REMOTE_ADDR']);
                        ajaxreject('badinput', 'Input error: parameter '. $key .' must be an email');
                    }
                    
                    // We would check for an empty string, but checking for an @ or . will yield the same results
                    if( strpos($ele, '.')===false ||                    // email has a dot
                        strpos($ele, '.')===strlen($ele)-1 ||           // dot is not last character
                        strpos($ele, '.')===0 ||                        // dot is not first character
                        strpos($ele, '@')===false ||                    // email has an @
                        strpos($ele, '@')===strlen($ele)-1 ||           // @ is not last character
                        strpos($ele, '@')===0 ||                        // @ is not first character
                        strpos($ele, '@', strpos($ele, '@')+1)!=false ||  // email does not have two @
                        strpos($ele, '@.')!=false                       // domain of email does not start with .
                    ) {
                    //if((strpos($ele, '@') === false) || (strpos($ele, '.') === false)) {
                        reporterror($callfrom .'->verifyInput()', 'Input error: Parameter '. danescape($key) .
                                    ' is not a valid email address. IP='. $_SERVER['REMOTE_ADDR']);
                        ajaxreject('badinput', 'Input error: parameter '. $key .' must be an email');
                    }
                    return [danescape($key), danescape($ele)];

                case 'array':
                    // Here, the data is... a bit too complicated to manage here
                    // At least we can clarify the key
                    //reporterror('Debug in common.php->verifyInput(): array output is '. json_encode($ele));
                    return [danescape($key), $ele];

                case 'arrayOfInts':
                    // Here, we have an array, but all the data is only integers. I think we can manage it this time
                    return [danescape($key), array_map(function($mele) use ($key) {
                        if(!validInt($mele)) {
                            reporterror($callfrom .'->verifyInput()', 'Input error: Parameter '. $key .' is not an array of ints. IP='.
                                        $_SERVER['REMOTE_ADDR']);
                            ajaxreject('badinput', 'Input error: parameter '. $key .' must be an array of ints');
                        }
                        return $mele;
                    }, $ele)];

                case 'arrayOfStrings':
                    return [danescape($key), array_map(function($mele) use ($key) {
                        if(danescape($mele)!=$mele) {
                            reporterror($callfrom .'->verifyInput()', 'Input error: Parameter '. $key .' is not an array of strings. IP='.
                                        $_SERVER['REMOTE_ADDR']);
                            ajaxreject('badinput', 'Input error: parameter '. $key .' must be an array of strings');
                        }
                        return danescape($mele);
                    }, $ele)];
                
                default:
                    reporterror($callfrom .'->verifyInput()', 'Input error: Format type of '. $params['format'] .' not allowed');
                    ajaxreject('badinput', 'Error in verifyInput: format '. $params['format'] .' not yet supported');
            }
        }, $content);
    }
?>


