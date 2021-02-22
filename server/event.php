<?php
    /*  Event.php
        Handles all events that need to be completed
        For the game Settlers & Warlords
    
    Events are actions that take place at a specific time in the future. Everything is set up so that, when a page is loaded, any past event
    activities are completed. These are done in order of when they occurred, and while resource levels are timed according to the event's
    happenings, so that all events can happen as if it were in realtime.

    Typically, processing events can require a lot of database fetches. Additionally, one event can cause one or more
    other events to be generated. Traditionally, I would send these new events to the database, but since these might occur before cuurent
    time, this would require querying events one at a time, until none are returned.
    To reduce database fetches, we have a global $eventList array, holding all events that need to be processed. If $eventProcessingActive
    is set and the event time occurs before current time, any new events will be applied to the events list, instead of being saved
    to the database.
    */

    $eventList = [];
    $eventProcessingActive = false;

    function createEvent($player, $mapId, $task, $detail, $curTime, $secondsOut, $worldAffected) {
        // Handles creating all events, regardless if they're after current time or not
        // $player - player related to this event, or zero if none
        // $mapId - ID of the map tile this event is for, or zero if none
        // $task - Name of the event to created. Required
        // $detail - text content to include with the event. Can be JSON
        // $curTime - time point that the event creation should be relative to. For current time, pass "NOW()"
        // $secondsOut - amount of time past $curTime this event should trigger, in seconds
        // $worldAffected - set to 1 if this affects world events, or 0 if not. Non-world events can be ignored until
        //                  some world event affects the map tile
        // No return value. This may add new events to the global $eventList.

        global $eventList;
        global $eventProcessingActive;

        if($eventProcessingActive==true && $curTime!="NOW()") {
            if(strtotime($curTime)+$secondsOut < strtotime('now')) {
                // Convert our curTime to a UNIX timestamp. This should come in a MySQL format, so converting should be easy
                $timeCard = new DateTime();
                $timeCard->setTimestamp(strtotime($curTime) + $secondsOut);

                // We don't really need $timeCard for comparisons, only for storing in the completed object. Use $eventTime
                // for comparing in this function
                $eventTime = strtotime($curTime) + $secondsOut;
                //reporterror('server/event.php->createEvent()->before finding insert location', 'events list: '. json_encode($eventList));
                // Find the first event that takes place 'after' this event should. If $eventList is empty, this returns null
                $nextEventId = JSFindIndex($eventList, function($ele) use ($eventTime) {
                    return strtotime($ele['timepoint']) > $eventTime;
                });
                if($nextEventId===null || $nextEventId===0) {
                    // Whether $eventList is empty or not, this goes at the front of the list
                    $nextEventId = 1;
                }
                array_splice($eventList, $nextEventId-1, 0, [[
                    'player'=>$player,
                    'mapid'=>$mapId,
                    'task'=>$task,
                    'detail'=>$detail,
                    'timepoint'=>$timeCard->format('Y-m-d H:i:s'),
                    'worldaffected'=>$worldAffected
                ]]);
                return;
            }
        }

        // This event is either not during event processing, or will happen later than current time. Add this to the database
        if($curTime==="NOW()") {
            DanDBList("INSERT INTO sw_event (player, mapID, task, detail, timepoint, worldaffected) VALUES ".
                      "(?,?,?,?,DATE_ADD(NOW(), INTERVAL ? SECOND), ?);", 'iissii', [$player, $mapId, $task, $detail, $secondsOut, $worldAffected],
                      'server/event.php->createEvent()->save event to database with now()');
        }else{
            DanDBList("INSERT INTO sw_event (player, mapID, task, detail, timepoint, worldaffected) VALUES ".
                      "(?,?,?,?,DATE_ADD(?, INTERVAL ? SECOND), ?);", 'iisssii',
                      [$player, $mapId, $task, $detail, $curTime, $secondsOut, $worldAffected],
                      'server/event.php->createEvent()->save event to database with other time');
        }
    }

    function processEvents($mapContent) {
        // Handles processing all events for a given map location
        // $mapContent - full content package of the map, that is provided from the server

        global $eventList;
        global $eventProcessingActive;

        // Go ahead and grab all events that need to be processed, and put them into the eventList
        $eventList = DanDBList("SELECT * FROM sw_event WHERE (mapid=? OR worldaffected=1) AND timepoint<NOW() ORDER BY timepoint ASC;",
                               'i', [$mapContent['id']], 'server/event.php->processEvents()->get all events to process');
        // While picking them up, we also need to delete all the same events
        DanDBList("DELETE FROM sw_event WHERE (mapid=? OR worldaffected=1) AND timepoint<NOW();", 'i', [$mapContent['id']],
                  'server/event.php->processEvents()->delete all collected events');
        
        // This is really for error avoidance
        $curTime = strtotime(DanDBList("SELECT NOW() AS curTime;", '', [], 'server/event.php->processEvents()->get current time')[0]['curTime']);
        $lastResourceEventTime = $curTime;
        
        $eventProcessingActive = true;
        // Instead of doing a simple for-each loop, we need to account for new events being added to the list
        while(sizeof($eventList)>0) {
            $event = array_shift($eventList); // This pulls the first element, while returning it.

            // Check that $curTime and $event['timepoint'] are valid values
            //reporterror('server/event.php->processEvents()->before checking events time',
            //            '$event='. json_encode($event) ."\r\n $event[timepoint]=". strtotime($event['timepoint']) .', $curTime='. $curTime);

            // Do some error checking on this
            if(strtotime($event['timepoint']) >= $curTime) {
                // This event happens either now or after current time. Go ahead and put it back in the database
                DanDBList("INSERT INTO sw_event (player, mapID, task, detail, timepoint, worldaffected) VALUES (?,?,?,?,?,?);", 'iisssi', 
                          [$event['player'], $event['mapID'], $event['task'], $event['detail'], $event['timepoint'], $event['worldaffected']],
                          'server/event.php->ProcessEvents()->re-insert event into database');
                $myTime = DateTime::createFromFormat('Y-m-d H:i:s', $curTime);
                reporterror('server/event.php->ProcessEvents()', 'Warning: found event happening now or in future. Data='.
                            json_encode($event) .', curTime='. $myTime->format('Y-m-d H:i:s'));
                continue;
            }

            switch($event['task']) {
                case 'BuildingUpgrade':
                    // This handles upgrading an existing building. Note that we have already set the level of the building, so we
                    // don't really need to do any work here; the event itself is a trigger to prevent it from operating
                    // Later on, we may add additional operations here (maybe make a building start operating or whatever),
                    // but right now there's nothing to do here
                break;
                case 'ResourceEmpty':
                    $timeDiff = abs(strtotime($event['timepoint'])-$lastResourceEventTime);
                    if($timeDiff<10) {
                        reporterror('server/event.php->processEvents()->case ResourceEmpty', 'Warning: Next process only '. $timeDiff .
                                    ' seconds apart. Ignoring this event');
                    }
                    $lastResourceEventTime = strtotime($event['timepoint']);

                    // This event is simple. Advance the processes to the event's time, and then update all processes to handle
                    // new production rates
                    $mapContent = advanceProcesses($mapContent, $event['timepoint']);
                    $mapContent = updateProcesses($mapContent, $event['timepoint']);
                    // We could save the map content now, but we may need to do that again later
                break;
                case 'CheckPopulation':
                    // Here, we verify if we can change the population for this tile
                    // We already have mapContent, so no need to grab that again
                    [$mapContent, $isUpdated] = updatePopulation($mapContent, $event['timepoint']);
                    if($isUpdated) {
                        // The population really did change. We need to update resource production rates. Before we can do that,
                        // we need to advance resource calculations to the time of the event
                        $mapContent = advanceProcesses($mapContent, $event['timepoint']);
                        $mapContent = updateProcesses($mapContent, $event['timepoint']);
                    }
                    // Don't forget to create another event for the next cycle!
                    createEvent(0, $mapContent['id'], 'CheckPopulation', '', $event['timepoint'], 1800, false);
                break;
                case 'Expedition':
                    // Here, we need to collect some data about the remote tile the colonist was sent to
                    // Start by getting the # of travellers, for use later
                    $jSon = json_decode($event['detail'], true);

                    // Get the player's data to determine the distance to get home
                    $playerData = DanDBList("SELECT * FROM sw_player WHERE id=?;", 'i', [$event['player']],
                                            'server/event.php->processEvents()->case Expedition->get player data');
                    if(sizeof($playerData)===0) {
                        reporterror('server/event.php->processEvents()->case Expedition->get player data',
                                    'player data with id='. $event['player'] .' was not found. Expedition aborted');
                        continue;
                    }
                    $playerData = $playerData[0];

                    // Get information about the target land
                    $targetData = DanDBList("SELECT * FROM sw_map WHERE id=?;", 'i', [$event['mapid']],
                                            'server/event.php->processEvents()->case Expedition->get map data');
                    if(sizeof($targetData)===0) {
                        reporterror('server/event.php->processEvents()->case Expedition->get map data',
                                    'map data with id='. $event['mapid'] .' was not found. Expedition aborted');
                        continue;
                    }

                    // We will then create a new event for the colonist to get home
                    createEvent(
                        $event['player'],
                        $jSon['fromTile'],
                        'ExpeditionReturn',
                        json_encode([
                            'travellers'=>$jSon['travellers'],
                            'fromTile'=>$event['mapid'],
                            'fromX'=>$targetData[0]['x'],
                            'fromY'=>$targetData[0]['y'],
                            'newsdate'=>$event['timepoint'],
                            'mapOwner'=>$targetData[0]['owner'],
                            'pop'=>$targetData[0]['population'],
                            'civ'=>$targetData[0]['civilization'],
                            'biome'=>$targetData[0]['biome'],
                            'items'=>$jSon['items']
                        ]),
                        $event['timepoint'],
                        300 * manhattanDistance($jSon['fromX'], $jSon['fromY'], $targetData[0]['x'], $targetData[0]['y']),
                        1
                    );
                    // We need to update this to grab more data now, instead of later
                break;

                case 'ExpeditionReturn':
                    // The expedition has returned, and we can now add information to the user's known map
                    $jSon = json_decode($event['detail'], true);

                    // We should be able to generate everything from the details provided by the event
                    worldMap_updateKnown($event['player'], $jSon['fromX'], $jSon['fromY'], $jSon['newsdate'], $jSon['mapOwner'],
                                         $jSon['civ'], $jSon['pop'], $jSon['biome']);
                    
                    // For any items the travellers took with them, we can return it to the local block's stockpile,
                    // minus any food consumed during the trip
                    // To determine how much food was consumed, we need to determine the distance travelled
                    // We have the 'source' tile as a map ID from the event, but not its coordinates. We need to grab its
                    // data set anyway, to modify it
                    $sourceTile = DanDBList("SELECT * FROM sw_map WHERE id=?;", 'i', [$event['mapid']],
                                            'server/event.php->processEvents()->case ExpeditionReturn->get local map content')[0];
                    $distance = manhattanDistance($jSon['fromX'], $jSon['fromY'], $sourceTile['x'], $sourceTile['y']) * 2;
                    // Filter out enough food to compensate for the length of the trip. We need to handle situations where one food
                    // runs out but another doesn't. To handle this, we will first map to reduce certain items to zero, then filter
                    // out any items that are at zero
                    foreach($jSon['items'] as &$item) {
                        if($item['isFood']==1 && $distance>0) {
                            if($item['amount']>$distance) { 
                                // This is enough to cover the rest
                                $item['amount']-= $distance;
                                $distance = 0;
                            }else{
                                $distance -= $item['amount'];
                                $item['amount'] = 0;
                            }
                        }
                    }
                    $itemsRemain = array_filter($jSon['items'], function($ele) {
                        return ($ele['amount']>0);
                    });
                    reporterror('server/event.php->processEvents()->case ExpeditionReturn->debug food consumption',
                                'Start='. sizeof($jSon['items']) .', End='. sizeof($itemsRemain) .', Distance='. $distance);
                    // For expeditions, we should already have all the item types existing in the list. We will just map through
                    // and update each one
                    $sourceTile['items'] = json_encode(
                        array_map(function($ele) use ($itemsRemain) {
                            $item = JSFind($itemsRemain, function($in) use ($ele) {
                                return $in['name']===$ele['name'];
                            });
                            if($item==null) return $ele;
                            $ele['amount'] += $item['amount'];
                            return $ele;
                        }, json_decode($sourceTile['items'], true))
                    );

                    // We also need to update the population of this location. This will involve updating production rates
                    advanceProcesses($sourceTile, $event['timepoint']);
                    $sourceTile['population'] += $jSon['travellers'];
                    updateProcesses($sourceTile, $event['timepoint']);

                    // Update the local map record with the missing items (and members)
                    DanDBList("UPDATE sw_map SET population=?, items=?, processes=? WHERE id=?;", 'issi',
                              [$sourceTile['population'], $sourceTile['items'], $sourceTile['processes'], $sourceTile['id']],
                              'server/route_worldMap.php->route_startWorldAction()->case expedition->save map after items removal');

                    // That should be everything
                break;
            }
        }

        // Now would be a good time to save all the editable fields of the map content
        DanDBList("UPDATE sw_map SET population=?, resourceTime=?, items=?, processes=? WHERE id=?;", 'isssi',
                  [$mapContent['population'], $mapContent['resourceTime'], $mapContent['items'], $mapContent['processes'], $mapContent['id']],
                  'server/event.php->processEvents()->save map after all events');
        return $mapContent;
    }
?>