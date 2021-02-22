 <?php
    /*  process.php
        Manages updating processes
        for the game Settlers & Warlords
    */

    function updateProcesses($mapContent, $timestamp) {
        // Handles updating all processes to set the correct production / consumption rates of each item
        // $mapContent - full data package from the database for the map tile that needs to be updated
        // $timestamp - The 'current time' which resource rates should be updated for. This is only critical for
        //              when creating ResouceEmpty events. If processes are being updated to the current time
        //              pass "NOW()" for this parameter.
        // No return value.

        // Processes structure (array of objects)
        //  id - unique id, within only this list
        //  name - name of the action
        //  buildingId - ID of the building having this process
        //  actionId - ID of the action database record
        //  priority - priority of this process
        //  inputGroup - array of objects from DB action record
        //      name - item name
        //      amount - amount produced by this action
        //      isFood - 1 or 0 if food or not
        //  outputGroup - same structure as inputGroup
        //  (added) usage - 0 to 1 multiplier of how much of this process can run

        // Items (array of objects)
        //  name - name for this object. All identical objects are lumped into the same listing
        //  amount - how much of this object the player has on hand
        //  production - calculated production of this item (or negative for consumption)
        // (added) consumption - rate of use of this item
        //      processId - ID of the process using this item
        //      amount - hourly consumption rate of this item
        // (added) productionProcesses - array of objects
        //      processId - ID of the process doing this consumption
        //      amount - hourly production rate this needs to function
        // (added) consumptionProcesses - array of IDs of each process providing production to this item
        
        // Step 1: Determine all the processes that can be completed, based on available workers; some processes will
        // be skipped, because nobody can work them. They will still need to be held onto for recording later, and in
        // the event other processes cannot be done
        // So, just sort all the processes based on priority. We'll skip processes when we run out of workers to do them

        $processes = json_decode($mapContent['processes'], true);
        if($processes==null) return; // This tile has no processes to manage

        // Sort all these processes based on priority
        usort($processes, function($one, $two) {
            return ($one['priority'] < $two['priority']) ? -1: 1;
        });

        // When there are multiple processes at the last priority level, we need to split work load among those, with the remaining workers
        // That is, with 5 lvl4 processes and 3 workers remaining, each lvl4 process gets 3/5 production.
        // Determine what priority level we run out of workers at
        $outOfWorkAtPriorityLevel = 2^31;
        $workersLeft = $mapContent['population'];
        foreach($processes as $process) {
            $workersLeft -= $process['workers'];
            if($workersLeft<0 && $outOfWorkAtPriorityLevel===2^31) {
                $outOfWorkAtPriorityLevel = $process['priority'];
            }
        } unset($process);

        // We need the total number of processes at this 'split' level
        $splitProcessCount = sizeof(array_filter($processes, function($ele) use ($outOfWorkAtPriorityLevel) {
            return $ele['priority'] === $outOfWorkAtPriorityLevel;
        }));

        // Apply a usage value to processes, which determines how much of that process can run, based on above determinations
        $workersLeft = $mapContent['population'];
        foreach($processes as &$process) {
            if($process['name']==='ConsumeFood') {
                $process['usage'] = 1;  // The ConsumeFood process cannot be squeezed out
            }else{
                switch(true) {
                    case $process['priority'] < $outOfWorkAtPriorityLevel:
                        $process['usage'] = 1.0;
                        $workersLeft -= $process['workers'];
                    break;
                    case $process['priority'] === $outOfWorkAtPriorityLevel:
                        $process['usage'] = $workersLeft / $splitProcessCount;
                    break;
                    case $process['priority'] > $outOfWorkAtPriorityLevel:
                        $process['usage'] = 0;
                    break;
                }
            }
        } unset($process);
        // Ya know, it might be good to hold onto this usage value for later. This can indicate to the player that the process isn't receiving
        // priority treatment

        // With items, start by flushing (and/or setting) the production & consumption fields in the item
        $items = array_map(function($single) {
            if(!isset($single['isFood'])) {
                reporterror('server/process.php->updateProcesses()->gather items',
                            'Error: item name='. $single['name'] .' missing isFood field. Using default=1');
                $single['isFood'] = 0;
            }
            $single['production'] = 0;
            $single['consumption'] = 0;
            $single['productionProcesses'] = [];
            $single['consumptionProcesses'] = [];
            $single['foodConsuming'] = $single['isFood'];
            $single['bottleneck'] = 0;
            return $single;
        }, json_decode($mapContent['items'], true));

        // We need a count of the total number of food sources (to start out with, at least)
        $foodTypes = array_reduce($items, function($carry, $ele) {
            //return $carry + ($ele['isFood'])?1:0;
            if($ele['isFood']==1) {
                return $carry+1;
            }
            return $carry;
        }, 0);
        $foodDemand = 3600.0 * $mapContent['population'] / 300;
        //reporterror('server/process.php->updateProcesses()->setups', 'Food types='. $foodTypes .', demand='. $foodDemand);

        // Run through all processes and apply the production & consumption rates to each of the items
        // This is only the initial values; we will run through everything again later
        foreach($processes as $process) {
            if($process['name']==='ConsumeFood') {
                $sourcesCounter = 0;
                foreach($items as &$item) {
                    if($item['isFood']==1) {
                        $sourcesCounter++;
                        // By definition, each colonist consumes 1 food unit every 300 seconds (12 per hour)
                        $item['consumption'] += (12.0 * $mapContent['population']) / $foodTypes;
                    }
                }
                //reporterror('server/process.php->updateProcesses()->set production&consumption', 'FoodConsumer ran. We have '. $sourcesCounter .' food types');
            }else{
                foreach($items as &$item) {
                    // Find the name of this item in the process's inputGroup or outputGroup
                    $spot = JSFindIndex($process['inputGroup'], function($listing) use ($item) { // If inputgroup is empty, JSFindIndex returns null anyway
                        return $listing['name'] === $item['name'];
                    });
                    if(gettype($spot)!="NULL") {
                        // We had a hit. Update the consumption field of this item
                        $consumption = $process['inputGroup'][$spot]['amount'] * $process['usage'];
                        $item['consumption'] += $consumption;
                        array_push($item['consumptionProcesses'], ['processId'=>$process['id'], 'name'=>$process['name'], 'amount'=>$consumption]);
                    }
                    // Do the same for the outputGroup
                    $spot = JSFindIndex($process['outputGroup'], function($listing) use ($item) {
                        return $listing['name'] === $item['name'];
                    });
                    if(gettype($spot)!="NULL") {
                        $production = $process['outputGroup'][$spot]['amount'] * $process['usage'];
                        $item['production'] += $production;
                        array_push($item['productionProcesses'], ['processId'=>$process['id'], 'name'=>$process['name'], 'amount'=>$production]);
                    }
                } unset($item);
            }
        } unset($process);

        reporterror('server/process.php->updateProcesses()->before primary loop',
                    "All Items:\r\n". json_encode($items) ."\r\n All processes:\r\n". json_encode($processes));

        // Now each item has its production & consumption rate
        // Go through each item and 'balance' rates, making adjustments as needed
        $trigger = false;
        $cycleCount = 0;
        while(!$trigger) {
            $trigger = true;
            $cycleCount++;

            // Start by checking the cycle count, to ensure we're not in an infinite loop
            if($cycleCount>sizeof($items)*10) {
                reporterror('server/process.php->UpdateProcesses()', 'Error - cycle limit reached. Items state: '.
                            json_encode($items) .'. Process state: '. json_encode($processes));
                ajaxreject('internal', 'Error in UpdateProcesses(): Cycle limit reached (count '. $cycleCount .'), something is broken');
            }

            [$trigger, $items, $processes, $foodTypes, $foodDemand] = updateProcesses_singlePass($trigger, $items, $processes, $foodTypes, $foodDemand);
        }

        // With that done, there's a few things left to sort out.
        // For any items where production is negative, we need to create a  ResourceEmpty event, to trigger when surplus of that
        // resource runs out. There is probably already one existing for this map location, so let's delete it.
        DanDBList("DELETE from sw_event WHERE task='ResourceEmpty' AND mapId=?", 'i', [$mapContent['id']],
                  'server/process.php->updateProcesses()->delete existing ResourceEmpty events');
        //There should be only one ResourceEmpty event: the first resource to reach zero.
        $nextEmptyResource = array_reduce($items, function($carry, $ele) {
            if($ele['production'] < $ele['consumption']) {
                // This item should be reducing, aka case two above. So there should be a secsToZero field... but check anyway
                if(isset($ele['secsToZero'])) {
                    return min($ele['secsToZero'], $carry);
                }
            }
            return $carry;
        }, pow(2,31));
        if($nextEmptyResource<pow(2,31)) {
            createEvent(0, $mapContent['id'], 'ResourceEmpty', '', $timestamp, $nextEmptyResource, 0);
            // Yes, this is the only place we need to use $timestamp at
        }

        // Clean up the items array before finishing this
        $items = array_map(function($ele) {
            unset($ele['complete']);
            unset($ele['secsToZero']); // We will unset this for everything, even if it doesn't exist
            unset($ele['foodConsuming']);
            return $ele;
        }, $items);

        //reporterror('server/process.php->updateProcesses()',
        //            'Debug: items structure is now '. json_encode($items));

        // Now, store all the items and processes back into the worldmap structure, so we can return it
        $mapContent['processes'] = json_encode($processes);
        $mapContent['items'] = json_encode($items);
        return $mapContent;
    }

    function updateProcesses_singlePass($trigger, $items, $processes, $foodTypes, $foodDemand) {
        // This was pulled from updateProcesses, in order to unit-test a single pass in the primary loop

        foreach($items as &$item) {
            // Check One: Determine if we are producing enough of this resource
            if($item['production'] >= $item['consumption']) {
                //$item['result'] = $item['production'] - $item['consumption'];
                $item['complete'] = true;
                continue;
            }

            // Check Two: Determine if there's enough inventory on hand to cover additional consumption
            // These will basically run until the surplus runs dry, at which point we will run more code
            // Unlike the last version, we already have the inventory amount on hand
            $lossRate = ($item['consumption']-$item['production']) / 3600.0;  // This consumption rate per second
            if($item['amount'] / $lossRate > 1.0) {
                // Running a negative rate will work fine here
                //$item['result'] = $item['production'] - $item['consumption'];
                $item['secsToZero'] = $item['amount'] / floatval($lossRate);  // We will drop this at the end
                $item['complete'] = true;
                continue;
            }

            // Check Three; this is the tricky one. Determine how much to reduce all consumers of this item so
            // that it matches the production rate
            $item['bottleneck'] = 1; // This is to inform the user that this element can't be kept up with

            if($item['foodConsuming']==0) {
                // So, we're only producting 15 per hour, but using 20 per hour.
                // That means that total production needs to be set to the rate of 15/20 = 75%
                // The operating rate of all consumers will be reduced by 75%, balancing production & consumption
                // Adjusting by a ratio means that even if one process is using a whole lot, it will adjust accordingly
                $rateShift = floatval($item['production']) / $item['consumption'];

                // Find all consumers of this item
                foreach($item['consumptionProcesses'] as $conId) {
                    // We have the consumer process ID only. Get the actual process
                    $consumerSlot = JSFindIndex($processes, function($ele) use ($conId) {
                        return $ele['id'] === $conId['processId'];
                    });

                    // This process is being slowed down, by a multiple of $rateShift. So, for all input AND output items
                    // of this process - yes, the whole thing - we need to reduce production rates
                    foreach($processes[$consumerSlot]['inputGroup'] as $updateItem) {
                        // Find this item within $items, based on the item name
                        $itemSlot = JSFindIndex($items, function($part) use ($updateItem) {
                            return $part['name'] == $updateItem['name'];
                        });
                        //$items[$itemSlot]['production'] *= $rateShift;
                        //$items[$itemSlot]['complete'] = false;
                        // Well, not so fast. If there are more than one input elements (producing this item at
                        // different rates), this will reduce everything equally, which is incorrect
                        // Instead, we need to find the production rate for this item (in productionProcesses) and reduce its
                        // production rate for that particular process
                        $items[$itemSlot]['consumptionProcesses'] = array_map(function($pack) use ($conId, $rateShift) {
                            if($pack['processId']==$conId['processId']) {
                                $pack['amount'] *= $rateShift;
                            }
                            return $pack;
                        }, $items[$itemSlot]['consumptionProcesses']);

                        // Recalculate the total consumption for this item
                        $items[$itemSlot]['consumption'] = array_reduce($items[$itemSlot]['consumptionProcesses'], function($carry, $proc) {
                            return $carry + $proc['amount'];
                        }, 0);

                        // Because this item is updated, other (previously done) items may not be accurate anymore. We will need to run
                        // this whole operation a second time
                        $items[$itemSlot]['complete'] = false;
                    } unset($updateItem);

                    // All this, we need to do again for the outputGroup
                    foreach($processes[$consumerSlot]['outputGroup'] as $updateItem) {
                        $itemSlot = JSFindIndex($items, function($part) use ($updateItem) {
                            return $part['name'] === $updateItem['name'];
                        });
                        $items[$itemSlot]['productionProcesses'] = array_map(function($pack) use ($conId, $rateShift) {
                            if($pack['processId']===$conId['processId']) {
                                $pack['amount'] *= $rateShift;
                            }
                            return $pack;
                        }, $items[$itemSlot]['productionProcesses']);
                        $items[$itemSlot]['production'] = array_reduce($items[$itemSlot]['productionProcesses'], function($carry, $proc) {
                            return $carry + $proc['amount'];
                        }, 0);
                        $items[$itemSlot]['complete'] = false;
                    }
                } unset($conId);

                // Don't forget to set this item's resulting rates to zero
                //reporterror('server/process.php->updateProcesses()->after check 3',
                //            'item '. $item['name'] .' consumption='. $item['consumption'] .', should be '. $item['production']);
                $item['consumption'] = $item['production'];
                $trigger = false;
            }else{
                // Food is a bit more complicated, because we cannot simply reduce operating speed of later processes.
                // Instead, the food demand will be spread out over the remaining food types, while excluding this one
                // If this produces some amount, that will reduce the total demand

                // With our food demand we need to calculate how much (currently) our demand per food is
                $oldSingleDemand = $foodDemand / $foodTypes; // Previous demand per food item
                $foodTypes--;
                $newSingleDemand = ($foodDemand-$item['production']) / $foodTypes;
                $item['foodConsuming'] = 0;  // Here is where this foodConsuming thing comes in handy
                $item['consumption'] = 0;
                //reporterror('server/process.php->updateProcesses()->food check #3',
                //            'Old per-item demand='. $oldSingleDemand .', new per-item demand='. $newSingleDemand);
                
                // Now, we can take each food's production, subtract the old demand, and add the new demand.
                // Start by determining how much to increase food consumption of the other items by

                $preLevels = debug_foodLevels($items);
                foreach($items as &$foodItem) {
                    if($foodItem['foodConsuming']==1) {
                        $foodItem['consumption'] -= $oldSingleDemand;
                        $foodItem['consumption'] += $newSingleDemand;
                        $foodItem['complete'] = false;
                    }
                }
                $postLevels = debug_foodLevels($items);
                //reporterror('server/process.php->updateProcesses()->change food consumption',
                //            'Food rates were '. json_encode($preLevels) .'. Food rates now '. json_encode($postLevels));
                // I don't think I need the $foodDemand variable anymore...
            }
        } unset($item);

        return [$trigger, $items, $processes, $foodTypes, $foodDemand];
    }

    function debug_foodLevels($items) {
        // We're doing this more than once, so we made this. Returns the consumption rates of each food
        return array_map(function($ele) {
            return ['name'=>$ele['name'], 'rate'=>$ele['consumption']];
        }, array_filter($items, function($ele) {
            if($ele['isFood']==true) return true;
            return false;
        }));
    }

    function advanceProcesses($mapContent, $timeTarget) {
        // Handles advancing the resource levels as time passes
        // $mapContent - full data set of the world map tile, as received from the database
        // $timeTarget - database timestamp of what time point to advance resources to.  If advancing to current time, pass "NOW()"
        // Returns the $mapContent with updated item levels

        $submitTime = $timeTarget;
        if($timeTarget!="NOW()") $submitTime = "'". $timeTarget ."'";

        // Get a timestamp difference from the database
        $pack = DanDBList("SELECT TIME_TO_SEC(TIMEDIFF(". $submitTime .",'". $mapContent['resourceTime'] ."')) AS diff, ".
                          "NOW() as curTime;", '', [],
                              'server/process.php->advanceProcesses()->get timestamp difference')[0];
        $timeDiff = $pack['diff'];
        $curTime = $pack['curTime'];
        
        $mapContent['items'] = json_encode(array_map(function($ele) use ($timeDiff) {
            // Ensure we have the correct variables in place
            if(!isset($ele['amount'])) $ele['amount'] = 0;
            if(!isset($ele['production'])) $ele['production'] = 0;
            if(!isset($ele['consumption'])) $ele['consumption'] = 0;
            $ele['amount'] += ($ele['production']-$ele['consumption']) * $timeDiff / 3600.0;
            return $ele;
        }, json_decode($mapContent['items'], true)));

        // Now, update the resourceTime value
        if($timeTarget==="NOW()") {
            $mapContent['resourceTime'] = $curTime;
        }else{
            $mapContent['resourceTime'] = $timeTarget;
        }
        return $mapContent;
    }
?>

