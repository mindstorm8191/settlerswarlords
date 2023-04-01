/*  worker.jsx
    Provides a worker object, that handles all worker operations
    For the game Settlers & Warlords
*/

import { DanCommon } from './libs/DanCommon.js';

import { game } from "./game.jsx";
import { minimapTiles } from './minimapTiles.js'

export function createWorker(pack) {
    // Creates a new worker, based on data recevied from the server
    //  pack - worker data received from the server. It should contain the following
    //      name - A randomly selcted name given to this worker
    //      id - An ID, unique to all workers in the world
    //      x - X coordinate
    //      y - Y coordinate
    //      status - current status of this worker. Currently only 'idle', this will change to 'working' in the future
    //      moveCounter - how far along they are in moving between tiles
    //      tasks - A list of task IDs this worker is assigned to
    //      carrying - A list of items carried by this worker
    //      walkPath - A string of numbers representing this worker's path to their next destination
    // No return value. This worker will be added to the Game object

    let w = {
        name: pack.name,
        id: pack.id,
        x: pack.x,
        y: pack.y,
        status: pack.status,
        moveCounter: pack.moveConter,
        tasks: pack.tasks,      // This needs to be converted to the actual task instance, but tasks are loaded after workers; it will be converted then
        carrying: pack.carrying,
        walkPath: pack.walkPath,

        tick: () => {
            // Handles worker actions every game tick
            // Returns true if the worker location was updated, or false if not. (This can be OR'd with other worker tick results to see if any
            // have moved)

            // See if this worker has any current work
            if(w.tasks.length===0) {
                let foundTask = game.tasks.find(task=>task.worker===null);
                if(typeof(foundTask)==='undefined') {
                    w.status = 'idle';
                    return false;
                }

                // Assign this task to this worker
                foundTask.worker = w;
                w.tasks.push(foundTask);
                w.walkPath = '';
                console.log(w.name +' assigned task '+ foundTask.task.name);
            }

            //console.log(w.name +' to move to '+ w.tasks[0].targetx +','+ w.tasks[0].targety);

            // Now manage worker movement
            return w.move(()=>{
                console.log('Do task '+ w.tasks[0].task.name);
            });
        },

        move: callback => {
            // Handles worker movement
            //  callback - This is called when the worker is at the right position. This should return true only if the worker's position has
            //      changed
            // Returns true if this worker's location has changed, or false if not.

            if(w.tasks.length===0) return false;
            if(typeof(w.tasks[0].targetx)==='undefined' || w.tasks[0].targetx===null) return false;

            // Check if the worker is at the right location
            if(w.x===w.tasks[0].targetx && w.y===w.tasks[0].targety) {
                return callback();
            }

            // Check the worker's walkPath. If it is empty, generate a new path to the right location
            if(w.walkPath==='') {
                w.createPath();
                console.log(w.name +' got path '+ w.walkPath);
            }

            // See if we have waited long enough on this current tile
            if(w.moveCounter>0) {
                w.moveCounter--;
                return false;
            }

            // We are ready to move somewhere. Determine where to move next
            let direction = parseInt(w.walkPath[0]);
            let dx = (direction % 3) -1;
            let dy = Math.floor(direction / 3.0) - 1;
            let diagonals = (dx===0 || dx===0) ? 1 : 1.4; // make diagonals need a little more time

            let tile = game.tiles.find(tile=>tile.x===w.x && tile.y===w.y);
            if(typeof(tile)==='undefined') {
                console.log(`Error in worker->move: ${w.name} moved to [${w.x},${w.y}] that doesn't exist.
                             Target:[${w.tasks[0].targetx},${w.tasks[0].targety}]`);
            }
            let landType = (tile.newlandtype===-1) ? tile.landtype : tile.newlandtype;
            let tileType = minimapTiles.find(tile=>tile.id===landType);
            if(typeof(tileType)==='undefined') {
                w.moveCounter = 50;
                console.log(`Error: ${w.name} is on a tile not in the minimapTiles. Tile type=${landType}`);
            }else{
                w.moveCounter = tileType.walkLag * diagonals;
            }

            // Don't forget to update the worker's location! And trim the walk path
            w.x += dx;
            w.y += dy;
            w.walkPath = w.walkPath.substring(1);
            return true;
        },

        createPath: ()=>{
            // Creates a path for the worker to reach their destination, using an A* Pathfinding method
            let filledTiles = [];
            // Fill in the worker's location as a starting point
            filledTiles.push({
                x:w.x,
                y:w.y,
                travelled:0,
                dist: DanCommon.manhattanDist(w.x, w.y, w.tasks[0].targetx, w.tasks[0].targety),
                path: ''
            });

            let runState = true;
            while(runState) {
                // Start with sorting all the filled tiles. We will only sort so travelled distance is the lowest
                // For two tiles with matching distance, the one with a lower distance-to-target will be first
                filledTiles.sort((a,b)=>{
                    if(a.travelled > b.travelled) return 1;
                    if(b.travelled < b.travelled) return -1;
                    if(a.dist > b.dist) return 1;
                    return -1;
                });

                // Get tile data for the current tile
                let tile = game.tiles.find(t=>t.x===filledTiles[0].x && t.y===filledTiles[0].y);
                let land = (tile.newlandtype===-1) ? tile.landtype : tile.newlandtype;
                let lag = minimapTiles.find(tile=>tile.id===land).walkLag;

                // Generate more tiles for each possible direction from here
                for(let dx=-1; dx<=1; dx++) {
                    for(let dy=-1; dy<=1; dy++) {
                        // Make sure this tile isn't outside the map boundaries
                        if(filledTiles[0].x + dx < 0) continue;
                        if(filledTiles[0].x + dx > 40) continue;
                        if(filledTiles[0].y + dy < 0) continue;
                        if(filledTiles[0].y + dy > 40) continue;

                        // Diagonals take a bit longer to travel, factor that in here
                        let diagonals = (dx===0 || dy===0) ? 1 : 1.4;

                        // Make sure this location hasn't been filled yet
                        let locationMatch = filledTiles.findIndex(tile=>tile.x===filledTiles[0].x + dx && tile.y===filledTiles[0].y+dy);
                        if(locationMatch!==-1) {
                            // There's already a tile here. Now see if it's a shorter walk than our current path
                            if(filledTiles[0].travelled + (lag * diagonals) < filledTiles[locationMatch].travelled) {
                                // Replace the tile with this new route. Order isn't important, as we'll sort later
                                filledTiles.splice(locationMatch, 1);
                                filledTiles.push({
                                    x: filledTiles[0].x +dx,
                                    y: filledTiles[0].y +dy,
                                    travelled: filledTiles[0].travelled + (lag * diagonals),
                                    dist: DanCommon.manhattanDist(filledTiles[0].x+dx, filledTiles[0].y+dy, w.tasks[0].targetx, w.tasks[0].targety),
                                    path: filledTiles[0].path + ( (dy+1)*3 + (dx+1))
                                });
                            }
                            // If the tile isn't further away, we don't need to do anything with this location
                            continue;
                        }

                        // Before adding the next tile, see if it will be our target
                        if(filledTiles[0].x +dx === w.tasks[0].targetx && filledTiles[0].y+dy === w.tasks[0].targety) {
                            // We made it! Now update the worker, and don't forget this last step
                            w.walkPath = filledTiles[0].path + ((dy+1)*3 + (dx+1));
                            return;
                        }

                        // Add this location to the list
                        filledTiles.push({
                            x: filledTiles[0].x +dx,
                            y: filledTiles[0].y +dy,
                            travelled: filledTiles[0].travelled + (lag * diagonals),
                            dist: DanCommon.manhattanDist(filledTiles[0].x+dx, filledTiles[0].y+dy, w.tasks[0].targetx, w.tasks[0].targety),
                            path: filledTiles[0].path + ((dy+1)*3 + (dx+1))
                        });
                    }
                }

                // Remove this tile
                filledTiles.splice(0,1);
            }
        }
    }

    game.workers.push(w);
    //return w;
}