<?php
    /*  route_localMap.php
        Handles all client commands related to the user's local map
        for the game Settles & Warlords
    */

    function route_saveLocalMap($msg) {
        // Allows the user to save the local map content to the server, for accessing later. This may be triggered automatically by the client code

        global $userid;

        // Start sanitizing input data. This will be the first layer, of course. The blocks will (each) need their own sanitization code
        $con = verifyInput($msg, [
            ['name'=>'userid', 'required'=>true, 'format'=>'posint'],
            ['name'=>'access', 'required'=>true, 'format'=>'int'],
            ['name'=>'blocks',        'required'=>true, 'format'=>'array'],
            ['name'=>'unlockedItems', 'required'=>true, 'format'=>'array'],
            ['name'=>'allItems',      'required'=>true, 'format'=>'array'],
            ['name'=>'foodCounter',   'required'=>true, 'format'=>'int']
        ], 'server/route_localMap.php->route_saveLocalMap()->verify input');
        verifyUser($con);

        // Since all block types have some of the same fields, we will create a structure to pass to each one
        $blockBasics = [
            ['name'=>'id', 'required'=>true, 'format'=>'posint'],
            ['name'=>'name', 'required'=>true, 'format'=>'stringnotempty'],
            ['name'=>'x', 'required'=>true, 'format'=>'int'],
            ['name'=>'y', 'required'=>true, 'format'=>'int'],
        ];

        if(!JSEvery($con['blocks'], function($ele) use ($blockBasics) {
            // Now, each block type will have a different set of variables included, some arrays as well
            if(!isset($ele['name'])) {
                reporterror('server/route_localMap.php->route_saveLocalMap()->verify blocks list', 'Found block that does not have a name');
                return false;
            }
            switch($ele['name']) {
                case 'Lean-To':
                    // Since verifyInput will terminate if it fails, we don't really need to return a value here
                    verifyInput($ele, array_merge($blockBasics, [
                        ['name'=>'priority', 'required'=>true, 'format'=>'posint'],
                        ['name'=>'mode',     'required'=>true, 'format'=>'int'],
                        ['name'=>'progress', 'required'=>true, 'format'=>'int']
                    ]), 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case leanto');
                    return true;
                case 'Forage Post':
                    verifyInput($ele, array_merge($blockBasics, [
                        ['name'=>'priority', 'required'=>true, 'format'=>'posint'],
                        ['name'=>'progress', 'required'=>true, 'format'=>'int'],
                        ['name'=>'items',    'required'=>true, 'format'=>'array']  // array is actually skipped, so we'll need to scan this directly
                    ]), 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case forage post');
                    verifyItems($ele['items'], 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case forage post');
                    return true;
                case 'Rock Knapper':
                    verifyInput($ele, array_merge($blockBasics, [
                        ['name'=>'priority',     'required'=>true, 'format'=>'posint'],
                        ['name'=>'progress',     'required'=>true, 'format'=>'int'],
                        ['name'=>'items',        'required'=>true, 'format'=>'array'],  // array is actually skipped, so we'll need to scan this directly
                        ['name'=>'currentCraft', 'required'=>true, 'format'=>'string'],
                        ['name'=>'nextCraft',    'required'=>true, 'format'=>'string']
                    ]), 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case rock knapper');
                    verifyItems($ele['items'], 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case rock knapper');
                    return true;
                case 'Toolbox':
                    verifyInput($ele, array_merge($blockBasics, [
                        ['name'=>'priority',       'required'=>true, 'format'=>'posint'],
                        ['name'=>'targetId',       'required'=>true, 'format'=>'int'],
                        ['name'=>'carrying',       'required'=>true, 'format'=>($ele['carrying']==='none')?'string':'array'],
                        ['name'=>'mode',           'required'=>true, 'format'=>'stringnotempty'],
                        ['name'=>'travelCounter',  'required'=>true, 'format'=>'int'],
                        ['name'=>'travelDistance',  'required'=>true, 'format'=>'posint'],
                        ['name'=>'travelDirection', 'required'=>true, 'format'=>'int'],
                        ['name'=>'curImage',        'required'=>true, 'format'=>'string'],
                        ['name'=>'items',           'required'=>true, 'format'=>'array']
                    ]), 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case toolbox');
                    verifyItems($ele['items'], 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case toolbox');
                    if($ele['carrying']!=='none') verifyItems([$ele['carrying']], 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case toolbox (carrying)');
                    return true;
                case 'Stick Maker':
                    verifyInput($ele, array_merge($blockBasics, [
                        ['name'=>'priority',     'required'=>true, 'format'=>'posint'],
                        ['name'=>'progress',     'required'=>true, 'format'=>'int'],
                        ['name'=>'items',        'required'=>true, 'format'=>'array'],
                        ['name'=>'currentCraft', 'required'=>true, 'format'=>'string'],
                        ['name'=>'nextCraft',    'required'=>true, 'format'=>'string'],
                        ['name'=>'tools',        'required'=>true, 'format'=>'array']
                    ]), 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case stickmaker');
                    verifyItems($ele['items'], 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case stickmaker');
                    verifyTools($ele['tools'], 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case stickmaker');
                    return true;
                case 'Twine Maker': // uses tools but does not have selectable crafting
                    verifyInput($ele, array_merge($blockBasics, [
                        ['name'=>'priority', 'required'=>true, 'format'=>'posint'],
                        ['name'=>'progress', 'required'=>true, 'format'=>'int'],
                        ['name'=>'items',    'required'=>true, 'format'=>'array'],
                        ['name'=>'tools',    'required'=>true, 'format'=>'array']
                    ]), 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case twinemaker');
                    verifyItems($ele['items'], 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case twinemaker');
                    verifyTools($ele['tools'], 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case twinemaker');
                    return true;
                case 'Flint Tool Maker': // has selectable crafting, and inputs
                    verifyInput($ele, array_merge($blockBasics, [
                        ['name'=>'priority',     'required'=>true, 'format'=>'posint'],
                        ['name'=>'progress',     'required'=>true, 'format'=>'int'],
                        ['name'=>'items',        'required'=>true, 'format'=>'array'],
                        ['name'=>'currentCraft', 'required'=>true, 'format'=>'string'],
                        ['name'=>'nextCraft',    'required'=>true, 'format'=>'string'],
                        ['name'=>'inputs',       'required'=>true, 'format'=>'array']
                    ]), 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case flinttoolmaker');
                    verifyItems($ele['items'], 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case flint tool maker (output)');
                    verifyItems($ele['inputs'], 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case flint tool maker (input)');
                    return true;
                case 'Hunting Post':
                    verifyInput($ele, array_merge($blockBasics, [
                        ['name'=>'priority', 'required'=>true, 'format'=>'posint'],
                        ['name'=>'progress', 'required'=>true, 'format'=>'int'],
                        ['name'=>'items',    'required'=>true, 'format'=>'array'],
                        ['name'=>'tools',    'required'=>true, 'format'=>'array']
                    ]), 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case huntingpost');
                    verifyItems($ele['items'], 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case hunting post');
                    verifyTools($ele['tools'], 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case hunting post');
                    return true;
                case 'Butcher Shop': // uses tools plus in & out items
                    verifyInput($ele, array_merge($blockBasics, [
                        ['name'=>'priority', 'required'=>true, 'format'=>'posint'],
                        ['name'=>'progress', 'required'=>true, 'format'=>'int'],
                        ['name'=>'items',    'required'=>true, 'format'=>'array'],
                        ['name'=>'inputs',   'required'=>true, 'format'=>'array'],
                        ['name'=>'tools',    'required'=>true, 'format'=>'array']
                    ]), 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case butchershop');
                    verifyItems($ele['items'], 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case butcher shop (output)');
                    verifyItems($ele['inputs'], 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case butcher shop (input)');
                    verifyTools($ele['tools'], 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case butcher shop');
                    return true;
                case 'Firewood Maker': // Collects loose dead wood for fires
                    verifyInput($ele, array_merge($blockBasics, [
                        ['name'=>'priority', 'required'=>true, 'format'=>'posint'],
                        ['name'=>'progress', 'required'=>true, 'format'=>'int'],
                        ['name'=>'items',    'required'=>true, 'format'=>'array'],
                    ]), 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case Firewood Maker');
                    verifyItems($ele['items'], 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case firewood maker');
                    return true;
                case 'Campfire': // Cooks foods (mostly meats)
                    verifyInput($ele, array_merge($blockBasics, [
                        ['name'=>'priority', 'required'=>true, 'format'=>'posint'],
                        ['name'=>'progress', 'required'=>true, 'format'=>'int'],
                        ['name'=>'inFuel',   'required'=>true, 'format'=>'array'],
                        ['name'=>'inItems',      'required'=>true, 'format'=>'array'],
                        ['name'=>'items',        'required'=>true, 'format'=>'array'],
                        ['name'=>'overFire',     'required'=>true, 'format'=>($ele['overFire']==='none')?'string':'array'],
                        ['name'=>'cookProgress', 'required'=>true, 'format'=>'float'],
                        ['name'=>'fireTemp',     'required'=>true, 'format'=>'float'],
                        ['name'=>'fuelTime',     'required'=>true, 'format'=>'float'],
                        ['name'=>'fuelBoost',    'required'=>true, 'format'=>'float']
                    ]), 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case Campfire');
                    if($ele['overFire']!=='none') verifyItems([$ele['overFire']], 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case campfire (over fire)');
                    verifyItems($ele['inFuel'], 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case campfire (fuel)');
                    verifyItems($ele['inItems'], 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case campfire (inputs)');
                    verifyItems($ele['items'], 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case campfire (outputs)');
                    return true;
                case 'Hauler':
                    verifyInput($ele, array_merge($blockBasics, [
                        ['name'=>'priority', 'required'=>true, 'format'=>'posint'],
                        ['name'=>'mode',       'required'=>true, 'format'=>'stringnotempty'],
                        ['name'=>'carrying',   'required'=>true, 'format'=>($ele['carrying']==='none')?'string':'array'],
                        ['name'=>'receivedId', 'required'=>true, 'format'=>'int'],
                        ['name'=>'targetList', 'required'=>true, 'format'=>'array']
                    ]), 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case Hauler');
                    if($ele['carrying']!=='none') verifyItems([$ele['carrying']], 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case hauler (carrying)');
                    // Managing the targetList will be a little different
                    if(sizeof($ele['targetList'])===0) return true;
                    return JSEvery($ele['targetList'], function($inner) {
                        verifyInput($inner, [
                            ['name'=>'sourId', 'required'=>true, 'format'=>'posint'],
                            ['name'=>'destId', 'required'=>true, 'format'=>'posint'],
                            ['name'=>'itemName', 'required'=>true, 'format'=>'stringnotempty']
                        ], 'server/route_localMap.php->route_saveLocalMap()->verify blocks->case Hauler targetList');
                    });
                default:
                    reporterror('server/route_localMap.php->route_saveLocalMap->verify blocks list', 'Building type '. $ele['name'] .' not supported');
                    ajaxreject('badinput', 'Building type '. $ele['name'] .' not supported');
                break;
            }
        })) {
            // At least one block did not pass the sanitization test
            // Buuuut if something fails, verifyInput() will use ajaxreject, so this will never be reached anyway. Oh well
        }

        // We also need to check that each of the item names in the unlockedItems are valid
        if(sizeof($con['unlockedItems'])!==0) {
            if(!JSEvery($con['unlockedItems'], function($ele) {
                return $ele===danescape($ele);
            })) {
                ajaxreject('badinput', 'Input error: parameter unlockedItems is not valid');
            }
        }

        // Do the same with the allItems list. This isn't actually items anymore, merely a list of item ids, block ids and group classificiations
        reporterror('server/route_localMap.php->route_saveLocalMap()', 'allItems array: '. json_encode($con['allItems']));
        JSEvery($con['allItems'], function($list) {
            verifyInput($list, [
                ['name'=>'buildId', 'required'=>true, 'format'=>'posint'],
                ['name'=>'id',      'required'=>true, 'format'=>'posint'],
                ['name'=>'group',   'required'=>true, 'format'=>'stringnotempty']
            ], 'server/route_localMap.php->route_saveLocalMap()->verify globals items list');
            return true;
        });
        //verifyItems($con['allItems']);

        // With the user data accepted, get the player's coordinates from the player record. We can use that to pick the correct
        // world map block
        $playerCoords = DanDBList("SELECT currentx, currenty FROM sw_player WHERE id=?;", 'i', [$userid],
                                  'server/route_localMap.php->route_saveLocalMap()->get player coords')[0];
        DanDBList("UPDATE sw_map SET blocks=?, unlockedItems=?, allItems=?, foodCounter=? WHERE x=? AND y=?;", 'sssiii',
                  [json_encode($con['blocks']), json_encode($con['unlockedItems']), json_encode($con['allItems']),
                  $con['foodCounter'], $playerCoords['currentx'], $playerCoords['currenty']],
                  'server/route_localMap.php->route_saveLocalMap()->save to database');
        
        // Nothing left to do except return a success state
        die(json_encode(['result'=>'success']));
    }

    function verifyTools($toolGroups, $codeSpot) {
        // Verifies tool groups received from the client
        return JSEvery($toolGroups, function($group) use ($codeSpot) {
            if($group['loaded']==='none') {
                // This currently has no tool
                verifyInput($group, [
                    ['name'=>'group', 'required'=>true, 'format'=>'stringnotempty'],
                    ['name'=>'selected', 'required'=>true, 'format'=>'string'],
                    ['name'=>'loaded', 'required'=>true, 'format'=>'stringnotempty']
                ], $codeSpot .'->verifyTools()->case no tool loaded');
            }else{
                // There is a tool here. Verify that as an item, separately
                verifyInput($group, [
                    ['name'=>'group', 'required'=>true, 'format'=>'stringnotempty'],
                    ['name'=>'selected', 'required'=>true, 'format'=>'string'],
                    ['name'=>'loaded', 'required'=>true, 'format'=>'array']
                ], $codeSpot .'->verifyTools()->case tool loaded');
                verifyItems([$group['loaded']], $codeSpot .'->verifyTools() (loaded tool)');
            }
            return true;
        });
    }

    function verifyItems($itemsList, $codeSpot) {
        // Verifies items received from the client
        // Item arrays can contain several data types, each with different attributes
        if(sizeof($itemsList)===0) return true; // If the list is empty, don't worry about it
        return JSEvery($itemsList, function($ele) use ($codeSpot) {
            if(!isset($ele['group'])) return false;
            switch($ele['group']) {
                case 'item': // This has no additional attributes
                    verifyInput($ele, [
                        ['name'=>'id', 'required'=>true, 'format'=>'posint'],
                        ['name'=>'name', 'required'=>true, 'format'=>'stringnotempty'],
                        ['name'=>'group',    'required'=>true, 'format'=>'stringnotempty'],
                        ['name'=>'lifetime', 'required'=>false, 'format'=>'int']
                    ], $codeSpot .'->verifyItems()->case item');
                break;
                case 'food': // This has a lifetime value
                    reporterror('Debug: server/route_localMap.php->verifyItems()->case food', 'checking '. json_encode($ele));
                    verifyInput($ele, [
                        ['name'=>'id', 'required'=>true, 'format'=>'posint'],
                        ['name'=>'name', 'required'=>true, 'format'=>'stringnotempty'],
                        ['name'=>'group',    'required'=>true, 'format'=>'stringnotempty'],
                        ['name'=>'lifetime', 'required'=>true, 'format'=>'int']
                    ], $codeSpot .'->verifyItems()->case food');
                break;
                case 'tool':
                    verifyInput($ele, [
                        ['name'=>'id', 'required'=>true, 'format'=>'posint'],
                        ['name'=>'name', 'required'=>true, 'format'=>'stringnotempty'],
                        ['name'=>'group', 'required'=>true, 'format'=>'stringnotempty'],
                        ['name'=>'endurance',  'required'=>true, 'format'=>'int'],
                        ['name'=>'efficiency', 'required'=>true, 'format'=>'float']
                    ], $codeSpot .'->verifyItems()->case tool');
                break;
                default: return false;
            }
            return true;
        });
    }
?>