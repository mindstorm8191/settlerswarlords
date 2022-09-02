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
            if(typeof(wk.tasks)==='undefined') wk.tasks=[];
            if(wk.tasks.length===0) return wk; // This worker has no current tasks

            // Now, our action depends on what task we currently have
            switch(wk.tasks[0].subtask) {
                case "construct":
                    // Here, we need to get to the building location, then doWork().
                    // Start by comparing this worker's location to the building's location
                    [wk,workerUpdate] = moveWorker(wk, (wo) => {
                        // We have reached our destination. Next, we need to do work at this building. Specific work will be tied to the
                        // active task at hand.
                        wo.tasks[0].taskInstance.progress++;
                        wo.tasks[0].task.onProgress();
                        if(wo.tasks[0].taskInstance.progress<wo.tasks[0].taskInstance.progressTarget) return wo;
                        
                        // Now handle when a worker completes their task. Run onComplete for the given task
                        wo.tasks[0].task.onComplete();
                        // Clear the active task from the structure, and return the updated worker
                        return workerClearTask(wo);
                    });
                    if(workerUpdate) hasWorkerUpdate = true;
                break;

                case "workonsite":
                    // Here, we need to move the worker to the location, and they will be able to perform the work there
                    [wk,workerUpdate] = moveWorker(wk, (wo) => {
                        // Similar to the construct task, we will increment progress on this until complete
                        wo.tasks[0].taskInstance.progress++;
                        wo.tasks[0].task.onProgress();
                        if(wo.tasks[0].taskInstance.progress<wo.tasks[0].taskInstance.progressTarget) return wo;
                        
                        // This work has been completed
                        wo.tasks[0].task.onComplete();
                        wo.tasks[0].taskInstance.count++;

                        if(wo.tasks[0].taskInstance.count<wo.tasks[0].taskInstance.targetCount) {
                            // We made one, now make the next

                            let pack = wo.tasks[0].task.getTask(wo.x, wo.y);
                            wo.tasks[0].taskInstance.progress -= wo.tasks[0].taskInstance.progressTarget // don't forget to reset the progress!
                            wo.tasks[0].subtask = pack.subtask;
                            wo.tasks[0].targetx = pack.targetx;
                            wo.tasks[0].targety = pack.targety;
                            wo.tasks[0].atBuilding.blinker(0);
                            return wo;
                        }

                        // There is no more work to do. Close out the task
                        let building = wo.tasks[0].atBuilding;
                        wo = workerClearTask(wo);
                        building.blinker(0);
                        return wo;
                    });
                    if(workerUpdate) hasWorkerUpdate = true;
                break;

                case 'fetchitem':
                    // Here, we need to (again) get to a certain location. This time, the location is stored in targetx and targety
                    // of the worker.

                    if(typeof(wk.tasks[0].targetitem)==='undefined') {
                        console.log('Error: worker '+ wk.name +' has task fetchitem but target item not defined. Task cancelled');
                        return workerClearTask(wk);
                    }
                    if(wk.tasks[0].targetitem==='') {
                        console.log('Error: worker '+ wk.name +' has task fetchitem but no target item to fetch. Task cancelled');
                        return workerClearTask(wk);
                    }
                    if(typeof(wk.carrying)==='undefined') wk.carrying = [];  // This seems like an error we can just correct on the spot
                    [wk, workerUpdate] = moveWorker(wk, wo => {
                        // returns the worker object when finished
                        
                        // Before doing anything, we need data about both the block we're working for, and the tile the worker is at
                        if(typeof(wo.tasks[0].atBuilding)==='undefined') {
                            console.log('Error: could not find target structure. Worker task cancelled');
                            return workerClearTask(wo);
                        }
                        let workertile = game.tiles.find(e=>e.x===wo.x && e.y===wo.y);
                        if(typeof(workertile)==='undefined') {
                            console.log(`Error: ${wo.name} tried to get/place an item, but tile not found at [${wo.x},${wo.y}]. Task cancelled`);
                            return workerClearTask(wo);
                        }
                        if(typeof(workertile.items)==='undefined') {
                            // We can add the items list here, right?
                            console.log(`Error: Tile at [${wo.x},${wo.y}] missing items list. It was added as empty`);
                            workertile.items = [];
                        }

                        //wo.tasks[0].task.onProgress();

                        // Now, see if we're at the pick-up place, or the put-down place
                        if(wo.tasks[0].atBuilding.x===wo.x && wo.tasks[0].atBuilding.y===wo.y) {
                            // This is where we need to place the item we picked up. First, find the slot of the item in our inventory
                            let slot = wo.carrying.findIndex(e=>e.name===wo.tasks[0].targetitem);
                            if(slot===-1) {
                                console.log(`Error: ${wo.name} tried to place an item, but not carrying it now. Item=${wo.tasks[0].targetitem}, carrying size=${wo.carrying.length}. Worker task cancelled`);
                                return workerClearTask(wo);
                            }
                            // Also get the tile the worker is standing at

                            let item = wo.carrying.splice(slot,1);
                            workertile.items.push(item);
                            let pack = wo.tasks[0].task.getTask(wo.x,wo.y);
                            wo.tasks[0].subtask = pack.subtask;
                            wo.tasks[0].targetx = pack.targetx;
                            wo.tasks[0].targety = pack.targety;
                            wo.tasks[0].targetitem = pack.targetitem;
                            wo.tasks[0].task.onProgress();
                            return wo;
                        }

                        // It's not the block location, so we should be picking up an item here
                        let slot = workertile.items.findIndex(e=>e.name===wo.tasks[0].targetitem);
                        if(slot===-1) {
                            // The target item was not found here. Don't worry, this can happen (and is common at the Forage Post)
                            // Try to get a new task from the same block
                            console.log(wo.name +' didnt find food');
                            let pack = wo.tasks[0].task.getTask(wo.x,wo.y);
                            wo.tasks[0].subtask = pack.subtask;
                            wo.tasks[0].targetx = pack.targetx;
                            wo.tasks[0].targety = pack.targety;
                            wo.tasks[0].targetitem = pack.targetitem;
                            console.log(wo.name +' old location '+ wo.x +','+ wo.y +' new location '+ wo.tasks[0].targetx +','+ wo.tasks[0].targety);
                            return wo;
                        }
                        wo.carrying.push(workertile.items[slot]);
                        workertile.items.splice(slot, 1);
                        console.log(wo.name +' picked up a '+ wo.carrying[wo.carrying.length-1].name);

                        // Now, use the block's location as the worker's new target location
                        wo.tasks[0].targetx = wo.tasks[0].atBuilding.x;
                        wo.tasks[0].targety = wo.tasks[0].atBuilding.y;
                        return wo;
                    });
                    if(workerUpdate) hasWorkerUpdate = true;
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
    if(typeof(worker.tasks)==='undefined') {
        console.log('Error: worker '+ worker.name +' missing their tasks array. We will re-add it now');
        worker.tasks = [];
        return [worker, false];
    }
    if(worker.tasks.length===0) {
        console.log('Error: worker '+ worker.name +' has no tasks assigned')
        return [worker, false];
    }
    if(typeof(worker.tasks[0].targetx)==='undefined') {
        console.log('Error: worker '+ worker.name +' has moving task but targetx not defined. Task cancelled');
        return [workerClearTask(worker), false];
    }
    if(typeof(worker.tasks[0].targety)==='undefined') {
        console.log('Error: worker '+ worker.name +' has moving task but targety not defined. Task cancelled');
        return [workerClearTask(worker), false];
    }
    if(typeof(worker.moveCounter)==='undefined') {
        console.log('Error: worker '+ worker.name +' has moving task but moveCounter not defined. It will be set to zero');
        worker.moveCounter = 0;
    }

    // If this worker is at the correct location, we need to use the callback function
    if(worker.x===worker.tasks[0].targetx && worker.y===worker.tasks[0].targety) {
        return [callback(worker), false];
    }

    if(worker.moveCounter>0) {
        worker.moveCounter--;
        return [worker, false];
    }

    // This worker is ready to move to the next tile

    worker.x += (worker.tasks[0].targetx===worker.x)?0:(worker.tasks[0].targetx - worker.x) / Math.abs(worker.tasks[0].targetx - worker.x); // This gives us -1,0 or 1 to decide which way to go
    worker.y += (worker.tasks[0].targety===worker.y)?0:(worker.tasks[0].targety - worker.y) / Math.abs(worker.tasks[0].targety - worker.y);
    // Do those formulas again, for the new location
    let diffx = (worker.tasks[0].targetx===worker.x)?0:(worker.tasks[0].targetx - worker.x) / Math.abs(worker.tasks[0].targetx - worker.x);
    let diffy = (worker.tasks[0].targety===worker.y)?0:(worker.tasks[0].targety - worker.y) / Math.abs(worker.tasks[0].targety - worker.y);
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

function workerClearTask(worker) {
    // Clears the current task of a worker. Simply splicing out the worker's task won't work, as there's tie-ins with the building as well

    // First, error checking
    if(typeof(worker)==='undefined') {
        console.log('Error in workerClearTask: worker provided is undefined');
        return worker;
    }
    if(typeof(worker.id)==='undefined') {
        console.log('Error in workerClearTask: worker used has no id. Adding one now');
        game.lastWorkerId++;
        worker.id = game.lastWorkerId;
        return worker;
    }
    if(typeof(worker.tasks)==='undefined') {
        console.log('Error in workerClearTask: worker does not have tasks array. We will add it here');
        worker.tasks = [];
        return worker;
    }
    if(worker.tasks.length===0) {
        console.log('Error in workerClearTask: worker has no tasks. No action taken');
        return worker;
    }
    if(typeof(worker.tasks[0].atBuilding)==='undefined') {
        console.log('Error in workerClearTask: worker target building not found. Task deleted anyway');
        worker.tasks.splice(1,0);
        return worker;
    }
    if(typeof(worker.tasks[0].atBuilding.activeTasks)==='undefined') {
        console.log('Error in workerClearTask: target building missing activeTasks array. Task deleted anyway');
        worker.tasks.splice(1,0);
        return worker;
    }
    if(worker.tasks[0].atBuilding.activeTasks.length===0) {
        console.log('Error in workerClearTask: target building has no active tasks. Task deleted anyway');
        worker.tasks.splice(1,0);
        return worker;
    }
    
    // We want to validate all tasks, but we only need to find the correct index of the task we need
    let slot = worker.tasks[0].atBuilding.activeTasks.findIndex((task,index)=>{
        if(typeof(task.worker)==='undefined') {
            console.log('Error in workerClearTask: found task without worker (task index='+ index +'). Task deleted anyway');
            return false;
        }
        if(typeof(task.worker.id)==='undefined') {
            console.log('Error in workerClearTask: found worker in tasks without an id (task index='+ index +'). Task deleted anyway');
            return false;
        }
        return (worker.id===task.worker.id);
    });
    if(slot===-1) {
        worker.tasks.splice(1,0);
        return worker;
    }

    // Finally! We are ready to complete the actual work here
    worker.tasks[0].atBuilding.ativeTasks.splice(slot,1);
    worker.tasks.splice(0,1);
    return worker;
}