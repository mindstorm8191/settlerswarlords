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
                case 'newbuild':    // Handles all buildings that are newly completed.
                    // Currently the only building that has construction time is the lean-to. I don't know if any of the buildings
                    // will have after-construction actions. This one doesn't.
                    array_shift($events);
                break;
                default:
                    reporterror('Error in processEvents(): event type of '. $events[0]['task'] .' not yet handled');
                    ajaxreject('internal', 'Events processing ran into an event type that is not handled yet. This needs to be corrected');
            }
        }
        // With all events processed, we should go ahead and delete them from the database
        danpost("DELETE FROM sw_event WHERE endtime < NOW();",
                'server/processEvents.php->processEvents()->remove processed events');
    }

    // We need a structure to make it easier to add, update, view and remove items from a given location's inventory.
    // This should be in an object form, which we can use in lists
    class item {
        var $name;
        var $mapID;
        var $amount;
        var $storedAmount;              // This is the amount in the database, once it's determined
        var $storedAccurate = 0;        // This is 1 only after we have determined what is in the database
        var $missingFromDatabase = 0;   // After checking the database, this is 1 if there are no entries for this item type
        var $multiplier = 1;            // Used in certain cases where a multiplier amount is needed
        var $isFood = 0;

        function __construct($itemName, $mapIDvalue, $multiplier=1) {
            // Creates a new item record, based on its location
            $this->name = $itemName;
            $this->mapID = $mapIDvalue;
            $this->multiplier = $multiplier;
        }

        function setFoodState($value) {
            $this->isFood = $value;
        }

        function getMult() {
            // returns the multiplication rate for this item
            return $this->multiplier;
        }

        function has($debug=false) {
            // Returns the amount that is stored in the database

            // We don't want to query the database more than needed. If we already have a value, return it now
            if($this->storedAccurate==1) return $this->storedAmount;

            $grab = danget("SELECT amount FROM sw_item WHERE mapID=". $this->mapID ." AND name='". $this->name ."';",
                           'processEvents.php->class item->has()', true);
            if(!$grab) {
            //if($this->storedAmount==null) {
                $this->storedAmount = 0;
                $this->missingFromDatabase = 1;
            }else{
                $this->storedAmount = $grab['amount'];
            }


            $this->storedAccurate = 1;

            if($debug==true) {
                reporterror('Debug in processEvents->class item->has(): value to return is '. $this->storedAmount);
            }
            return $this->storedAmount;
        }

        function set($amount) {
            // Sets the change amount for this item. This doesn't update anything at this point;
            // the amount in the database doesn't have to be loaded yet
            // $amount - how much to increase the stored amount by. This value can be negative
            if($this->amount==null) {
                $this->amount = $amount;
            }else{
                $this->amount = $this->amount + $amount;
            }
        }

        function flush() {
            // Updates the database with the amount changes for this item

            // First check if this value is being changed any. If not, the database value should
            // be accurate (even if it doesn't yet exist in the database)
            if($this->amount==0) return;

            // The first step is to see if we have checked the database yet
            if($this->storedAccurate==0) {
                // We can fetch the amount with our existing function
                $this->has();
            }

            // Start by checking if this item is in the database
            if($this->missingFromDatabase==1) {
                danpost("INSERT INTO sw_item (name, mapID, amount, `grouping`, weight, size, temp, isFood, priority) ".
                        "VALUES ('". $this->name ."',". $this->mapID .",". $this->amount .",1,1,1,1,". $this->isFood .",1);",
                        'processEvents.php->class item->flush()->case not in database');
            }else{
                danpost("UPDATE sw_item SET amount=amount+". $this->amount .", isFood=". $this->isFood ." WHERE name='".
                        $this->name ."' AND mapID=". $this->mapID .";",
                        'processEvents.php->class item->flush()->case add');
            }
        }
    }
    
    function advanceProcesses($mapID, $timestamp) {
        // Handles advancing existing processes for a specific map location.
        // $mapID - which map ID to check for updates to.  All processes of this block will be updated
        // $timestamp - what time point to advance (or retract) to 

        if($timestamp!='NOW()') $timestamp = "'". $timestamp . "'";

        // Start by getting all the existing processes of this area. The diff here tells us how many seconds have passed
        foreach(danqueryajax("SELECT TIME_TO_SEC(TIMEDIFF(". $timestamp .", sw_process.timeBalance)) AS diff, sw_process.id AS id, ".
                             "sw_structureaction.name AS name, sw_structureaction.cycleTime AS cycle, sw_structureaction.inputGroup AS inGroup,".
                             "sw_structureaction.outputGroup AS outGroup FROM sw_process INNER JOIN sw_structureaction ON ".
                             "sw_process.actionid=sw_structureaction.id WHERE sw_process.mapid=". $mapID .";",
                             'server/processEvents.php->advanceProcesses()->get all processes')
                as $ele) {
            //reporterror('Now handling event '. $ele['name']);
            //reporterror('Debug in advanceProcesses: time difference='. $ele['diff'] .'.');
            // We will have to determine what happens based on whatever action type we have.
            switch($ele['name']) {
                case 'Consume Food':
                    // Handles consuming food. We want to consume food based on the number of colonists here... but we
                    // don't yet have a way to control population
                    // Start by determining how many food items get consumed
                    $numadded = floor($ele['diff']/$ele['cycle']);
                    if($numadded<=0) break;

                    // Now, search for food items which can be consumed.  Instead of pulling information from a
                    // structure's resource group, we can search the existing inventory for all edible items
                    $itemList = danqueryajax("SELECT name, amount FROM sw_item WHERE mapID=". $mapID ." AND isFood=1;",
                                             'processEvents.php->advanceProcesses()->case Consume Food->get foods list');
                    
                    reporterror('Debug in processEvents.php->advanceProcesses()->case Consume Food: we need to consume '.
                                ($numadded*4) .' food items, we have '.
                                array_reduce($itemList, function($carry, $item) {
                                    return $carry + $item['amount'];
                                }, 0) .' foods ('. sizeof($itemList) .' options)');
                    
                    // Next, run through all the items, picking one randomly.  When one has been reduced to zero,
                    // we need to remove it from our 'search' list. We can update its value in the database as
                    // its removed
                    $i = $numadded*4;
                    while($i>0) {
                        if(sizeof($itemList)>0) {
                            $pick = rand(0, sizeof($itemList)-1);
                            $itemList[$pick]['amount'] = intval($itemList[$pick]['amount']-1);
                            if($itemList[$pick]['amount']<=0) {
                                danpost("UPDATE sw_item SET amount=0 WHERE name='". $itemList[$pick]['name'] ."' AND mapID=".
                                        $mapID .";",
                                        'processEvents.php->advanceProcesses()->case Consume Food->ran out of one');
                                array_splice($itemList, $pick, 1);
                            }
                            $i--;
                        }else{
                            // We have run out of food options to make use of. Now, we need to generate foodDeficit
                            // items for the remaining food points we need.
                            $d = new item("Food Deficit", $mapID);
                            $d->set($i);
                            $d->flush();
                            $i=0;
                        }
                    }

                    reporterror('Debug in processEvents.php->advanceProcesses()->case Consume Food: There are '.
                                array_reduce($itemList, function($carry, $item) {
                                    return $carry + $item['amount'];
                                }, 0) .' foods ('. sizeof($itemList) .' options) remaining');

                    // Update any food items that still remain
                    foreach($itemList as $item) {
                        danpost("UPDATE sw_item SET amount=". $item['amount'] ." WHERE name='". $item['name'] .
                                "' AND mapID=". $mapID .";",
                                'processEvents.php->advanceProcesses()->case Consume Food->save remaining foods');
                    }

                    // Finally, update this process to a new time
                    danpost("UPDATE sw_process SET timeBalance=DATE_ADD(timeBalance, INTERVAL ".
                            ($numadded*$ele['cycle']) ." SECOND) WHERE id=". $ele['id'] .";",
                            'processEvents.php->advanceProcesses()->case Forage for Food->save process');
                break;

                case 'Forage for Food':
                    // This should trigger every 60 seconds, adding a new food type. Start by determining how many (complete) food items need
                    // to be added
                    $numadded = floor($ele['diff']/$ele['cycle']);
                    if($numadded<=0) break;

                    // Get a list of all the output choices. We need to select one of these at random for each unit added,
                    // then add it to the map's stockpile of foods.
                    $items = danqueryajax("SELECT name FROM sw_structureitem WHERE resourceGroup=". $ele['outGroup'] .";",
                                          'processEvents.php->advanceProcesses()->case Forage for Food->get input list');
                    // Convert this into a list of class instances
                    $itemList = array_map(function($item) use ($mapID) {
                        return new item($item['name'], $mapID);
                    }, $items);

                    // Actually updating the counts of items (randomly) is fairly simple
                    for($i=0;$i<$numadded;$i++) {
                        $itemList[rand(0,sizeof($itemList)-1)]->set(1);
                    }

                    // Now, we should be ready to store all our data to the database
                    foreach($itemList as $item) {
                        $item->setFoodState(1);
                        $item->flush();
                    }

                    // Finally, update the process to a new time
                    danpost("UPDATE sw_process SET timeBalance=DATE_ADD(timeBalance, INTERVAL ". ($numadded*$ele['cycle']) ." SECOND) ".
                            "WHERE id=". $ele['id'] .";",
                            'processEvents.php->advanceProcesses()->case Forage for Food->save process');
                break;

                case 'Collect Flint':
                case 'Collect Sticks':
                case 'Collect Twine':
                    // Unlike foraging for food, there will be only one output of this task. No need for complicated output selection
                    $numadded = floor($ele['diff']/$ele['cycle']);
                    if($numadded<=0) break;
                    
                    // Grab all the output items of this action. While we do, gererate item class instances
                    $itemList = array_map(function($item) use ($mapID) {
                        return new item($item['name'], $mapID);
                    }, danqueryajax("SELECT name FROM sw_structureitem WHERE resourceGroup=". $ele['outGroup'] .";",
                                    'processEvents.php->advanceProcesses()->case Collect Flint->get input list')
                    );

                    // Now advance the amount of each item. We can go ahead and store the results to the database
                    foreach($itemList as $item) {
                        $item->set($numadded);
                        $item->flush();
                    }

                    // Finally, update the process to a new time.
                    danpost("UPDATE sw_process SET timeBalance=DATE_ADD(timeBalance, INTERVAL ". ($numadded*$ele['cycle']) ." SECOND) ".
                            "WHERE id=". $ele['id'] .";",
                            'processEvents.php->advanceProcesses()->case Forage for Food->save process');
                break;

                case 'Craft Flint Spear':
                    // Here, we need to collect X number of craft items, delete them, and then produce Y number of finished products
                    // Like before, start by ensuring we have at least one item to produce
                    $oldadded = floor($ele['diff']/$ele['cycle']);
                    if($oldadded<=0) break;
                    //reporterror("Debug in server/processEvents.php->advanceProcesses()->case Craft Flint Spear: We have ". $oldadded ." spears to add");

                    // Grab all the input items of this process. We can drop them into a list of
                    // item class instances while we do
                    $inList = danqueryajax("SELECT name, amount FROM sw_structureitem WHERE resourceGroup=". $ele['inGroup'] .";",
                                           'processEvents.php->advanceProcesses()->case Craft Flint Spear->get input items');
                    
                    // With this, create some item class instances
                    $onHand = array_map(function($item) use ($mapID) {
                        return new item($item['name'], $mapID, $item['amount']);
                    }, $inList);

                    // Next, ensure we have enough items for producing the items we need
                    $numadded = array_reduce($onHand, function($carry, $item) use ($inList) {
                        // Here, carry is the amount of items we want to add. It needs to be
                        // reduced by the limit specified by how much materials we have
                        return min($carry, $item->has() * $item->getMult());
                    }, $oldadded);

                    reporterror("Debug in server/processEvents.php->advanceProcesses()->case Craft Flint Spear: original amount to make=".
                                $oldadded .", new amount to make=". $numadded);
                    

                    // Now, for all the input items, apply a quantity to reduce inventory by
                    // We can go ahead and flush this, since we are done with it
                    foreach($onHand as $item) {
                        $item->set(-$numadded * $item->getMult());
                        $item->flush();
                    }

                    // Now, store all the output items to a separate array of item instances
                    $outList = array_map(function($item) use ($mapID) {
                        return new item($item['name'], $mapID, $item['amount']);
                    }, danqueryajax("SELECT name, amount FROM sw_structureitem WHERE resourceGroup=". $ele['outGroup'] .";",
                                    'processEvents.php->advanceProcesses()->case Craft Flint Spear->get input list'));
                    
                    // Increase the amount based on how much we have produced. We can then
                    // be done with this list too
                    foreach($outList as $item) {
                        $item->set($numadded * $item->getMult());
                        $item->flush();
                    }

                    // Finally, update the process to a new time. Note that we need the original added amount,
                    // to progress this process closer to the current time.
                    danpost("UPDATE sw_process SET timeBalance=DATE_ADD(timeBalance, INTERVAL ". ($oldadded*$ele['cycle']) ." SECOND) ".
                            "WHERE id=". $ele['id'] .";",
                            'processEvents.php->advanceProcesses()->case Forage for Food->save process');
                break;

                default:
                    // Something went wrong, as this didn't flag any of the choices we have
                    reporterror("Error in processEvents.php->advanceProcesses(): found choice of ". $ele['name'] .", this was not handled");
            }
        }
        // With all the processes handled, determine if we have any food deficit items in inventory. This will need to
        // consume foods for each one found.
        // Start by finding any food deficit items in this map. We will need to know the quantity
        $deficit = danget("SELECT amount FROM sw_item WHERE name='Food Deficit' AND mapID=". $mapID .";",
                          'processEvents.php->advanceProcesses()->find food deficits', true);
        if($deficit && $deficit['amount']>0) {
            // Now, search for food items to consume. We want to allow the colonists to eat any available foods at random
            $foods = danqueryajax("SELECT name, amount FROM sw_item WHERE mapID=". $mapID ." AND isFood=1 AND amount>0;",
                                  'processEvents.php->advanceProcesses()->get available foods', true);
            // I would turn all these into item instances, but we seem to already have the name & amount here
            // Next, run through and select foods at random until we have used up all the deficit items
            while($deficit['amount']>0) {
                if(sizeof($foods)>0) {
                    $pick = rand(0, sizeof($foods)-1);
                    $foods[$pick]['amount']=intval($foods[$pick]['amount']-1);
                    if($foods[$pick]['amount']<=0) {
                        danpost("UPDATE sw_item SET amount=0 WHERE name='". $foods[$pick]['name'] ."' AND mapID=".
                                $mapID .";",
                                'processEvents.php->advanceProcesses()->manage deficits->ran out of one');
                        array_splice($foods, $pick, 1);
                    }
                    $deficit['amount']=intval($deficit['amount']-1);
                }else{
                    // We have run out of food options to make use of. I am not sure what to do with thi sat this point
                    // For now, store the remaining deficit and continue on
                    danpost("UPDATE sw_item SET amount=". $deficit['amount'] ." WHERE name='Food Deficit' AND mapID=". $mapID .";",
                            'processEvents.php->advanceProcesses()->manage deficits->store remaining deficits');
                    $deficit['amount']=0;
                }
            }
        }
    }
?>