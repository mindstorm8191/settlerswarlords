/*  game.jsx
    Holds the core game object, controlling all functionality of game operations
    For the game Settlers & Warlords
*/

import { DanLog } from "./libs/DanLog.js";
import { DanCommon } from './libs/DanCommon.js';

import { minimapTiles } from './minimapTiles.js';
import { LeanTo } from "./structures/LeanTo.jsx";

export const game = {
    timerLoop: null, // Contains a timer handle when the game starts
    tiles: [], // all tiles of the local map
    workers: [], // all workers on this map
    updateWorkers: null, // references React's setLocalWorkers function. Gets updated on game setup
    structures: [], // all structures added to this map
    localMapBiome: '',

        // Each structure needs a unique ID
    lastStructureId: 0,
    getNextStructureId: ()=>{
        game.lastStructureId++;
        return game.lastStructureId;
    },

    tasks: [],
    lastTaskId: 0, // All tasks also need IDs
    getNextTaskId: ()=>{
        game.lastTaskId++;
        return game.lastTaskId;
    },

    structureTypes: [
        LeanTo()
    ],

    setup: (content, funcUpdateWorkers) => {
        // Sets up the game, using content received from the server
        // content - all content received from the server, as it was provided. It should contain the following
        //      result - should be 'success'. This flag is checked prior to this function
        //      userid - ID of the player
        //      usertype - should be 'player'. If not 'player' this function shouldn't be ran
        //      ajaxcode - code used to validate client messages
        //      localContent - object containing:
        //          biome - Name of the biome of this area
        //          population - How many workers are located here
        //      localTiles - list of all tiles for this area
        //      structures - all structures built in this area
        //      workers - list of all workers in this area. Each worker will have the fields:
        //          name - name of this worker. We try to make this unique, but we have only so many names to use
        //          id - unique ID of this worker (unique to the entire game)
        //          x - x coordinate on the local map
        //          y - y coordinate on the local map
        //          status - work state of this worker. Either 'idle' or 'working'
        //          moveCounter - how many ticks remain before this worker can move from the tile they're in
        //          tasks - list of tasks this worker has
        //          carrying - list of items this worker is carrying. They can usually carry only one item
        //          walkPath - planned path of this worker as a string of ints
        //      tasks - all existing tasks for this area
        //      unlockedItems - all items unlocked in this area
        // funcUpdteWorkers - function handle provided by React to update workers
        // No return value

        // Manage unlocked items here

        game.localMapBiome = content.localContent.biome;
        //let reports = 0;

        // All tiles have their items sent as JSON, we'll have to convert that to objects. We'll also need to separate items from groupings,
        // as they are originally  We also have to include a modified field, to
        // denote any tiles that have been modified.
        game.tiles = content.localTiles.map((t) => {
            let source = JSON.parse(t.items);
            let items = [];
            for (let x = 0; x <= source.length - 1; x++) {
                if (typeof source[x].amount !== "undefined") {
                    let count = source[x].amount;
                    delete source[x].amount;
                    for (let y = 0; y < count; y++) {
                        items.push(source[x]);
                    }
                } else {
                    items.push(source[x]);
                }
            }
            return { ...t, items: items, modified: false };
        });

        game.workers = content.workers; // the server already creates a tasks list for workers
        game.updateWorkers = funcUpdateWorkers;
        game.updateWorkers(game.workers);

        // Now we're ready to start up the game
        game.start();
    },

    start: ()=>{
        // A public function to get the game started, making the game ticks happen at regular intervals
        game.tickTime = new Date().valueOf();
        game.runState = 1;
        game.timeout = setTimeout(function() {
            window.requestAnimationFrame(game.tick);
        }, 50);
    },

    tick: ()=>{
        //Handles update to the local game world. This function should run about once every 50 ticks, or 20 times a second
        if(game.runState===0) return; // Break the continuous cycle if the game has actually stopped

        // Manage the workers
        let hasWorkerUpdate = false;
        for(let i=0; i<game.workers.length; i++) {
            hasWorkerUpdate ||= updateWorker(game.workers[i]);
        }
        if(hasWorkerUpdate) game.updateWorkers([...game.workers]);

        // Handle time management
        let newTime = new Date().valueOf();
        let timeDiff = newTime - game.tickTime;
        game.tickTime = newTime;
        // timeDiff is the amount of time from last frame to this frame. It should be about 50 milliseconds, including the time it took to
        // complete the frame. If the game is running slow, this will be larger; so we will need to reduce the timeout length to compensate
        timeDiff -= 50;
        if(timeDiff<0) timeDiff = 0;
        game.timeout = setTimeout(function() {
            window.requestAnimationFrame(game.tick);
        }, 50 - timeDiff);
    },

    createTask: (building, task)=>{
        // Generates a new task, assigning it to the game object and to the respective building.
        //  building - what building this task is associated with
        //  task - class details to generate a task instance from

        // All tasks start without a worker assigned to it; it will be assigned later

        // Task location depends on settings in the task
        let targetx = null;
        let targety = null;
        if(task.workLocation==='structure') {  //if(task.workAtStructure) {
            targetx = building.x;
            targety = building.y;
        }

        let newtask = {
            id: game.getNextTaskId(),
            building: building,
            task: task,
            status: 'unassigned',
            taskType: task.taskType,
            worker: null,
            targetx: targetx,
            targety: targety,
            //itemsNeeded: [] - this data will be pulled as static information from the root task object. No need to keep it here
            itemsTagged: [],
            progress: 0,
            //ticksToComplete - this will also be from the root task object
        };
        // Work on this task won't begin until all the needed items are in the tile inventory at [targetx,targety]

        game.tasks.push(newtask);
        building.activeTasks.push(newtask.id);
        return newtask;
    }
};

function updateWorker(worker) {
    // Handles updating a worker.
    // Returns true if the worker's location has changed, or false if not. This is used to determine if the map needs to be re-rendered

    if(worker.tasks.length===0) {
        // This worker has no task. Let's find one to assign them

        let foundTask = game.tasks.find(task=>task.worker===null);
        if(typeof(foundTask)==='undefined') {
            // No work to do. Just sit here idle
            // We may later have this worker do idle things, or go do something enjoyable. But we don't have that yet
            worker.status = 'idle';
            return false;
        }

        // Add this worker to the task, so it can start being worked
        foundTask.worker = worker;
        worker.tasks.push(foundTask);
        worker.walkPath = '';
        console.log(worker.name +' assigned task '+ foundTask.task.name);
    }

    // Validate all the items needed for this task.
    // If an item is not at the job site, generate a task to move the item there
    // If a needed item doesn't exist, generate a task to create it
    // We don't have any tasks that need items - yet. We'll add this code once we do

    return moveWorker(worker, ()=>{
        console.log('Jam time!');
    });
}

function moveWorker(worker, callback) {
    // Manages moving workers between tiles. When the worker is at the target location, the callback function
    // will be called
    //      worker - what worker to do this task for.  The worker is assumed to have a task; this will exit if they don't.
    //          The task will contain the target location for this worker
    //      callback - called if the worker is at the correct location
    // Returns true if the worker's location changed, or false if not.

    if(worker.tasks.length===0) return false;
    if(typeof(worker.tasks[0].targetx)==='undefined' || worker.tasks[0].targetx===null) return false;

    // If the workers are at the correct location, use the callback
    if(worker.x===worker.tasks[0].targetx && worker.y===worker.tasks[0].targety) {
        callback();
    }

    // Check the worker's current walkPath. If it is empty, we need to generate a new path to the target location
    if(worker.walkPath==='') {
        let filledTiles = [];
        // Fill the worker's current location
        filledTiles.push({
            x:worker.x,
            y:worker.y,
            travelled:0,
            dist:DanCommon.manhattanDist(worker.x, worker.y, worker.tasks[0].targetx, worker.tasks[0].targety),
            path:'',
        });
        

        let runState = true;
        while(runState) {
            // Start by sorting all the filled tiles. We will sort only so that travelled distance is the lowest. For two tiles with matching
            // distance, the one with a lower distance-to-target will be first.
            filledTiles.sort((a,b)=>{
                if(a.travelled > b.travelled) return 1;
                if(a.travelled < b.travelled) return -1;
                // if both of those failed, travelled is identical
                if(a.dist > b.dist) return 1;
                return -1;
            });

            //console.log(filledTiles);

            // Get the tile data for the current tile
            let tile = game.tiles.find(t=>t.x===filledTiles[0].x && t.y===filledTiles[0].y);
            let land = (tile.newlandtype===-1)?tile.landtype : tile.newlandtype;
            let lag = minimapTiles.find(tile=>tile.id===land).walkLag;

            // Determine the 'work' needed to get to each neighboring tile (if that tile hasn't been
            // filled yet)
            for(let dx=-1; dx<=1; dx++) {
                for(let dy=-1; dy<=1; dy++) {
                    // Make sure this location isn't outside the map boundaries
                    if(filledTiles[0].x + dx < 0) continue;
                    if(filledTiles[0].x + dx > 40) continue;
                    if(filledTiles[0].y + dy < 0) continue;
                    if(filledTiles[0].y + dy > 40) continue;

                    let diagonals = (dx===0 || dy===0)? 1 : 1.4

                    // Also make sure this location hasn't been filled by something else (that's a shorter distance)
                    let locationMatch = filledTiles.findIndex(tile=>tile.x===filledTiles[0].x + dx && tile.y===filledTiles[0].y + dy);
                    if(locationMatch!==-1) {
                        // There's already a tile here. See if it's closer
                        if(filledTiles[0].travelled + lag < filledTiles[locationMatch].travelled) {
                            filledTiles.splice(locationMatch, 1);
                            filledTiles.push({
                                x: filledTiles[0].x + dx,
                                y: filledTiles[0].y + dy,
                                travelled: filledTiles[0].travelled + (lag * diagonals),
                                dist: DanCommon.manhattanDist(filledTiles[0].x+dx, filledTiles[0].y+dy, worker.tasks[0].targetx, worker.tasks[0].targety),
                                path: filledTiles[0].path + ( (dy+1)*3 + (dx+1))
                            });
                            continue;
                        }
                        // This tile is further away. Do nothing with this location
                        continue;
                    }

                    // Before adding the next tile, determine if the new location will be our target.
                    if(filledTiles[0].x + dx===worker.tasks[0].targetx && filledTiles[0].y + dy===worker.tasks[0].targety) {
                        runState = false;
                        worker.walkPath = filledTiles[0].path + ((dy+1)*3 + (dx+1));
                        continue;
                    }

                    // Add this location to the filled tiles
                    filledTiles.push({
                        x: filledTiles[0].x + dx,
                        y: filledTiles[0].y + dy,
                        travelled: filledTiles[0].travelled + (lag * diagonals),
                        dist: DanCommon.manhattanDist(filledTiles[0].x+dx, filledTiles[0].y+dy, worker.tasks[0].targetx, worker.tasks[0].targety),
                        path: filledTiles[0].path + ( (dy+1)*3 + (dx+1))
                    });
                }
            }

            // Now clear out this tile from the list
            // We might need to keep these tiles for 'history'. If so, all tiles need a 'solved' field added. We will sort all these to the
            // end of the list. But we'll see...
            filledTiles.splice(0,1);
        }
        console.log("Path: "+ worker.walkPath);
    }

    // See if we have waited long enough on this tile
    if(worker.moveCounter>0) {
        worker.moveCounter--;
        //console.log('Lag '+ worker.moveCounter);
        return false;
    }

    // Now, determine where to move to next
    let direction = parseInt(worker.walkPath[0]);
    let dx = (direction % 3) - 1;
    let dy = Math.floor(direction / 3.0) - 1;
    
    let distance = (dx===0 || dy===0)? 1 : 1.4;  // diagonals cost a little more time

    let tile = game.tiles.find(tile=>tile.x===worker.x && tile.y===worker.y);
    if(typeof(tile)==='undefined') {
        console.log(`Error in worker->move: ${worker.name} moved to [${worker.x},${worker.y}] that doesn't exist.
                     Target:[${worker.tasks[0].targetx},${worker.tasks[0].targety}]`);
        worker.moveCounter = 1;
        return true;
    }

    let landType = (tile.newlandtype===-1) ? tile.landtype : tile.newlandtype;
    let tileType = minimapTiles.find(tile=>tile.id===landType);
    if(typeof(tileType)==='undefined') {
        worker.moveCounter = 50;
        console.log(`Error: ${worker.name} is on a tile not in the minimapTiles. Tile type=${landType}`);
    }else{
        worker.moveCounter = tileType.walkLag * distance;
    }

    worker.x += dx;
    worker.y += dy;
    console.log('Move: '+ worker.x +','+ worker.y +' with '+ worker.moveCounter +' lag');
    

    // Don't forget to trim the walk path
    worker.walkPath = worker.walkPath.substring(1);

    return true;
}


