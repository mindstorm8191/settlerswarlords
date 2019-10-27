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
?>