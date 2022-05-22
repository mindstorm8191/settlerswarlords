/*  game.jsx
    Holds the core game object, controlling all functionality of the game operations
    For the game Settlers & Warlords
*/

import {minimapTiles} from "./comp_LocalMap.jsx";
import {LeanTo} from "./structures/LeanTo.jsx";
import {ForagePost} from "./structures/ForagePost.jsx";

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
        {name:'Forage Post', image:'foragepost.png', create:ForagePost, prereq:[], unlocked:0, newFeatures:[]}
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
        game.timeout = setTimeout(function () {
            window.requestAnimationFrame(game.tick);
        }, 50);
        game.runState = 1;
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
            if(wk.assignedBlock===0) {
                // This worker currently has no work. Let's see if we can find an important task for it to work on
                // Find a block that needs work done
                // This worker may be assisting another worker, but they are still elligible to find work from another building that may need it

                //if(wk.name==='Eldar' && game.blockList.length>0) {
                //    console.log('Eldar assigned block is '+ wk.assignedBlock);
                //}
                
                let target = game.blockList.find(block=> {
                    // We could first check if there are blocks that need work, and then blocks that have work. That can be considered later
                    // First, check that the hasWork function exists
                    if(typeof(block.hasWork)==='undefined') return false;
                    return block.hasWork();
                });
                if(typeof(target)==='object') {
                    // We got a hit on a building. Let's get to work with it
                    target.assignWorker(wk);
                    wk.assignedBlock = target.id;
                    wk = target.getTask(wk);
                    console.log(wk.name +' is getting work at '+ target.name +' (id='+ wk.assignedBlock +')');
                    console.log(wk.name +' has target ['+ wk.targetx +','+ wk.targety +']');
                    // We have to have the worker's instance returned from getTask. Otherwise that function cannot add additional
                    // fields to the worker instance
                    wk.aiding = 0;
                }else{
                    // Check if this worker is already helping someone else
                    if(wk.aiding===0) {
                        // Since no other buildings need work, go find someone to help out
                        let aid = game.workers.find(aa=> {
                            if(aa.id===wk.id) return false; // Make sure we're not checking ourselves first; each worker has a unique ID
                            if(aa.assignedBlock===0) return false; // This worker doesn't have an assigned block
                            // Sometimes workers will already be aiding others. We want all workers to be aiding only one - they'll be in charge
                            if(aa.aiding!==0) return false;
                            // Load the building, then check if it allows others to aid this guy
                            let block = game.blockList.find(b=>b.id===aa.assignedBlock);
                            if(typeof(block)==='undefined') {
                                console.log('Error - block id='+ aa.assignedBlock +' not found when worker checking to give aid');
                                return false;
                            }
                            return block.canAssist();
                        });
                        if(typeof(aid)!=='undefined') {
                            wk.assignedBlock = aid.assignedBlock; // This only copies over the block's id
                            wk.aiding = aid.id;
                            block = game.blockList.find(b=>b.id===wk.assignedBlock);
                            if(typeof(block)==='undefined') {
                                console.log("Error - block id="+ wk.assignedBlock +" not found when worker aids another");
                                return wk;
                            }
                            block.assignWorker(wk);
                            wk = block.getTask(wk); // This will modify the worker to include multiple fields
                            
                            console.log(wk.name +' will help out '+ aid.name);
                        }
                        // If that didn't work, well I guess there's nothing for them to do
                    }
                }
            }
            if(wk.assignedBlock===0) return wk;  // We should have received a task from above, but sometimes we don't
            

            // Now, our action depends on what task we currently have
            switch(wk.task) {
                case "construct":
                    // Here, we need to get to the building location, then doWork().
                    // Start by comparing this worker's location to the building's location

                    [wk,workerUpdate] = moveWorker(wk, (wo) => {
                        // Now, we need the block instance, so we can call its functions
                        block = game.blockList.find(e=>e.id===wk.assignedBlock);
                        if(typeof(block)==='undefined') {
                            console.log(`${wo.name} tried to work at building id=${wo.assignedBlock} but it doesn't exist? Task cancelled`);
                            wo.assignedBlock = 0;
                            wo.task = '';
                            return wo;
                        }

                        let hasMoreWork = block.doWork();
                        if(!hasMoreWork) {
                            wo.assignedBlock = 0;
                            wo.task = '';
                        }
                        return wo;
                    });
                break;

                case 'fetchitem':
                    // Here, we need to (again) get to a certain location. This time, the location is stored in targetx and targety
                    // of the worker.

                    if(typeof(wk.targetitem)==='undefined') {
                        console.log('Error: worker '+ wk.name +' has task fetchitem but target item not defined. Task cancelled');
                        wk.assignedBlock = 0;
                        wk.task = '';
                        return wk;
                    }
                    if(typeof(wk.carrying)==='undefined') wk.carrying = [];  // This seems like an error we can just correct on the spot
                    //let workerUpdate = false;
                    [wk, workerUpdate] = moveWorker(wk, wo => {
                        // returns the worker object when finished
                        
                        // Before doing anything, we need data about both the block we're working for, and the tile the worker is at
                        block = game.blockList.find(e=>e.id===wo.assignedBlock);
                        if(typeof(block)==='undefined') {
                            console.log('Error: could not find target block with id='+ wo.assignedBlock +'. Worker task cancelled');
                            wo.assignedBlock = 0;
                            wo.task = '';
                            return wo;
                        }
                        let tile = game.tiles.find(e=>e.x===wo.x && e.y===wo.y);
                        if(typeof(tile)==='undefined') {
                            console.log(`Error: ${wo.name} tried to get/place an item, but tile not found at [${wo.x},${wo.y}]. Task cancelled`);
                            wo.assignedBlock = 0;
                            wo.task = ''
                            return wo;
                        }
                        if(typeof(tile.items)==='undefined') {
                            // We can add the items list here, right?
                            console.log(`Error: Tile at [${wo.x},${wo.y}] missing items list. It was added as empty`);
                            tile.items = [];
                        }

                        // Now, see if we're at the pick-up place, or the put-down place
                        if(block.x===wo.x && block.y===wo.y) {
                            // This is where we need to place the item we picked up. First, find the slot of the item in our inventory
                            let slot = wo.carrying.findIndex(e=>e.name===wo.targetitem);
                            if(slot===-1) {
                                console.log(`Error: ${wo.name} tried to place an item, but not carrying it now. Item=${wo.targetitem}, carrying size=${wo.carrying.length}. Worker task cancelled`);
                                wo.assignedBlock = 0;
                                wo.task = '';
                                return wo;
                            }
                            let item = wo.carrying.splice(slot,1);
                            tile.items.push(item);
                            return block.getTask(wo);
                        }

                        // It's not the block location, so we should be picking up an item here
                        let slot = tile.items.findIndex(e=>e.name===wo.targetitem);
                        if(slot===-1) {
                            // The target item was not found here. Don't worry, this can happen (and is common at the Forage Post)
                            // Try to get a new task from the same block
                            return block.getTask(wo);
                        }
                        wo.carrying.push(tile.items[slot]);
                        tile.items.splice(slot, 1);
                        console.log(wo.name +' picked up a '+ wo.carrying[wo.carrying.length-1].name);

                        // Now, use the block's location as the worker's new target location
                        wo.targetx = block.x;
                        wo.targety = block.y;
                        return wo;
                    });
                    
                    hasWorkerUpdate = hasWorkerUpdate || workerUpdate;
                break;
            }
            return wk;
        });

        // Before continuing, determine if we need to udpate rendering from worker changes
        if(hasWorkerUpdate) {
            game.updateWorkers(game.workers);
            game.updateLocalMap([...game.tiles]);
        }
        
        // This is a simple counter to represent seconds ticking by
        // game.clockCheck++;
        // if (game.clockCheck % 20 === 0) console.log("tick...");

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