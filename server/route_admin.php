<?php
    /* route_admin.php
    Handles all operations performed by admins
    For the game Settlers & Warlords

    The admin section here is still used for 'constructing' new building types. While I am now able to manually build in new buildings
    and their processes, doing so can be prone to errors in the data (building error-free JSON content by hand isn't easy).
    */

    function admin_onLogin($player, $access) {
        // Handles building a response for the user after they have logged in (manually or automatically)

        // Note that there is no way for an admin to sign up to the game. For new users to be generated, they have to sign up as a user.
        // Then, the user record has to be edited in the database to make this an admin.

        // Start with gathering a buildings list
        $buildings = DanDBList("SELECT * FROM sw_structuretype;", '', [], 'server/route_admin.php->admin_onLogin()->get all buildings');
        // While this is useful, it puts all buildings of the same level in a single array. We need to group these buildings
        // into the same set, with level-specific attributes in an extra array layer

        $ordered = splitArray($buildings, 'name');
        // This would end up sending common fields like description and landType in each of the records. We can organize things better
        $layerOne = [];
        foreach($ordered as &$ele) {
            $name = $ele[0]['name'];
            $desc = $ele[0]['description'];
            $land = $ele[0]['landtype'];
            unset($ele[0]['name']);
            unset($ele[0]['description']);
            unset($ele[0]['landtype']);

            // We also need information from the actions for this building
            $actions = DanDBList("SELECT * FROM sw_structureaction WHERE buildType=?;", 'i', [$ele[0]['id']],
                                 'server/route_admin.php->admin_onLogin()->get actions for building');
            // For actions that have items, turn each into a structure, for easier management on the front end
            foreach($actions as &$act) {
                $act['inputGroup'] = ($act['inputGroup']==='')?null:json_decode($act['inputGroup'], true);
                $act['outputGroup'] = ($act['outputGroup']==='')?null:json_decode($act['outputGroup'], true);
                // That's much less database-heavy than the last design...
            }

            // Combine everything into one functional structure
            array_push($layerOne, ['name'=>$name, 'description'=>$desc, 'landtype'=>$land, 'levels'=>$ele, 'actions'=>$actions]);
        }
        
        // This should be sufficient enough to send to the user; we can have more data provided later
        die(json_encode([
            'result'=>'success',
            'userid'=>$player['id'],
            'access'=>$access,
            'userType'=>'admin',
            'buildings'=>$layerOne
        ]));
    }

    function route_adminAddBuildingAction($msg) {
        // Allows the admin to add a new action for a specific building.
        // This includes only the name, everything else is set to default values

        global $userid;
        $con = verifyInput($msg, [
            ["name"=>"userid", "required"=>true, 'format'=>'posint'],
            ['name'=>'access', 'required'=>true, 'format'=>'int'],
            ['name'=>'buildname', 'required'=>true, 'format'=>'stringnotempty'],
            ['name'=>'actionname', 'required'=>true, 'format'=>'stringnotempty']
        ], 'server/route_admin.php->route_adminAddBuildingAction()->verify input');
        verifyUser($con);

        // Also verify that this user is an admin
        if(DanDBList("SELECT userType FROM sw_player WHERE id=?;", 'i', [$userid],
                     'server/route_Admin.php->route_admin_addBuildingAction()->verify user is admin')[0]['userType']!=1)
            ajaxreject('badinput', 'You must be an admin to run this command');
        
        // The front end doesn't have building ID's, but we can find it based on the name. This will also verify we have a valid building type
        $result = DanDBList("SELECT * FROM sw_structuretype WHERE name=?;", 's', [$con['buildname']],
                            'server/route_admin.php->route_adminAddBuildingAction()->verify building by name');
        if(sizeof($result)===0) ajaxreject('badinput', 'The building by that name doesn\'t exist');
        $building = $result[0];

        // Create the action
        DanDBList("INSERT INTO sw_structureaction (buildType,name) VALUES (?,?);", 'is', [$building['id'], $con['actionname']],
                  'server/route_admin.php->route_adminAddBuildingAction()->add new action');
        
        // With the action created, we don't really need to do anything else on this end
        // Send a success response to the user
        die(json_encode(['result'=>'success']));
    }

    function route_adminChangeActionItem($msg) {
        // Allows the admin to change information about an item

        global $userid;
        // We were going to have to process name and items in different routes, but there's no reason we can't check data before trying
        // to verify it
        $valueFormat = 'stringnotempty'; if($msg['part']==='amount') $valueFormat = 'int';
        $con = verifyInput($msg, [
            ["name"=>"userid", "required"=>true, "format"=>"posint"],
            ["name"=>"access", "required"=>true, "format"=>"int"],
            ["name"=>"buildname", "required"=>true, "format"=>"stringnotempty"],
            ["name"=>"actionname", "required"=>true, "format"=>"stringnotempty"],
            ["name"=>"side", "required"=>true, "format"=>"stringnotempty"],
            ["name"=>"part", "required"=>true, "format"=>"stringnotempty"],
            ["name"=>"name", "required"=>true, "format"=>"stringnotempty"],
            ["name"=>"newvalue", "required"=>true, "format"=>$valueFormat]
        ], 'server/route_admin.php->route_adminChangeActionItem()->verify inputs');
        verifyUser($con);

        // Also verify this is an admin
        if(DanDBList("SELECT userType FROM sw_player WHERE id=?;", 'i', [$userid],
                     'server/route_admin.php->route_adminChangeActionItem()->verify user is admin')[0]['userType']!=1)
            ajaxreject('badinput', 'You must be an admin to run this command');
        
        // Use the building name to get its ID
        $result = DanDBList("SELECT id FROM sw_structuretype WHERE name=?;", 's', [$con['buildname']],
                            'server/route_admin.php->route_adminChangeActionItem()->get building id');
        if(sizeof($result)==0) ajaxreject('badinput', 'Building type '. $con['buildname'] .' not found');
        $buildID = $result[0]['id'];

        // With the ID, we can fetch the action name, making sure it's for the correct building
        $result = DanDBList("SELECT inputGroup, outputGroup FROM sw_structureaction WHERE name=? AND buildType=?;", 'si',
                            [$con['actionname'], $buildID], 'server/route_admin.php->route_adminChangeActionItem()->get action details');
        if(sizeof($result)==0) ajaxreject('badinput', 'Action type '. $con['actionname'] .' not found or not for building '. $con['buildname']);

        /*reporterror('server/route_admin.php->route_adminChangeActionItem()->start grunt work',
                    'debugging: buildID='. $buildID .', action='. $con['actionname']);//*/

        // 'Open' the JSON content so we can edit the items, then find the item and make the necessary changes
        $itemsList = json_decode($result[0][($con['side']==='input')?'inputGroup':'outputGroup'], true);
        $itemsList = array_map(function($item) use ($con) {
            if($item['name']===$con['name']) {
                // This is the item we need to edit
                if($con['part']==='name') {
                    $item['name'] = $con['newvalue'];
                }else{
                    $item['amount'] = $con['newvalue'];
                }
            }
            return $item;
        }, $itemsList);

        // Save the updated items list to the database
        DanDBList("UPDATE sw_structureaction SET ". (($con['side']==='input')?'inputGroup':'outputGroup') ."=? WHERE name=? AND buildType=?;",
                  'ssi', [json_encode($itemsList), $con['actionname'], $buildID],
                  'server/route_admin.php->route_adminChangeActionItem()->save action details');
        
        // Send a success message to the client
        die(json_encode(['result'=>'success']));
    }

    function route_adminNewActionItem($msg) {
        // Allows the admin to add a new item to an existing action

        global $userid;
        $con = verifyInput($msg, [
            ['name'=>'userid', 'required'=>true, 'format'=>'posint'],
            ['name'=>'access', 'required'=>true, 'format'=>'int'],
            ['name'=>'buildname', 'required'=>true, 'format'=>'stringnotempty'],
            ['name'=>'actionname', 'required'=>true, 'format'=>'stringnotempty'],
            ['name'=>'side', 'required'=>true, 'format'=>'stringnotempty'],
            ['name'=>'name', 'required'=>true, 'format'=>'stringnotempty'],
            ['name'=>'amount', 'required'=>true, 'format'=>'posint']
        ], 'server/route_admin.php->route_adminNewActionItem()->verify inputs');
        verifyUser($con);

        // Also verify that this user is an admin
        if(DanDBList("SELECT userType FROM sw_player WHERE id=?;", 'i', [$userid],
                     'server/route_Admin.php->route_admin_addBuildingAction()->verify user is admin')[0]['userType']!=1)
            ajaxreject('badinput', 'You must be an admin to run this command');
        
        // Use the building name to get its ID. We'll need this to load the action
        $result = DanDBList("SELECT id FROM sw_structuretype WHERE name=?;", 's', [$con['buildname']],
                            'server/route_admin.php->route_adminChangeActionItem()->get building id');
        if(sizeof($result)==0) ajaxreject('badinput', 'Building type '. $con['buildname'] .' not found');
        $buildID = $result[0]['id'];

        // With the ID, we can fetch the action name, making sure it's for the correct building
        $result = DanDBList("SELECT inputGroup, outputGroup FROM sw_structureaction WHERE name=? AND buildType=?;", 'si',
                            [$con['actionname'], $buildID], 'server/route_admin.php->route_adminChangeActionItem()->get action details');
        if(sizeof($result)==0) ajaxreject('badinput', 'Action type '. $con['actionname'] .' not found or not for building '. $con['buildname']);

        // 'Open' the JSON content so we can edit the items, then find the item and make the necessary changes. Note that we may have
        // an empty list here
        $itemsList = [];
        if($result[0][($con['side']==='input')?'inputGroup':'outputGroup']!=='') {
            $itemsList = json_decode($result[0][($con['side']==='input')?'inputGroup':'outputGroup'], true);
        }
        // This task is just appending to our list
        array_push($itemsList, ['name'=>$con['name'], 'amount'=>$con['amount'], 'isFood'=>0]);

        // Save the data back to the database
        DanDBList("UPDATE sw_structureaction SET ". (($con['side']==='input')?'inputGroup':'outputGroup') ."=? WHERE name=? AND buildType=?;",
                  'ssi', [json_encode($itemsList), $con['actionname'], $buildID],
                  'server/route_admin.php->route_adminChangeActionItem()->save action details');
        
        // Send a success message to the client
        die(json_encode(['result'=>'success']));
    }
?>