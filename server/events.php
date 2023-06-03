<?php
    /*  events.php
        Handles processing events after the point in time that they should happen
        For the game Settlers & Warlords
    */

    $eventsList = [];
    // All past-happened events will be loaded into this list, and kept in date-time ordering. Any events spawned by existing events - that happen
    // before NOW() - will be added to the same list, and get processed from this function. Any events spawned by existing events after NOW()
    // will be saved to the database for future processing

    function processEvents() {
        // Handles processing all events as they happen
        global $eventsList;

        // Keep a list of event IDs so they can be deleted when we're finished with them
        $finishedEvents = [];

        // Start with filling our list with events
        $eventsList = DanDBList("SELECT * FROM sw_event WHERE timepoint < NOW();", '', [],
                                'server/events.php->processEvents()->get all passed events');
        if(sizeof($eventsList)==0) return; // aka we found no events to process
        while(sizeof($eventsList)>0) {
            $event = array_shift($eventsList);
            // each event will have details stored as json content. We should split that now
            $event['detail'] = json_decode($event['detail'], true);

            // Process this event
            switch($event['task']) {
                case 'unittravel':
                    // Start by getting the travel group data
                    $traveler = DanDBList("SELECT * FROM sw_traveler WHERE id=?;", 'i', [$event['detail']['traveler']],
                                          'server/events.php->processEvents()->case unittravel->get traveler group')[0];
                    $traveler['detail'] = json_decode($traveler['detail'], true);
                    
                    // Start by seeing if these travelers are at the target location, or at home
                    if($event['detail']['targetx']==$traveler['sourcex'] && $event['detail']['targety']==$traveler['sourcey']) {
                        // These travelers have made it home.
                        // Before 'disbanding' the group, see if they have any details relevant to hold on to
                        for($i=0; $i<sizeof($traveler['detail']); $i++) {
                            switch($traveler['detail'][$i]['name']) {
                                case 'knownmapentry':
                                    // Create a known map entry for this player
                                    DanDBList("INSERT INTO sw_knownmap (playerid, x, y, lastcheck, owner, civ, population, biome) VALUES (?,?,?,?,?,?,?,?);",
                                              'iiisiiii', [$traveler['player'], $traveler['detail'][$i]['x'], $traveler['detail'][$i]['y'],
                                                           $traveler['detail'][$i]['lastseen'], 0, $traveler['detail'][$i]['civ'], 0,
                                                           $traveler['detail'][$i]['biome']],
                                              'server/events.php->processEvents()->case unittravel->save to known map');
                                break;
                            }
                        }

                        // Now delete this traveling group
                        DanDBList("DELETE FROM sw_traveler WHERE id=?", 'i', [$traveler['id']],
                                  'server/events.php->processEvents()->case unittravel->remove travelers once home');
                        if($event['id']>0) array_push($finishedEvents, $event['id']);
                        break;
                    }else {

                        // Update this group's location
                        // Determine if they have reached their destination
                        // Destination is stored... in the event details
                        DanDBList("UPDATE sw_traveler SET x=?, y=? WHERE id=?;", 'iii',
                                    [$event['detail']['targetx'], $event['detail']['targety'], $traveler['id']],
                                    'server/events.php->processEvents()->case unittravel->update traveler location');
                        
                        // We will also need to create a new event for actually scouting this territory
                        createNewEvent('scout', json_encode(['traveler'=>$traveler['id']]), $event['timepoint'], 300);

                        if($event['id']>0) array_push($finishedEvents, $event['id']);
                    }
                break;
                case 'scout':
                    // The travelers here have finished scouting the area they're at
                    // At this point we need to update the user's knownMap, so they know some basic data about this tile
                    // Actually, the player won't receive knownMap information until our scout worker has returned home
                    // Instead, this needs to be something that the traveling group carries home with them
                    $traveler = DanDBList("SELECT * FROM sw_traveler WHERE id=?;", 'i', [$event['detail']['traveler']],
                                          'server/events.php->processEvents()->case scout->get traveler group')[0];
                    $traveler['detail'] = json_decode($traveler['detail'], true);
                    
                    // We also need to get some basic facts about the tile these travelers are at
                    $tile = DanDBList("SELECT * FROM sw_map WHERE x=? AND y=?;", 'ii', [$traveler['x'], $traveler['y']],
                                      'server/events.php->processEvents()->case scout->get map info')[0];
                    array_push($traveler['detail'], [
                        'name'=>'knownmapentry', // actually, we will probably have a lot of these as travelers go over the map
                        'x'=>$traveler['x'],
                        'y'=>$traveler['y'],
                        'lastseen'=>$event['timepoint'],
                        'biome'=> $tile['biome'],
                        'civ'=>$tile['civilization']
                    ]);
                    // With that information, save the details info back to the database
                    DanDBList("UPDATE sw_traveler SET detail=? WHERE id=?;", 'si', [json_encode($traveler['detail']), $traveler['id']],
                              'server/events.php->processEvents()->case scout->save traveler');
                    
                    // Also make the event for the travelers to get back home
                    createNewEvent('unittravel', json_encode([
                        'traveler'=>$traveler['id'],
                        'fromx'=>$traveler['x'],
                        'fromy'=>$traveler['y'],
                        'targetx'=>$traveler['sourcex'],
                        'targety'=>$traveler['sourcey']
                    ]), $event['timepoint'], 60*5);

                    if($event['id']>0) array_push($finishedEvents, $event['id']);
                break;
                default:
                    reporterror('server/events.php->processEvents()->handle each event',
                                'Event type of '. $event['task'] .' has no code. No action taken');
            }
        }

        // After we have completed all the above events, we need to delete them from the database
        // Unfortunately, we won't be able to use the variable binding feature here
        DanDBList("DELETE FROM sw_event WHERE id IN(". implode(',', $finishedEvents) .");", '', [],
                  'server/events.php->processEvents()->delete finished events');
    }

    function createNewEvent($action, $details, $timereference, $duration) {
        // Creates a new event. If the event happens before NOW(), it will be aded to eventsList in the correct position of events. If it happens
        // after NOW(), it will be saved to the database.
        // $action - what action is to be taken here
        // $details - information specific to this event
        // $timereference - what time point the event will begin from. If working from the current time, pass the string "NOW()"
        // $duration - how long until this event triggers, from the time reference
        // No return value. If the calculated time point is before NOW(), a new entry will be added to $eventsList. If the calculated
        // time point is after NOW(), it will be saved to the database.

        if($timereference=="NOW()") {
            // We already know this has to be saved to the database. Let's do that now... (wait... nvm)
            DanDBList("INSERT INTO sw_event (task,detail,timepoint) VALUES (?,?,DATE_ADD(NOW(), INTERVAL ? SECOND));", 'ssi',
                      [$action, $details, $duration], 'server/events.php->createNewEvent()->create from current time');
            return;
        }

        // Now we have to do some time calculations
        // MySQL offers a solution using TIMESTAMPDIFF
        // While we're here, generate a time difference so we can use it later
        $comp = DanDBList("SELECT TIMESTAMPDIFF(SECOND, NOW(), DATE_ADD(?, INTERVAL ? SECOND)) AS tdiff, DATE_ADD(?, INTERVAL ? SECOND) AS tfuture;",
                           'sisi', [$timereference, $duration, $timereference, $duration],
                           'server/events.php->createNewEvent()->get time difference')[0];
        if($comp['tdiff']>0) {
            // This event should happen in the future
            DanDBList("INSERT INTO sw_event (task,detail,timepoint) VALUES (?,?,?);", 'sss', [$action, $details, $comp['tfuture']],
                      'server/events.php->createNewEvent()->save event to db');
            return;
        }

        // This event point has already passed
        // We need to keep the events in datetime order. We have a function usort() for that. Go ahead and drop the event into the array
        // Note that we don't have an event ID to provide, but that's ok
        array_push($eventsList, [
            'id'=>0,
            'action'=>$action,
            'detail'=>$details,
            'timepoint'=>$comp['tfuture']
        ]);
        usort($eventsList, function($a, $b) {
            $datetime1 = strtotime($a['timepoint']);
            $datetime2 = strtotime($b['timepoint']);
            return $datetime1 - $datetime2;
        });
    }
?>