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
            if(wk.assignedBlock!==0) {
                // Determine what needs to be done here
                //console.log(wk.name +' working at '+ game.getBlock(wk.assignedBlock).name);
            }else{
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
                        if(aa.assignedBlock===null) return false; // This worker doesn't have an assigned block
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