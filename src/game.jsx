/*  game.jsx
    Holds the core game object, controlling all functionality of the game operations
    For the game Settlers & Warlords
*/

import {minimapTiles} from "./comp_LocalMap.jsx";
import { createNewWorker } from "./workers.jsx";
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

    setupGame: (localTiles, localWorkers, funcUpdateTiles, funcUpdateWorkers) => {
        // A public function to set up game basics
        // parameters:
        //  localTiles - array of the local tiles, as received by the server
        //  localWorkers - array of the local workers, as received by the server
        //  funcUpdateTiles - callback function from React to update all game tiles
        //  funcUpdateWorkers - callback function from React to udpate all workers

        game.tiles = localTiles;
        for (let i = 0; i < localWorkers.length; i++) createNewWorker(localWorkers[i]);
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
        for(let i=0; i<game.workers.length; i++) {
            hasWorkerUpdate ||= game.workers[i].work();
            //game.workers[i].work();
        }

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


