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

        // I would use forEach here, but that doesn't allow altering the state of the workers properly. However, we can use .map
        //game.workers.forEach((wk)=> {
        game.workers = game.workers.map(wk => {
            let block = null;
            // First, see if they are working at a particular building
            if(wk.assignedBlock===0 || game.aiding!==0) {
                // This worker currently has no work. Let's see if we can find an important task for it to work on
                // Find a block that needs work done
                let target = game.blockList.find(block=> {
                    // We could first check if there are blocks that need work, and then blocks that have work. That can be considered later
                    // First, check that the hasWork function exists
                    if(typeof(block.hasWork)==='undefined') return false;
                    return block.hasWork();
                });
                if(typeof(target)==='object') {
                    // We got a hit on a building. Let's get to work with it
                    console.log(wk.name +' is getting work at '+ target.name);
                    target.assignWorker(wk);
                    wk.assignedBlock = target.id;
                    wk = target.getTask(wk);
                    console.log(wk.name +' has target ['+ wk.targetx +','+ wk.targety +']');
                    // We have to have the worker's instance returned from getTask. Otherwise that function cannot add additional
                    // fields to the worker instance
                    wk.aiding = 0;
                }else{
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
                    /*
                    if(wk.name==='Igor') {
                        clockCounter++;
                        if(clockCounter%20===0) {
                            console.log(wk);
                        }
                    }*/
                    
                    block = game.blockList.find(e=>e.id===wk.assignedBlock);
                    if(block===null) {
                        console.log('Worker error: could not find block id='+ wk.assignedBlock);
                        // Rather than leaving this worker in this state (posting console content 20 times a second), let's clear our
                        // this worker's current task
                        wk.assignedBlock = 0;
                        wk.task = '';
                    }
                    if(block.x===wk.x && block.y===wk.y) {
                        let hasMoreWork = block.doWork();
                        if(!hasMoreWork) {
                            wk.assignedBlock = 0;
                            wk.task = '';
                        }
                    }else{
                        // We're not at the correct location. 
                        // While we're going there, keep checking that there is still work to do; someone else could have finished it
                        //if(!block.hasWork()) break;

                        // Every worker will have a travel counter. When it reaches zero, the worker will move to the next block.
                        // We will need to set this when they first decide to begin moving. Its value will depend on the tile they're
                        // currently on.
                        if(wk.moveCounter>0) {
                            wk.moveCounter--;
                        } else {
                            // At some point (soon) we will need workers to decide on a fastest
                            // path route to a target. Path information should be determined
                            // by that, not all this
                            
                            // First, see if we can update the X coordinate
                            wk.x += (block.x===wk.x)?0:(block.x - wk.x) / Math.abs(block.x - wk.x); // This gives us -1,0 or 1 to decide which way to go
                            wk.y += (block.y===wk.y)?0:(block.y - wk.y) / Math.abs(block.y - wk.y);
                            // Do those formulas again, for the new location
                            let diffx = (block.x===wk.x)?0:(block.x - wk.x) / Math.abs(block.x - wk.x);
                            let diffy = (block.y===wk.y)?0:(block.y - wk.y) / Math.abs(block.y - wk.y);
                            let distance = 1.4;
                            if(diffx===0 || diffy===0) distance = 1;
                            // Determine what kind of land this worker is currently standing in. That will decide how long the worker takes to
                            // get through it. Water will be slowest, plains will be fairly fast, developed flat spaces will be fastest
                            // First, though, we need to access the correct tile, then static info about that tile
                            let tile = game.tiles.find(e=>e.x===wk.x && e.y===wk.y);
                            let landType = (tile.newlandtype===-1)? tile.landtype : tile.newlandtype;
                            let tileType = minimapTiles.find(f=>f.id===landType);
                            if(typeof(tileType)==='undefined') {
                                wk.moveCounter = 51;
                            } else {
                                wk.moveCounter = tileType.walkLag * distance;
                            }
                            // Since this user's location has changed, we need to trigger map re-rendering
                            hasWorkerUpdate = true;
                        }
                    }
                break;

                case 'fetchitem':
                    // Here, we need to (again) get to a certain location. This time, the location is stored in targetx and targety
                    // of the worker.
                    // First, some error checking
                    if(typeof(wk.targetx)==='undefined') {
                        console.log('Error: worker '+ wk.name +' has task fetchitem but targetx not defined. Task cancelled');
                        wk.assignedBlock = 0;
                        wk.task = '';
                        return wk;
                    }
                    if(typeof(wk.targety)==='undefined') {
                        console.log('Error: worker '+ wk.name +' has task fetchitem but targety not defined. Task cancelled');
                        wk.assignedBlock = 0;
                        wk.task = '';
                        return wk;
                    }
                    if(typeof(wk.targetitem)==='undefined') {
                        console.log('Error: worker '+ wk.name +' has task fetchitem but target item not defined. Task cancelled');
                        wk.assignedBlock = 0;
                        wk.task = '';
                        return wk;
                    }
                    if(typeof(wk.carrying)==='undefined') wk.carrying = [];  // This seems like an error we can just correct on the spot
                    if(wk.x===wk.targetx && wk.y===wk.targety) {
                        // We have reached our destination!
                        // Decide if this is where we pick up the item, or drop it off. That will be decided by the block's location
                        block = game.blockList.find(e=>e.id===wk.assignedBlock);
                        if(typeof(block)==='undefined') {
                            console.log('Error: could not find target block with id='+ wk.assignedBlock +'. Worker task cancelled');
                            wk.assignedBlock = 0;
                            wk.task = '';
                            return wk;
                        }
                        if(block.x===wk.x && block.y===wk.y) {
                            // This is where we need to place the item we picked up.
                            // First, find the slot of the item in our inventory
                            let slot = wk.carrying.findIndex(e=>e.name===wk.targetitem);
                            if(slot===-1) {
                                console.log('Error: Worker tried to place item, but not carrying it now. Item='+ wk.targetitem +', carrying size='+ wk.carrying.length +'. Worker task cancelled');
                                wk.assignedBlock = 0;
                                wk.task = '';
                                return wk;
                            }
                            let tile=game.tiles.find(e=>e.x===wk.x && e.y===wk.y);
                            if(typeof(tile)==='undefined') {
                                console.log('Error: Worker tried to place item, but did not find tile at ['+ wk.x +','+ wk.y +']. Assignment cancelled');
                                wk.assignedBlock = 0;
                                wk.task = '';
                            }
                            let item = wk.carrying.splice(slot, 1);
                            tile.items.push(item);
                            return wk;
                        }

                        // We should be picking up an item here
                        let tile=game.tiles.find(e=>e.x===wk.x && e.y===wk.y);
                        if(typeof(tile)==='undefined') {
                            console.log('Error: did not find tile at ['+ wk.x +','+ wk.y +']. Worker task cancelled');
                            wk.assignedBlock = 0;
                            wk.task = '';
                            return wk;
                        }
                        if(typeof(tile.items)==='undefined') {
                            console.log('Error: tile at ['+ wk.x +','+ wk.y +'] doesnt have items list. Worker task cancelled');
                            tile.items = []; // might as well add it now, right?
                            wk.assignedBlock = 0;
                            wk.task = '';
                            return wk;
                        }
                        let slot = tile.items.findIndex(e=>e.name===wk.targetitem);
                        if(slot===-1) {
                            // The target item was not found here. Don't worry, this can happen (and is common at the Forage Post)
                            // Try to get a new task from the same block we got the previous task from
                            let block = game.blockList.find(e=>e.id===wk.assignedBlock);
                            if(typeof(block)==='undefined') {
                                console.log('Error: could not find block for worker '+ wk.name +'. Worker task cancelled');
                                wk.assignedBlock = 0;
                                wk.task = '';
                                return wk;
                            }
                            wk = block.getTask(wk);
                            return wk; // That should do it for this scenario
                        }
                        wk.carrying.push(tile.items[slot]);
                        tile.items.splice(slot, 1);
                        // Since we now have the item, we need to go to the block's location (as part of fetching an item)
                        let block = game.blockList.find(e=>e.id===wk.assignedBlock);
                        if(typeof(block)==='undefined') {
                            console.log('Error: could not find block for worker '+ wk.name +'. Worker task cancelled');
                            wk.assignedBlock = 0;
                            wk.task = '';
                            return wk;
                        }
                        wk.targetx = block.x;
                        wk.targety = block.y;
                        return wk;
                    }

                    // This worker is not at the correct location yet.
                    if(wk.moveCounter>0) {
                        wk.moveCounter--;
                        return wk;
                    }

                    // This worker is ready to move to the next tile. First, fetch the correct block instance
                    block = game.blockList.find(e=>e.id===wk.assignedBlock);
                    if(typeof(block)==='undefined') {
                        console.log('Error: Did not find block id='+ wk.assignedBlock +' for worker '+ wk.name +' on move. Task cancelled');
                        wk.assignedBlock = 0;
                        wk.task = '';
                        return wk;
                    }
                    wk.x += (block.x===wk.x)?0:(block.x - wk.x) / Math.abs(block.x - wk.x); // This gives us -1,0 or 1 to decide which way to go
                    wk.y += (block.y===wk.y)?0:(block.y - wk.y) / Math.abs(block.y - wk.y);
                    // Do those formulas again, for the new location
                    let diffx = (block.x===wk.x)?0:(block.x - wk.x) / Math.abs(block.x - wk.x);
                    let diffy = (block.y===wk.y)?0:(block.y - wk.y) / Math.abs(block.y - wk.y);
                    let distance = 1.4;
                    if(diffx===0 || diffy===0) distance = 1;
                    let tile = game.tiles.find(e=>e.x===wk.x && e.y===wk.y);
                    let landType = (tile.newlandtype===-1)? tile.landtype : tile.newlandtype;
                    let tileType = minimapTiles.find(f=>f.id===landType);
                    if(typeof(tileType)==='undefined') {
                        wk.moveCounter = 51;
                    } else {
                        wk.moveCounter = tileType.walkLag * distance;
                    }
                    // Since this user's location has changed, we need to trigger map re-rendering
                    hasWorkerUpdate = true;
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