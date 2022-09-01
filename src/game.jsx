/*  game.jsx
    Holds the core game object, controlling all functionality of the game operations
    For the game Settlers & Warlords
*/

import {minimapTiles} from "./comp_LocalMap.jsx";
import {LeanTo} from "./structures/LeanTo.jsx";
import {ForagePost} from "./structures/ForagePost.jsx";
import {RockKnapper} from "./structures/RockKnapper.jsx";

let clockCounter = 0;

export const game = {
    blockList: [], // All functioning buildings
    tiles: [], // All map tiles of the local map
    timerLoop: null, // This gets updated to a timer handle when the game starts
    updateWorkers: null, // This gets assigned to React's setWorkers call
    updateLocalMap: null, // This also gets assigned to a React callback
    workers: [], // List of all workers (with stats)
    tickTime: 0,
    timeout: null, // We keep this handle so that the timeout can be interrupted
    runState: 0, // Set to 1 when game is running. This is checked at start of game-tick to stop the cycle if the game isn't running
    clockCheck: 0,
    lastBlockId: 0,
    lastWorkerId: 0,

    getNextBlockId: ()=> {
        // Returns the next available block id (for this map area)
        game.lastBlockId++;
        return game.lastBlockId;
    },
    getBlock: (id) => {
        return game.blockList.find(e=>e.id===id);
    },
    getWorkerById: (id)=> {
        return game.workers.find(e=>e.id===id);
    },

    blockCheckAssignedWorkers: (blockId) => {
        // Returns an updated list of all workers currently assigned to the given block.
        // This will probably be moved to an add-on object for structures. But this is the only one we have right now

        return game.workers.filter(wk=>wk.assignedBlock===blockId);
        // ... well, that was a lot simpler than expected. Whatever
    },

    blockTypes: [
        {name:'Lean-To',     image:'leanto.png', create:LeanTo, prereq:[], unlocked:0, newFeatures:[]},
        {name:'Forage Post', image:'foragepost.png', create:ForagePost, prereq:[], unlocked:0, newFeatures:[]},
        {name:'Rock Knapper', image:'rockknapper.png', create:RockKnapper, prereq:[], unlocked:0, newFeatures:[]}
    ],

    prepWorkers: (workers) => {
        // Sets up the worker array that is received from the server, ensuring all workers have the correct fields
        // Returns the updated workers list.
        
        return workers.map((wk) => {
            if(typeof(wk.task)==='undefined') wk.task = "";
            if(typeof(wk.assignedBlock)==='undefined') wk.assignedBlock = 0; // We will only hold the ID of the building we are working at. This will be easier to load, or drop when buildings vanish
            if(typeof(wk.carrying)==='undefined') wk.carrying = [];
            if(typeof(wk.id)==='undefined') {
                game.lastWorkerId++;
                wk.id = game.lastWorkerId;
            }
            if(typeof(wk.aiding)==='undefined') wk.aiding = 0; // This will be the ID of the user that they are helping
            if(typeof(wk.moveCounter)==='undefined') wk.moveCounter = 0;
            return wk;
        });
    },

    setupGame: (localTiles, localWorkers, funcUpdateTiles, funcUpdateWorkers) => {
        // A public function to set up game basics
        // parameters:
        //  localTiles - array of the local tiles, as received by the server
        //  localWorkers - array of the local workers, as received by the server
        //  funcUpdateTiles - callback function from React to update all game tiles
        //  funcUpdateWorkers - callback function from React to udpate all workers

        game.tiles = localTiles;
        game.workers = localWorkers;
        game.updateLocalMap = funcUpdateTiles;
        game.updateWorkers = funcUpdateWorkers;
    },

    startGame: () => {
        // A public function to handle starting the game's timer
        game.tickTime = new Date().valueOf();
        game.runState = 1;
        game.timeout = setTimeout(function () {
            window.requestAnimationFrame(game.tick);
        }, 50);
    },

    stopGame: () => {
        // A public function to stop the game
        clearTimeout(game.timeout);
        game.timeout = null;
        game.runState = 0;
    },

    tick: () => {
        // Handles updates to the local world. This function should run about once every 50 ticks, or 20 times a second
        if(game.runState===0) return; // Break the continuous cycle if the game has actually stopped

        // Start with managing workers
        // The database will provide us with a name, location, and, well, is supposed to provide with the current job (or none).
        // To be honest, jobs haven't been fleshed out enough to push & pull from the database; lets not worry about that for now.

        let hasWorkerUpdate = false; // we only want to update the local map if any workers have actually moved, or something
        let workerUpdate = false;

        // I would use forEach here, but that doesn't allow altering the state of the workers properly. However, we can use .map
        game.workers = game.workers.map(wk => {
            let block = null;
            // First, see if they are working at a particular building

           // if(wk.name==='Eldar') console.log(wk);

            // Now, our action depends on what task we currently have
            switch(wk.subtask) {
                case "construct":
                    // Here, we need to get to the building location, then doWork().
                    // Start by comparing this worker's location to the building's location
                    [wk,workerUpdate] = moveWorker(wk, (wo) => {
                        // We have reached our destination. Next, we need to do work at this building. Specific work will be tied to the
                        // active task at hand.
                        wo.taskInstance.progress++;
                        if(wo.taskInstance.progress<wo.taskInstance.progressTarget) return wo;

                        // Now handle when a worker completes their task. Run onComplete for the given task
                        wo.task.onComplete();
                        // Clear the active task from the structure
                        wo.atBuilding.activeTasks.splice(wo.atBuilding.activeTasks.findIndex(ta=>ta.worker.name===wo.name), 1);
                        // Clear the task from the worker
                        wo.status = 'idle';
                        wo.task = null;
                        wo.subtask = '';
                        wo.atBuilding = null;
                        wo.taskInstance = null;
                        return wo;
                    });
                    if(workerUpdate) hasWorkerUpdate = true;
                break;

                case "workonsite":
                    // Here, we need to move the worker to the location, and they will be able to perform the work there
                    [wk,workerUpdate] = moveWorker(wk, (wo) => {
                        // Similar to the construct task, we will increment progress on this until complete
                        wo.taskInstance.progress++;
                        if(wo.taskInstance.progress<wo.taskInstance.progressTarget) return wo;

                        // This work has been completed
                        wo.task.onComplete();
                        wo.taskInstance.count++;
                        if(wo.taskInstance.count<wo.taskInstance.countTarget) {
                            // We made one, now make the next
                            let pack = wo.task.getTask(wo.x,wo.y);
                            wo.subtask = pack.task;
                            wo.targetx = pack.targetx;
                            wo.targety = pack.targety;
                            wo.targetitem = pack.targetitem;
                            return wo;
                        }

                        // There is no more work to do. Close out the task
                        wo.status = 'idle';
                        wo.task = null;
                        wo.subtask = '';
                        wo.atBuilding = null;
                        wo.taskInstance = null;
                        return wo;
                    });
                    if(workerUpdate) hasWorkerUpdate = true;
                break;

                case 'fetchitem':
                    // Here, we need to (again) get to a certain location. This time, the location is stored in targetx and targety
                    // of the worker.

                    if(typeof(wk.targetitem)==='undefined') {
                        console.log('Error: worker '+ wk.name +' has task fetchitem but target item not defined. Task cancelled');
                        wk.subtask = '';
                        return wk;
                    }
                    if(wk.targetitem==='') {
                        console.log('Error: worker '+ wk.name +' has task fetchitem but no target item to fetch. Task cancelled');
                        wk.subtask = '';
                        return wk;
                    }
                    if(typeof(wk.carrying)==='undefined') wk.carrying = [];  // This seems like an error we can just correct on the spot
                    [wk, workerUpdate] = moveWorker(wk, wo => {
                        // returns the worker object when finished
                        
                        // Before doing anything, we need data about both the block we're working for, and the tile the worker is at
                        if(typeof(wo.atBuilding)==='undefined') {
                            console.log('Error: could not find target block with id='+ wo.assignedBlock +'. Worker task cancelled');
                            wo.subtask = '';
                            return wo;
                        }
                        let workertile = game.tiles.find(e=>e.x===wo.x && e.y===wo.y);
                        if(typeof(workertile)==='undefined') {
                            console.log(`Error: ${wo.name} tried to get/place an item, but tile not found at [${wo.x},${wo.y}]. Task cancelled`);
                            wo.subtask = ''
                            return wo;
                        }
                        if(typeof(workertile.items)==='undefined') {
                            // We can add the items list here, right?
                            console.log(`Error: Tile at [${wo.x},${wo.y}] missing items list. It was added as empty`);
                            workertile.items = [];
                        }

                        // Now, see if we're at the pick-up place, or the put-down place
                        if(wo.atBuilding.x===wo.x && wo.atBuilding.y===wo.y) {
                            // This is where we need to place the item we picked up. First, find the slot of the item in our inventory
                            let slot = wo.carrying.findIndex(e=>e.name===wo.targetitem);
                            if(slot===-1) {
                                console.log(`Error: ${wo.name} tried to place an item, but not carrying it now. Item=${wo.targetitem}, carrying size=${wo.carrying.length}. Worker task cancelled`);
                                wo.task = '';
                                return wo;
                            }
                            // Also get the tile the worker is standing at

                            let item = wo.carrying.splice(slot,1);
                            workertile.items.push(item);
                            let pack = wo.task.getTask(wo.x,wo.y);
                            wo.subtask = pack.task;
                            wo.targetx = pack.targetx;
                            wo.targety = pack.targety;
                            wo.targetitem = pack.targetitem;
                            return wo;
                        }

                        // It's not the block location, so we should be picking up an item here
                        let slot = workertile.items.findIndex(e=>e.name===wo.targetitem);
                        if(slot===-1) {
                            // The target item was not found here. Don't worry, this can happen (and is common at the Forage Post)
                            // Try to get a new task from the same block
                            let pack = wo.task.getTask(wo.x,wo.y);
                            wo.subtask = pack.task;
                            wo.targetx = pack.targetx;
                            wo.targety = pack.targety;
                            wo.targetitem = pack.targetitem;
                            return wo;
                        }
                        wo.carrying.push(workertile.items[slot]);
                        workertile.items.splice(slot, 1);
                        console.log(wo.name +' picked up a '+ wo.carrying[wo.carrying.length-1].name);

                        // Now, use the block's location as the worker's new target location
                        wo.targetx = wo.atBuilding.x;
                        wo.targety = wo.atBuilding.y;
                        return wo;
                    });
                    if(workerUpdate) hasWorkerUpdate = true;
                    //hasWorkerUpdate = hasWorkerUpdate || workerUpdate;
                break;
            }
            return wk;
        });

        // Before continuing, determine if we need to udpate rendering from worker changes
        if(hasWorkerUpdate) {
            game.updateWorkers(game.workers);
            game.updateLocalMap([...game.tiles]);
        }

        // Next, run updates of all structures
        for(let i=0;i<game.blockList.length;i++) {
            if(typeof(game.blockList[i].update)==='function') game.blockList[i].update();
        }

        // Handle time management
        let newTime = new Date().valueOf();
        let timeDiff = newTime - game.tickTime;
        game.tickTime = newTime;
        // timeDiff is the amount of time from last frame to this frame. It should be about 50 milliseconds, including the time
        // it took to complete the frame. If the game is running slow, this value will be larger; so we will need to reduce the
        // timeout length to compensate
        timeDiff -= 50;
        if (timeDiff < 0) timeDiff = 0;
        game.timeout = setTimeout(function () {
            window.requestAnimationFrame(game.tick);
        }, 50 - timeDiff);
    },
};

function moveWorker(worker, callback) {
    // Handles worker movement. When they reach their destination, callback will be called
    // Returns an array
    // [0]: the worker object, which has been modified in some way
    // [1]: true if a worker's location has been updated, or false if not

    // First, some error checking
    if(typeof(worker.targetx)==='undefined') {
        console.log('Error: worker '+ worker.name +' has moving task but targetx not defined. Task cancelled');
        worker.assignedBlock = 0;
        worker.task = '';
        return [worker, false];
    }
    if(typeof(worker.targety)==='undefined') {
        console.log('Error: worker '+ worker.name +' has moving task but targety not defined. Task cancelled');
        worker.assignedBlock = 0;
        worker.task = '';
        return [worker, false];
    }
    if(typeof(worker.moveCounter)==='undefined') {
        console.log('Error: worker '+ worker.name +' has moving task but moveCounter not defined. It will be set to zero');
        worker.moveCounter = 0;
    }

    // First, see if this worker is at the correct location yet
    if(worker.x===worker.targetx && worker.y===worker.targety) {
        return [callback(worker), false];
    }

    if(worker.moveCounter>0) {
        worker.moveCounter--;
        return [worker, false];
    }

    // This worker is ready to move to the next tile

    worker.x += (worker.targetx===worker.x)?0:(worker.targetx - worker.x) / Math.abs(worker.targetx - worker.x); // This gives us -1,0 or 1 to decide which way to go
    worker.y += (worker.targety===worker.y)?0:(worker.targety - worker.y) / Math.abs(worker.targety - worker.y);
    // Do those formulas again, for the new location
    let diffx = (worker.targetx===worker.x)?0:(worker.targetx - worker.x) / Math.abs(worker.targetx - worker.x);
    let diffy = (worker.targety===worker.y)?0:(worker.targety - worker.y) / Math.abs(worker.targety - worker.y);
    let distance = (diffx===0 || diffy===0)?1:1.4; // This manages extra time cost to move diagonally

    let tile = game.tiles.find(e=>e.x===worker.x && e.y===worker.y);
    if(typeof(tile)==='undefined') {
        console.log(`Error: ${worker.name} moved to tile [${worker.x},${worker.y}] that doesn't exist.`);
        worker.moveCounter = 1;  // Just so we can get this worker off that tile quickly
        return [worker, true];
    }
    let landType = (tile.newlandtype===-1)? tile.landtype : tile.newlandtype;
    let tileType = minimapTiles.find(f=>f.id===landType);
    if(typeof(tileType)==='undefined') {
        worker.moveCounter = 51;
        console.log(`Error: ${worker.name} on tile that isn't in minimapTiles. Base tile ${tile.landtype}, new tile ${tile.newlandtype}`);
    } else {
        worker.moveCounter = tileType.walkLag * distance;
    }
    return [worker, true];
}