/*  worker.jsx
    Manages worker operations
    For the game Settlers & Warlords
*/

import { game } from "./game.jsx";
import {minimapTiles} from "./minimapTiles.js";
import { chunkSize } from "./App.js";

// Macro level process
// If a worker has a path, follow that path to completion
// If no job, search nearby structures for a job
// If job requires tool
//    Is proper tool equipped? If not, find one and go pick it up
//    Is worker at job site? If not, move to suitable location

// We're starting to deal with jobs that are 'completed', and things are getting difficult to manage. I need to iron out the process, so it can be built with a plan
// Reasons for jobs not being completable at a specific time
// 1) Inventory is full - there is no need to produce any more of this item
// 2) No source items remain around collector building. This (so far) means there won't be any more
// 3) No source items, but possible to get more. This needs a kind of lock-out until the items are available again

export function createWorker(pkg) {
    // Creates a new worker object based on data received from the server. (At this time it's only a location... we'll get more, though)
    let w = {
        id: game.getNextWorkerId(),
        spot: JSON.parse(pkg.spot),
        path: (typeof(pkg.travelpath)==='undefined'?'':pkg.travelpath),
        waitingForPath: false,
        stepProgress: pkg.stepProgress,
        job: null,
        carrying: (typeof(pkg.carrying)==='undefined'?[]:JSON.parse(pkg.carrying)), // list of items this worker is carrying. This is usually a short list
        tick: ()=>{
            // Manages individual worker operations
            if(w.job===null) {
                // This worker is idle. Let's find a job to give them
                for(let i=0; i<game.structures.length; i++) {
                    if(!(game.structures[i].recipe===null)) {   // has a recipe been selected here?
                        if(game.structures[i].workerAssigned===null) {  // is someone else working this recipe?
                            if(game.structures[i].recipe.canWork()) { // can this job be worked right now?
                                // This is a good job to assign
                                w.path = '';
                                w.job = game.structures[i];
                                game.structures[i].workerAssigned = w;
                                return;
                            }
                        }
                    }
                }
                return;
            }

            if(w.path!=='') {
                // We have a path to follow... we should probably work on that first. Whatever needs doing, we need to do it at the end of the path

                // Workers are centered in the tiles, which is like [x.0,x.0]. To move, we need to add (or subtract) to this '.0'.
                // When we reach +/-1.0, we should be centered in the next tile, and can remove the current path step

                // Start with determining if we're moving up or down. We will probably need to handle this part differently than WalkLag...
                // especially when carrying heavy things. But that'll have to come later
                if(w.path[0] ==='u') {
                    console.log('We need to handle up movements!');
                    w.spot[1]++;
                    w.path = w.path.slice(1);
                    return;
                }
                if(w.path[0] === 'd') {
                    console.log('We need to handle down movements!');
                    w.spot[1]--;
                    w.path = w.path.slice(1);
                    return;
                }

                // Advance the worker's position. Factor in diagonals with this. Up-left is the value 0; all even path values are diagonals
                w.stepProgress += (w.path[0]%2===0)?0.714 : 1;
                //console.log(w.stepProgress);

                // See if we have made it to the next tile. For that we'll need the WalkLag of the tile they're in
                let tile = game.tiles[w.spot[0]][w.spot[1]][w.spot[2]];
                let miniTile = minimapTiles.find(t=>t.id===tile.floor);
                let walkLag = 100;
                if(miniTile===null) {
                    console.log('Error - could not find minimapTile for floor id='+ tile.floor);
                }else{
                    walkLag = miniTile.walkLag;
                }
                if(w.stepProgress>=walkLag) {
                    let direction = parseInt(w.path[0]);
                    w.spot[0] += ((direction %3) -1);
                    w.spot[2] += (Math.floor(direction / 3.0) - 1);
                    w.path = w.path.slice(1);
                    w.stepProgress = 0;

                }
                return;
            }
            
            // Before deciding where to go, determine if we need a tool for the given job
            if(w.job.recipe.toolsNeeded.length>0) {
                // See if this worker is already carrying one of the required tools. We'll worry about how to move a worker for this task later

                if(!w.job.recipe.toolsNeeded.some(option => {
                    return w.carrying.some(item => item.name===option);
                    //let result = w.carrying.findIndex(item => item.name===option);
                    //if(result!==-1) {
                    //    console.log('Carrying '+ w.carrying[result].name);
                    //    return true;
                    //}
                    //return false;
                })) {
                    // This worker is not carrying any of the tools they need for this job. Let's look for one now
                    // Start by checking the current tile this worker is located in
                    let tile = game.tiles[w.spot[0]][w.spot[1]][w.spot[2]];
                    let slot = (typeof(tile.items)==='undefined')? -1 : tile.items.findIndex(i=>{
                        return w.job.recipe.toolsNeeded.some(option => i.name===option);
                    });
                    if(slot!==-1) {
                        // There's already a tool here! Let's pick it up
                        //console.log('Pick up tool '+ tile.items[slot].name);
                        //w.carrying.push(tile.items.splice(slot,1));
                        w.carrying.push(tile.items[slot]);
                        tile.items.splice(slot,1);
                        tile.modified = 1; // If we removed a tool, the tile has been modified
                        return;
                    }else{
                        // Now we need to generate a path to locate a tool
                        if(w.waitingForPath===false) {
                            w.waitingForPath = true;
                            console.log('Need path to find tools');
                            game.pathTo(w.spot[0], w.spot[1], w.spot[2], 100,
                                (tile, position) => {
                                    //console.log(tile.items, w.job.recipe.toolsNeeded);
                                    if(typeof(tile.items)==='undefined') {
                                        console.log('Got tile with no items list at ', position);
                                        return false;
                                    } 
                                    return tile.items.some(item => w.job.recipe.toolsNeeded.some(option => item.name===option));
                                },
                                (result) => {
                                    w.waitingForPath = false;
                                    if(result.result==='success') {
                                        // Take this path and go out to the tool
                                        w.path = result.path;
                                        //console.log('Use path to get tool: '+ w.path);
                                    }else{
                                        // We can't work this job because there's no tools available. We should unassign it
                                        // To do: Tag this job as being unable to be assigned. We should wait like a minute before allowing someone else to pick up the task
                                        // To do: Find a more reliable way to detect when a job can again be completed. Maybe a flag to denote when a tool nearby has been created
                                        console.log('Could not find any tools for this job');
                                        w.job.workerAssigned = null;
                                        w.job = null;
                                    }
                                }
                            );
                            return;
                        }
                    }
                }else{
                    // We already have the correct tool in hand to perform this job. Now we need to get to the place needed to complete it
                    // First, see if we're already at the correct location
                    if(w.job.recipe.workLocation(game.tiles[w.spot[0]][w.spot[1]][w.spot[2]], [w.spot[0], w.spot[1], w.spot[2]])) {
                        // This is a place where we can do work... so let's do it
                        w.job.recipe.doWork();
                        return;
                    }
                    // We're not at the correct location. We should generate a path to that place
                    if(w.waitingForPath===false) {
                        w.waitingForPath = true;
                        game.pathTo(w.spot[0], w.spot[1], w.spot[2], 50,
                            (tile, position) => {
                                return w.job.recipe.workLocation(tile, position);
                            },
                            (result) => {
                                w.waitingForPath = false;
                                if(result.result==='success') {
                                    w.path = result.path;
                                    //console.log('Use path to get to job: '+ w.path);
                                }else{
                                    console.log('Could not find any job site for this job');
                                    w.job.workerAssigned = null;
                                    w.job = null;
                                }
                            }
                        )
                    }
                    return;
                }
            }

            //console.log(w);
            // Determine if the worker is at the correct location to do this job
            if(typeof(game.tiles[w.spot[0]])==='undefined' ||
               typeof(game.tiles[w.spot[0]][w.spot[1]])==='undefined' ||
               typeof(game.tiles[w.spot[0]][w.spot[1]][w.spot[2]])==='undefined') {
                console.log("Error - worker's tile is not found!");
            }else{
                if(w.job.recipe.workLocation(game.tiles[w.spot[0]][w.spot[1]][w.spot[2]],w.spot)) {
                    //if(w.job==='Item Mover') console.log('Worker at location');
                    w.job.recipe.doWork();
                    return;
                }
            }

            // We need to move this worker to the correct place to complete this job
            // We don't have a path yet... are we creating one?
            if(w.waitingForPath===false) {
                w.waitingForPath = true;
                console.log('Worker id='+ w.id +' working for structure '+ w.job.name +' needs a target. Worker at ['+ w.spot[0] +','+ w.spot[1] +','+ w.spot[2] +'], structure at ['+
                            w.job.position[0] +','+ w.job.position[1] +','+ w.job.position[2] +']');
                //console.log('Worker target for '+ w.job.name +': ['+ w.job.position[0] +','+ w.job.position[1] +','+ w.job.position[2] +']');
                game.pathTo(w.spot[0], w.spot[1], w.spot[2], 100,
                    w.job.recipe.workLocation,
                    //(tile,position) => {
                        // Check if the given tile or location is where we need to be
                    //    return (position[0]===w.job.position[0] && position[1]===w.job.position[1] && position[2]===w.job.position[2]);
                        // Later, the correct position needs to be decided by the structure we're working at - it'll be faster to just plug it in instead
                        // of trying to find some place first, then mapping to it
                    //},
                    (result) => {
                        // On completion, finish setting things up for the worker
                        w.waitingForPath = false;
                        if(result.result!=='success') {
                            console.log('Error in pathfinding: ', result);
                        }else{
                            //console.log()
                            //if(w.job.name==='Item Mover') console.log('Path for itemmover: '+ result.path);
                            w.path = result.path;
                        }
                    }
                );
            }
        }
    };

    // On load, We need to ensure that the game will load the tile that the worker is currently located in.
    // Under normal circumstances, we are operating before any tile (besides the player's tile) is loaded.
    let spot = JSON.parse(pkg.spot);
    let chunkx = Math.floor(spot[0]/chunkSize);
    let chunky = Math.floor(spot[1]/chunkSize);
    let chunkz = Math.floor(spot[2]/chunkSize);
    if(!game.chunksToLoad.some(ch=>ch.x===chunkx && ch.y===chunky && ch.z===chunkz)) {
        game.chunksToLoad.push({x:chunkx, y:chunky, z:chunkz});
        console.log(game.chunksToLoad[game.chunksToLoad.length-1]);
    }

    return w;
}


