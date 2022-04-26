/*  game.jsx
    Holds the core game object, controlling all functionality of the game operations
    For the game Settlers & Warlords
*/

/*function LeanTo(tile) {
    // Allows a new building to be created - our first! The lean-to is a crude shelter made from a fallen tree branch and leaves piled
    // on top. It is certainly not a great shelter, but can be made on the fly in the wilderness, and doesn't even require tools

    // Start by checking the land type chosen. Lean-tos can only be created from trees
    if(![5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].includes(parseInt(tile.newlandtype) === -1 ? tile.landtype : tile.newlandtype)) {
        return 'wrong land type';
    }
    // Next, create our object. We need to do this so the object can be modified (with Object Composition) before returning it
    let b = {
        id: game.getNextBlockId(),
        name: 'Lean-To',
        descr: `Before food, even before water, one must find shelter from the elements. It is the first requirement for survival;
                for the elements, at their worst, can defeat you faster than anything else. Consisting of a downed branch with leaves
                on top, this is fast & easy to set up, but wont last long in the elements itself.`,
        usage: `Your workers must set this up. Once built, it will function for a few nights, then have to be rebuilt`,
        image: 'leanto.png', // This is already set with the path to img/structures
        mode:'build',
        progressBar: 0,
        progressBarMax: 1800, // This totals 1.5 minutes. But with 4 workers building it, it'll be done in ~22 seconds
        progressBarColor: 'green',
        SidePanel: (props)=>{
            if(b.mode==='build') {
                return <>Under construction.</>;
            }
            return <>In use.</>;
        }
    }
    return b;
}*/

import {minimapTiles} from "./comp_LocalMap.jsx";
import {LeanTo} from "./structures/LeanTo.jsx";

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
        {name:'Lean-To', image:'leanto.png', create:LeanTo, prereq:[], unlocked:0, newFeatures:[]}
    ],

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
        game.workers.forEach((wk)=> {
            // First, see if they are working at a particular building
            if(wk.assignedBlock===0) {
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
                    wk.task = target.getTask();
                }else{
                    // Since no other buildings need work, go find someone to help out
                    let aid = game.workers.find(aa=> {
                        if(aa.id===wk.id) return false; // Make sure we're not checking ourselves first; each worker has a unique ID
                        if(aa.assignedBlock===0) return false; // This worker doesn't have an assigned block
                        // Sometimes workers will already be aiding others. We want all workers to be aiding only one - they'll be in charge
                        if(typeof(aa.aiding)==='undefined' || typeof(aa.aiding)==='null') return true;
                        return false;
                    });
                    if(typeof(aid)==='object') {
                        wk.assignedBlock = aid.assignedBlock; // This only copies over the block's id
                        wk.aiding = aid.id;
                    }
                    // If that didn't work, well I guess there's nothing for them to do
                }
            }
            if(wk.assignedBlock===0) return;  // We should have 

            // Now, our action depends on what task we currently have
            switch(wk.task) {
                case "construct":
                    // Here, we need to get to the building location, then doWork().
                    // Start by comparing this worker's location to the building's location
                    let block = game.blockList.find(e=>e.id===wk.assignedBlock);
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
                        // Every worker will have a travel counter. When it reaches zero, the worker
                        // will move to the next block. We will need to set this when they first decide
                        // to begin moving. Its value will depend on the tile they're currently on.
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
                            }else{
                                wk.moveCounter = tileType.walkLag;
                            }
                            // Since this user's location has changed, we need to trigger map re-rendering
                            hasWorkerUpdate = true;
                        }
                    }
                break;
            }
            
            // Determine if we need to udpate rendering from worker changes
            if(hasWorkerUpdate) {
                game.updateWorkers(game.workers);
                game.updateLocalMap([...game.tiles]);
            }
        });

        
        // This is a simple counter to represent seconds ticking by
        game.clockCheck++;
        if (game.clockCheck % 20 === 0) console.log("tick...");

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