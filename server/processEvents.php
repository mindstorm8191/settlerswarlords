<?php
    // processEvents.php
    // Manages processing all events that need to be taken care of, to get the Game-State up to present-time
    
    function processEvents() {
        // Handles processing all events that have passed their target processing time

        // We will have to process all past-due events in order, so that we can keep the game state accurate
        // In previous versions of this routine, I would have to add events even if they ended in past-tense, just to keep things organized.
        // Now, we should be able to insert already-passed events into our list, as we go.

        $events = danqueryajax("SELECT * FROM sw_event WHERE endtime < NOW() ORDER BY endtime;",
                               'server/processEvents.php->processEvents()->get all passed events');
        while(sizeof($events)>0) {
            switch($events[0]['task']) {
                case 'explore':
                    // Player is trying to explore new lands. We already have a function to let us do that, whether the user has previous
                    // information or not.
                    // However, that function expects x & y coords, while the event has a map id. We can convert that
                    $worldmap = danget("SELECT x, y FROM sw_map WHERE id=". $events[0]['mapid'] .";",
                                       'server/processEvents.php->processEvents()->get x & y values');
                    updateknownmap($events[0]['player'], $worldmap['x'], $worldmap['y']);

                    // Now we can drop the currently event. It will be deleted when all events have been processed
                    array_shift($events);
                break;
            }
        }
        // With all events processed, we should go ahead and delete them from the database
        danpost("DELETE FROM sw_event WHERE endtime < NOW();",
                'server/processEvents.php->processEvents()->remove processed events');
    }

    function advanceProcesses($mapID, $timestamp) {
        // Handles advancing existing processes for a specific map location.
        // $mapID - which map ID to check for updates to.  All processes of this block will be updated
        // $timestamp - what time point to advance (or retract) to 

        if($timestamp!='NOW()') $timestamp = "'". $timestamp . "'";

        // Start by getting all the existing processes of this area
        foreach(danqueryajax("SELECT TIME_TO_SEC(TIMEDIFF(". $timestamp .", sw_process.timeBalance)) AS diff, sw_process.id AS id, ".
                             "sw_structureaction.name AS name, sw_structureaction.cycleTime AS cycle, sw_structureaction.inputGroup AS inGroup,".
                             "sw_structureaction.outputGroup AS outGroup FROM sw_process INNER JOIN sw_structureaction ON ".
                             "sw_process.actionid=sw_structureaction.id WHERE sw_process.mapid=". $mapID .";",
                             'server/processEvents.php->advanceProcesses()->get all processes')
                as $ele) {
            //reporterror('Debug in advanceProcesses: time difference='. $ele['diff'] .'.');
            // We will have to determine what happens based on whatever action type we have.
            switch($ele['name']) {
                case 'Forage for Food':
                    // This should trigger every 60 seconds, adding a new food type. Start by determining how many (complete) food items need
                    // to be added
                    $numadded = floor($ele['diff']/$ele['cycle']);
                    if($numadded>0) {
                        // Get a list of all the output choices. We need to select one of these at random for each unit added, and add it
                        // to the map's stockpile of foods.
                        $items = danqueryajax("SELECT name FROM sw_structureitem WHERE resourceGroup=". $ele['outGroup'] .";",
                                                'processEvents.php->advanceProcesses()->case Forage for Food->get input list');
                        $itemList = array_map(function($item) {
                            return ['name'=>$item['name'], 'count'=>0];
                        },$items);
                        // This sets us up with a list of all the possible elements, each with a starting count of zero.
                        // While we have the original list of names, go ahead and try to grab the existing item records for this land tile
                        $dataFetch = implode(',', array_map(function($single) {
                            return "'". $single['name'] ."'";
                        }, $items));
                        $fetched = danqueryajax("SELECT name FROM sw_item WHERE mapID=". $mapID ." AND name IN(". $dataFetch .");",
                                                'processEvents.php->advanceProcesses()->case Forage for Food->find existing items on land');
                        // Ideally, this $fetched list will be a part of the $itemsList, to only provide a flag to determine if there is already
                        // items of this type in the database.
                        $loopCounter=0;
                        $itemList = array_map(function($item) use ($fetched, &$loopCounter) {
                            $loopCounter++;
                            $item['isStored'] = JSSome($fetched, function($inner) use ($item) {
                                return $item['name']==$inner['name'];
                            });
                            return $item;
                        }, $itemList);

                        
                        // Actually updating the counts of items (randomly) is fairly simple
                        for($i=0;$i<$numadded;$i++) {
                            $itemList[rand(0,3)]['count']++;
                        }

                        reporterror("Debug in processEvents.php->advanceProcesses(): resulting structure: ". json_encode($itemList) .
                                    ". Loop Counter=". $loopCounter .", numadded=". $numadded);


                        // Now we are ready to insert the updated data into the database
                        foreach($itemList as $item) {
                            if($item['isStored']) {
                                // This already has a listing in the database. Use Update
                                danpost("UPDATE sw_item SET amount=amount+". $item['count'] ." WHERE name='". $item['name'] .
                                        "' AND mapID=". $mapID .";",
                                        'processEvents.php->advanceProcesses()->case Forage for Food->save item via update');
                            }else{
                                // This doesn't have a listing in the database yet. Add new
                                danpost("INSERT INTO sw_item (name, mapID,amount,`grouping`,weight,size,temp,priority) VALUES ('".
                                        $item['name'] ."',". $mapID .",". $item['count'] .",1,1,1,1,1);",
                                        'processEvents.php->advanceProcesses()->case Forage for Food->add new item');
                            }
                        }

                        // Finally, update the process to a new time.
                        danpost("UPDATE sw_process SET timeBalance=DATE_ADD(timeBalance, INTERVAL ". ($numadded*$ele['cycle']) ." SECOND) ".
                                "WHERE id=". $ele['id'] .";",
                                'processEvents.php->advanceProcesses()->case Forage for Food->save process');
                    }
                break;
            }
        }
        //
        // the 'diff' here should tell us how many items have been produced since the process was last updated.

        
    }
?>