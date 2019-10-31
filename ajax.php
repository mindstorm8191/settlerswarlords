<?php
        // These are common library/packages I have available
    require_once("server/common.php");
    require_once("server/jsarray.php");
    require_once("server/globals.php");

        // All the project-specific includes
    require_once("server/mapbuilder.php");
    require_once("server/localMap.php");
    require_once("server/processEvents.php");
    
    $userid = 0;
    $accesscode = 0;
    header('Access-Control-Allow-Origin: http://localhost:3000');

    // Before starting, check the user's IP address to determine if they have triggered a block. IP blocks will only occur if a single user
    // posts more than 10 errors in 10 seconds
    $checkuser = danget("SELECT TIME_TO_SEC(TIMEDIFF(NOW(), lasterror)) AS secs FROM sw_usertracker WHERE ipaddress='".
                        $_SERVER['REMOTE_ADDR'] ."' AND blocktrigger=1;",
                        'ajax.php->check for ip block', true);
    if($checkuser) {
        // A valid return means this user has been blocked. We want to allow them to become unblocked after a full day. We can check that now
        if($checkuser['secs']>60*60*24) {
            // We can remove the block now
            danpost("UPDATE sw_usertracker SET blocktrigger=0 WHERE ipaddress='". $_SERVER['REMOTE_ADDR'] ."';",
                    'ajax.php->remove ip block');
        }
        ajaxreject('DB query failure', 'There was an error in your query. MySQL said: [ERROR] mysqld: Out of memory (needed 173 bytes)');
        // Note this will still trigger as the user's block gets cleared... this will just mess with the user more
    }

    // Getting content via javascript's fetch() command is a little more complex than jQuery's ajax() command.
    $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
    if($contentType!="text/plain;charset=UTF-8") {
        // This isn't valid data.  Return a basic error
        reporterror('in ajax.php: Content type received is not application/json. Content type provided={'. danescape($contentType) .'}');
        ajaxreject('noinput', 'Something is wrong with the request');
    }

    // Now process the raw post data
    $content = trim(file_get_contents("php://input"));
    $msg = json_decode($content, true);
    //If json decoding failed, the JSON is invalid
    if(!is_array($msg)) {
        if($_POST['action']!='') reporterror('in action.php: post[action]='. $_POST['action']);
        reporterror('in ajax.php: Message received is not an array. Data received={'. danescape($content) .'}');
        ajaxreject('noinput', 'message recieved is not an array');
    }

    // Now would be a good time to process any pending events we have
    processEvents();

    $WorldBiomes = ['grassland', 'forest', 'desert', 'swamp', 'water'];

    switch($msg['action']) {
        case "signup": // Handles allowing the user to sign up to the site.  It will set up a space in the map for the user to start playing on.
            $con = verifyInput($msg, [
                ["name"=>"username", "required"=>true, "format"=>"stringnotempty"],
                ["name"=>"password", "required"=>true, "format"=>"stringnotempty"],
                //["name"=>"pass2", "required"=>true, "format"=>"stringnotempty"],  we should be providing this, but we will add it later
                ["name"=>"email", "required"=>true, "format"=>"email"]
            ], 'ajax.php->case signup');

            // Make sure the user's two passwords match
            //if($con['password']!=$con['pass2']) ajaxreject('badinput', 'The passwords do not match');
            

            // Verify that the username or email does not exist already
            $existing = danqueryajax("SELECT * FROM sw_player WHERE name='". $con['username'] ."' OR email='". $con['email'] ."';",
                                     'ajax.php->case signup->check for existing name or email');
            if(sizeof($existing)!=0) {
                if($existing[0]['name']==$con['username']) {
                    ajaxreject('claimedname', 'Sorry, this user name has already been registered');
                }
                ajaxreject('claimedemail', 'Sorry, this email has already been registered');
            }

            // Now we are ready to create the user
            srand(time());
            $accesscode = rand(0, pow(2, 31));
            $emailcode = rand(0, pow(2, 31));
            // There's quite a bit more to consider when creating a new user.  Firstly, we need to ensure a map has been generated for this. If
            // not, we will need to build one.
            // We can check for the existance of a map by trying to select any square of the map

            $playerlevel = 0;
            $playermode = 0;
            $playercount = 0;
            if(sizeof(danqueryajax("SELECT * FROM sw_map LIMIT 1;", 'ajax.php->case signup->check for working map'))==0) {
                // We don't have any map as of yet. We need to generate one now.
                generatemap();
                // We would set up our global variables here, but with setGlobal(), it will generate when needed. We can use the starting values
                // above
            }else{
                $playerlevel = getGlobal("newplayerlevel");
                $playermode = getGlobal("newplayermode");
                $playercount = getGlobal("newplayercount");
            }
            $out = cityLocation($playerlevel, $playermode, $playercount);

            // I think we should be ready to generate this user now
            danpost("INSERT INTO sw_player (name, password, email, ajaxcode, ipaddress, lastlogin, currentx, currenty) VALUES ('".
                    $con['username'] ."','". $con['password'] ."','". $con['email'] ."',". $accesscode .",'". $_SERVER['REMOTE_ADDR'] .
                    "',NOW(),". $out['x'] .",". $out['y'] .");",
                    'ajax.php->case signup->create user');
            $uid = mysqli_insert_id($db);

            // We also need to update the map location to show that the user has this land
            danpost("UPDATE sw_map SET owner=". $uid .", population=4 WHERE x=". $out['x'] ." AND y=". $out['y'] .";",
                    'ajax.php->case signup->update map');
            // We should go ahead and update this user's known map now
            updateknownmap($uid, $out['x'], $out['y']);

            // Now, ensure that the minimap for this location exists. We have a function to check if it exists, and generate it if it doesn't
            // No need to check things here!
            ensureMinimapXY($out['x'], $out['y']);

            // Now that the minimap has been created, we need to create a data feed, to show all the tiles here
            // This should be all the common content we need. Now reply to the user, feeding them the minimap data
            die(json_encode([
                "result"=>"success",
                "userid"=>$uid,
                "access"=>$accesscode,
                "mapcontent"=>loadLocalMapXY($out['x'], $out['y']),
                "buildoptions"=>loadBuildOptions(0)
            ]));
        break;

        case 'login':
            //reporterror('Debug in ajax.php->case login: process started');
            $con = verifyInput($msg, [
                ['name'=>'username', 'required'=>true, 'format'=>'stringnotempty'],
                ['name'=>'password', 'required'=>true, 'format'=>'stringnotempty']
            ], 'ajax.php->case login');

            $player = danget("SELECT * FROM sw_player WHERE name='". $con['username'] ."';",
                             'ajax.php->case login->get player info', true);
            if(!$player) ajaxreject('invaliduser', 'Sorry, that username does not exist. Please try again');
            if($player['password']!=$con['password']) ajaxreject('invalidpass', 'Sorry, your password did not work. Please try again');

            // Before continuing with the output, we should update this user's information
            srand(time());
            $accesscode = rand(0, pow(2, 31));
            danpost("UPDATE sw_player SET ipaddress='". $_SERVER['REMOTE_ADDR'] ."', ajaxcode=". $accesscode .", lastlogin=NOW() WHERE id=".
                    $player['id'] .";",
                    'ajax.php->case login->update player info');
            
            // Beyond game data, we are ready to send a success response to the user. For game data, we have a function to provide
            // all the local map content.
            die(json_encode([
                "result"=>"success",
                "userid"=>$player['id'],
                "access"=>$accesscode, // this is the updated code, not the old one
                "mapcontent"=>loadLocalMapXY($player['currentx'], $player['currenty']),
                "buildoptions"=>loadBuildOptions(0)
            ]));
        break;

        case 'getworldmap':
            // This allows the user to view the world - as they know it. Players will only know their own territory, starting out,
            // but will be allowed to explore any neighboring lands, provided they are not guarded

            // Start by verifying the user's input
            $con = verifyInput($msg, [
                ['name'=>'userid', 'required'=>true, 'format'=>'int'],
                ['name'=>'access', 'required'=>true, 'format'=>'int']
            ], 'ajax.php->case getworldmap');

            // Beyond the userid value, we don't really need any input here.
            // The known map should already be generated (and updated) by the player's actions. We can simply send them a feed from the
            // database
            $user = danget("SELECT * FROM sw_player WHERE id=". $con['userid'] .";",
                           'ajax.php->case getworldmap->get user data');
            
            // While we're here, we might as well update the known map with the player's current coordinates
            updateknownmap($user['id'], $user['currentx'], $user['currenty']);
            $worldmap = danqueryajax("SELECT sw_knownmap.*, sw_map.biome AS biome FROM sw_knownmap INNER JOIN sw_map WHERE ".
                                     "sw_knownmap.x=sw_map.x AND sw_knownmap.y=sw_map.y AND sw_knownmap.playerid=". $con['userid'] .";",
                                     'ajax.php->case getworldmap->send knownmap collection');
            //reporterror("Debugging in ajax.php->case getworldmap: map data sent is ". json_encode($worldmap));

            die(json_encode([
                'result'=>'success',
                'currentx'=>$user['currentx'],
                'currenty'=>$user['currenty'],
                    // remember, map is a javascript keyword.... let's not confuse it
                'worldmap'=>$worldmap
            ]));
        break;

        case 'doaction':
            // Allows the player to do a specific action
            // Start by checking the input
            $con = verifyInput($msg, [
                ["name"=>"userid", "required"=>true, 'format'=>'posint'],
                ['name'=>'access', 'required'=>true, 'format'=>'int'],
                ['name'=>'command', 'required'=>true, 'format'=>'stringnotempty'],
                ['name'=>'x', 'required'=>true, 'format'=>'int'],
                ['name'=>'y', 'required'=>true, 'format'=>'int'],
                ['name'=>'numtroops', 'required'=>false, 'format'=>'int']
            ], 'ajax.php->case doaction');
            verifyUser($con);
            
            // Now, determine what the user is trying to do
            switch($con['command']) {
                case 'expedition':

                    $mapid = danget("SELECT id FROM sw_map WHERE x=". $con['x'] ." AND y=". $con['y'] .";",
                    'ajax.php->case doaction->case explore->get map id')['id'];
                    // The player is sending explorers to check out a new land. Our primary task here is to create an event, which will
                    // let us update the player's map later. Our only hold-back is to determine if the current location is where the
                    // player is located. This would be a concerning error

                    $playerpos = danget("SELECT currentx, currenty FROM sw_player WHERE id=". $userid .";",
                                        'ajax.php->case doaction->case explore->check current location');
                    if(($con['x']==$playerpos['currentx']) && ($con['y']==$playerpos['currenty'])) {
                        reporterror('User error in ajax.php->case doaction->case explore: player trying to explore the location they are at. '.
                                    'Userid='. $userid .', IP='. $_SERVER['REMOTE_ADDR']);
                        ajaxreject('badinput', 'You are currently at this location');
                    }

                    // Now we can create the event
                    danpost("INSERT INTO sw_event (player, mapid, task, endtime) VALUES (". $userid .",". $mapid .
                            ",'explore', DATE_ADD(NOW(), INTERVAL 5 MINUTE));",
                            'ajax.php->case doaction->case explore->create event');
                    
                    // With that done, now we can notify the user. I'm not sure what to send yet... but we need to send something. We
                    // can expand this later
                    die(json_encode([
                        'result'=>'success'
                    ]));
                break;

                default:
                    // The user provided an action we dont' have.
                    reporterror('Error in ajax.php->case doation: action type of '. $con['command'] .' not yet supported');
                    ajaxreject('badinput', 'The action provided ('. $con['command'] .') is not yet supported.');
                break;
            }
        break;
        
        case 'addbuilding':
            // Allows the user to add a building to the map where they are located.

            // Start by verifying input. For world map x & y, we will assume the user's current location
            $con = verifyInput($msg, [
                ["name"=>"userid", "required"=>true, 'format'=>'posint'],
                ['name'=>'access', 'required'=>true, 'format'=>'int'],
                ['name'=>'name', 'required'=>true, 'format'=>'stringnotempty'],
                ['name'=>'localx', 'required'=>true, 'format'=>'posint'],
                ['name'=>'localy', 'required'=>true, 'format'=>'posint']
            ], 'ajax.php->case addbuilding');
            verifyUser($con);

            // Now, get the user's X & Y world coordinates
            $playerpos = danget("SELECT currentx, currenty FROM sw_player WHERE id=". $userid .";",
                                'ajax.php->case addbuilding->get players current location');
            
            // Verify that this user owns this land
            $worldmapsquare = danget("SELECT id, owner FROM sw_map WHERE x=". $playerpos['currentx'] ." AND y=". $playerpos['currenty'] .';',
                                     'ajax.php->case addbuilding->get world map information');
            if($worldmapsquare['owner']!=$userid) ajaxreject('badinput', 'The player does not have ownership of this land');

            // Next, verify that there's no (blocking) structure at this location on the local map
            $localmapsquare = danget("SELECT * FROM sw_minimap WHERE mapid=". $worldmapsquare['id'] ." AND x=". $con['localx'] .
                                     " AND y=". $con['localy'] .";",
                                     'ajax.php->case addbuilding->get local map information');
            if($localmapsquare['buildid']!=0) {
                // Later on, we will check what type of building exists here, before rejecting. For now, simply reject out-right
                ajaxreject('badinput', 'There is already a building at this location');
            }

            // Now, before we can add this building to the map, we first need to generate a record for it. Before we can build it,
            // collect the information about this building type.
            $buildType = danget("SELECT * FROM sw_structuretype WHERE name='". $con['name'] ."';",
                                'ajax.php->case addbuilding->get building type details', true);
            if(!$buildType) ajaxreject('badinput', 'Error: structure type of '. $con['name'] .' does not exist');

            // At this point, we need to determine what resources need to be consumed, before this building can be completed.
            // We may also need to determine how much time the construction fo this building will take.
            // However, we don't have any buildings needing either of those things yet.

            if($buildType['buildtime']==0) {
                // We can go ahead and have this building added now.  Check for resource needs.
                // We don't (yet) have a way to verify resource needs, or where to find resources

                // We are set to build this building.
                danpost("INSERT INTO sw_structure (buildtype, devlevel, fortlevel, worldmapid, localx, localy, detail) VALUES (".
                        $buildType['id'] .",1,1,". $worldmapsquare['id'] .",". $localmapsquare['x'] .",". $localmapsquare['y'] .",'');",
                        'ajax.php->case addbuilding->create structure with no buildtime or needs');
                $structureId = mysqli_insert_id($db);
                danpost("UPDATE sw_minimap SET buildid=". $structureId ." WHERE mapid=". $worldmapsquare['id'] ." AND x=".
                        $localmapsquare['x'] ." AND y=". $localmapsquare['y'] .";",
                        'ajax.php->case addbuilding->add building to local map');
                
                // We are ready to send a response to the user. We want to allow the given block to be updated with information about the ne
                // building, as though it was provided when initially loading the page
                die(json_encode([
                    "result"=>"success",
                    "newmaptile"=>[
                        "mapid"=>$localmapsquare['mapid'],
                        "x"=>$localmapsquare['x'],
                        "y"=>$localmapsquare['y'],
                        "landtype"=>$localmapsquare['landtype'],
                        "buildid"=>$structureId,
                        "buildtype"=>$buildType['id'],
                        "devlevel"=>1,
                        "fortlevel"=>1,
                        "detail"=>'',
                        "workersassigned"=>0,
                        "assigned"=>'',
                        "name"=>$buildType['name'],
                        "image"=>$buildType['image'],
                        "minworkers"=>$buildType['minworkers'],
                        "maxworkers"=>$buildType['maxworkers'],
                        "workerbonus"=>$buildType['workerbonus'],
                        "resourcesUsed"=>$buildType['resourcesUsed'],
                        "output"=>$buildType['output'],
                        "description"=>$buildType['description']
                    ]
                ]));
            }
        break;

        case 'startAction':
            // This allows the user to have a specific building start an action.

            // We don't currently have this working yet, but should probably send a response
            ajaxreject('othererror', 'You have reached the end of the current development. Try again later');
        break;

        case 'reporterror':
            // This allows the client side to report errors to the server, whether they be communication failures or errors / debugging on
            // the client side that need to be corrected

            $con = verifyInput($msg, array(
                array("name"=>"msg", "required"=>true, "format"=>"string")
            ), 'ajax.php->case reporterror');

            // Before generating this error, we need to determine if this user has generated too many errors in the last minute. We have created
            // a table specifically for that.
            $record = danget("SELECT errorcount, TIME_TO_SEC(TIMEDIFF(NOW(), lasterror)) AS secs FROM sw_usertracker WHERE ipaddress='".
                             $_SERVER['REMOTE_ADDR'] ."';",
                            'ajax.php->case reporterror->get usertracker record', true);
            if(!$record) {
                // We do not yet have a record of this user reporting an error. We should add them now.
                danpost("INSERT INTO sw_usertracker (ipaddress, lasterror, errorcount) VALUES ('". $_SERVER['REMOTE_ADDR'] ."', NOW(), 1);",
                        'ajax.php->case reporterror->add ip to user tracker');
            }else{
                if($record['secs']>10) {
                    // The last error was more than 10 seconds ago. This should be fine. We should still update the existing record for this
                    danpost("UPDATE sw_usertracker SET lasterror=NOW(), errorcount=1 WHERE ipaddress='". $_SERVER['REMOTE_ADDR'] ."';",
                            'ajax.php->case reporterror->update usertracker it was old');
                }else{
                    if($record['errorcount']<10) {
                        // This user has posted a few errors here already. A couple should be fine. Update the count of errors for this user
                        danpost("UPDATE sw_usertracker SET errorcount=errorcount+1 WHERE ipaddress='". $_SERVER['REMOTE_ADDR'] ."';",
                                'ajax.php->case reporterror->update usertracker error count');
                    }else{
                        // This user has posted more than 10 errors in the last 10 seconds. This is highly suspicious.
                        danpost("UPDATE sw_usertracker SET blocktrigger=1 WHERE ipaddress='". $_SERVER['REMOTE_ADDR'] ."';",
                                'ajax.php->case reporterror->update usertracker set block');
                        reporterror('User block has been triggered. Userip='. $_SERVER['REMOTE_ADDR']);
                        ajaxreject('DB query failure', 'There was an error in your query. MySQL said: [ERROR] mysqld: Out of memory (needed 173 bytes)');
                    }
                }
            }
            // With usage tracking for this taken care of, we are now safe to post the message.
            reporterror('Client reports error: '. $con['msg']);
            die(json_encode(array("result"=>"success"))); // We should have some form of response for this
        break;
    }
?>