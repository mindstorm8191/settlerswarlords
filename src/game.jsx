/*  game.jsx
    Holds the core game object, controlling all functionality of the game operations
    For the game Settlers & Warlords
*/

import { createNewWorker } from "./workers.jsx";
import {LeanTo} from "./structures/LeanTo.jsx";
import {ForagePost} from "./structures/ForagePost.jsx";
import {RockKnapper} from "./structures/RockKnapper.jsx";
import {LoggersPost} from "./structures/LoggersPost.jsx";
import {RopeMaker} from "./structures/RopeMaker.jsx";
import {DirtSource} from "./structures/DirtSource.jsx";

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
    unlockedItems: [], // array of item names. This gets added to for every new item the user crafts
    landTypeOptions: [], // array of objects:
        // landType, as string
        // tasks, as array of objects (matching building tasks list)

    tutorialState: 0,
    tutorialModes: [
        {name: 'shelter1', display: 'You need shelter! Select Lean-To from the left, then click any tile with trees to place it.'},
        {name: 'shelter2', display: 'Your Lean-To must be built. Select the Build task, then give a worker the task to complete.'},
        {name: 'food1', display: 'Next is food. Place a Forage Post anywhere, then assign a worker to serach for food. They will work indefinitely.'},
        {name: 'tools1', display: "Tools are vital for progress. Place a Rock Knapper, then make a Flint Knife or Stabber (you'll need both)"},
        {name: 'rope1', display: "Rope comes from the bark of fallen trees. Use a Forage Post to collect Twine Strips"},
        {name: 'rope2', display: "Use the Rope Maker to turn Twine Strips into useable rope"},
        {name: 'rope3', display: "New items unlocked! Build a Flint Shovel, Hatchet and Spear at the Rock Knapper. More tech will unlock from that!"}
    ],
    tutorialDisplay: true, // set to true / false to show tutorial. Users can hide the tutorial. When not in mobile mode, progress will re-display
                           // the tutorial
    tutorialProgress: false, // 
    advanceTutorial: ()=>{
        // Automates the updates that happen when the tutorial tasks are completed
        game.tutorialState++;
        //if()
    },
    mobileModeEnabled: false,

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

    // This format doesn't follow the Single Source of Truth idea. We need each entry here to be defined fully in the building's file.
    blockTypes: [
        LeanTo(),
        ForagePost(),
        RockKnapper(),
        LoggersPost(),
        RopeMaker(),
        DirtSource()
    ],
    // We did have a newFeatures column here, where we would have the left-side block highlight green when a new task becomes available.
    // This is probably not the place to have it, though; we need to use each existing building to check if features are unlocked, as
    // any buildings not placed won't matter in this check.

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

    createItem:(itemname, itemgroup, extras)=>{
        // Creates a new item, returning its structure. New items are added to the unlock list, if they don't already exist in it
        // itemname - name of this new object
        // itemgroup - what type of object this is. Pick between: item, tool, food, dust, liquid, gas
        // itemextras - extra fields for this item, depending on what type it is
        //    endurance (as float): for tools, determines how long this item lasts
        //    efficiency (as float): for tools, determines how fast this item completes work
        //    lifetime (as int): for food, how long (in seconds) this food will last
        //    temperature (as float): for food, liquids & gasses, how hot this item is
        // Returns the completed object; it is not attached to anything specific

        // First, check if this item type is in the unlocked items list yet
        if(!game.unlockedItems.some(i=>i===itemname)) {
            game.unlockedItems.push(itemname);
            // Also determine if this unlocks a specific building type
            for(let i=0; i<game.blockTypes.length; i++) {
                if(game.blockTypes[i].locked===0) continue;
                // Run through each element of the prereq array. The outer array denotes AND clauses, the inner array denotes OR clauses
                if(game.blockTypes[i].prereq.every(outer=>(
                    outer.some(inner=>game.unlockedItems.some(item=>item===inner))
                ))) {
                    game.blockTypes[i].locked = 0;
                    game.updateWorkers([...game.workers]); // We need to trigger a page update, so that this building will display
                }
            }

            // For all existing structures, we want to determine if this item unlocks new abilities in the structures
            for(let i=0; i<game.blockTypes.length; i++) {
                if(game.blockTypes[i].newFeatures.includes(itemname)) game.blockTypes[i].featuresUnlocked = true;
            }
        }

        // The rest is easy...
        return {name:itemname, group:itemgroup, inTask:0, ...extras};
    },
    findItem: (workerx, workery, targetItem, skipFlagged=false) => {
        // Searches for a specific item on the map, locating the closest one to the worker's current location
        // workerx, workery - current location of the worker to search for
        // targetItem - name of the item to locate
        // skipFlagged - set to true for search to skip over items already flagged for use in another task
        // Returns an array of x & y coordinates that has the item. Or, if the target item cannot be located, returns [-1,-1].

        // Let's start with a function
        function hasItem(x,y) {
            // returns true if the tile location has a fallen log in it
            if(x<0 || x>41) return false;
            if(y<0 || y>41) return false;

            let tile = game.tiles.find(t=>t.x===x && t.y===y);
            if(typeof(tile)==='undefined') return false;

            return tile.items.some(i=>{
                if(skipFlagged) {
                    return i.name===targetItem && i.inTask===0;
                }else{
                    return i.name===targetItem;
                }
            });
        }

        let distance = 1;
        if(hasItem(workerx,workery)) return [workerx,workery];  // This one is easy - there's already an item at the worker's spot
        while(true) {
            for(let line=-distance; line<distance; line++) {
                if(hasItem(workerx+line, workery-distance)) return [workerx+line, workery-distance]; // right across the top
                if(hasItem(workerx+distance, workery+line)) return [workerx+distance, workery+line]; // down the right
                if(hasItem(workerx-line, workery+distance)) return [workerx-line, workery+distance]; // left across the bottom
                if(hasItem(workerx-distance, workery-line)) return [workerx-distance, workery-line]; // up the left
            }
            distance++;
            if(workerx+distance>41 && workerx-distance<0 && workery+distance>41 && workery-distance<0) return [-1,-1];
        }
    },
    findItemFromList: (workerx, workery, itemList, skipFlagged=false) => {
        // Works like findItem, but accepts a list of acceptable items instead of just one.
        // Let's start with a function
        function hasItem(x,y) {
            // returns true if the tile location has a fallen log in it
            if(x<0 || x>41) return false;
            if(y<0 || y>41) return false;

            let tile = game.tiles.find(t=>t.x===x && t.y===y);
            if(typeof(tile)==='undefined') return false;

            return tile.items.some(i=>{
                if(skipFlagged) {
                    return i.inTask===0 && itemList.includes(i.name);
                }else{
                    return itemList.includes(i.name);
                }
            });
        }

        let distance = 1;
        if(hasItem(workerx,workery)) return [workerx,workery];  // This one is easy - there's already an item at the worker's spot
        while(true) {
            for(let line=-distance; line<distance; line++) {
                if(hasItem(workerx+line, workery-distance)) return [workerx+line, workery-distance]; // right across the top
                if(hasItem(workerx+distance, workery+line)) return [workerx+distance, workery+line]; // down the right
                if(hasItem(workerx-line, workery+distance)) return [workerx-line, workery+distance]; // left across the bottom
                if(hasItem(workerx-distance, workery-line)) return [workerx-distance, workery-line]; // up the left
            }
            distance++;
            if(workerx+distance>41 && workerx-distance<0 && workery+distance>41 && workery-distance<0) return [-1,-1];
        }
        return [-1,-1];
    },
    groupItems: original=>{
        // takes a list of items, and groups them into name & amount sets
        // Returns the completed groupings as an array

        let list = [];
        for(let i=0; i<original.length; i++) {
            let slot = list.findIndex(l=>l.name===original[i].name);
            if(slot===-1) {
                list.push({name:original[i].name, qty:original[i].amount || 1});
            }else{
                list[slot].qty += original[i].amount || 1;
            }
        }
        return list;
    },
    addLandTypeOptions(tilesList, newTask) {
        // Adds new tasks to a set of land tile types. If the task already exists for that land type, it will not be added again.

        for(let i=0; i<tilesList.length; i++) {
            let landType = game.landTypeOptions.find(t=>t.id===tilesList[i]);
            if(typeof(landType)==='undefined') {
                // We should add this now; either way we're gonna need it
                landType = {id:tilesList[i], tasks:[]};
                game.landTypeOptions.push(landType);
            }else{
                // It already exists. Check if we already have this task applied
                if(landType.tasks.findIndex(t=>t.name===newTask.name)!==-1) continue;
            }
            // Add this task to the given land type
            landType.tasks.push(newTask);
        }
    },

    tick: () => {
        // Handles updates to the local world. This function should run about once every 50 ticks, or 20 times a second
        if(game.runState===0) return; // Break the continuous cycle if the game has actually stopped

        // Start with managing workers
        // The database will provide us with a name, location, and, well, is supposed to provide with the current job (or none).
        // To be honest, jobs haven't been fleshed out enough to push & pull from the database; lets not worry about that for now.
        let hasWorkerUpdate = false; // we only want to update the local map if any workers have actually moved, or something
        for(let i=0; i<game.workers.length; i++) {
            hasWorkerUpdate ||= game.workers[i].work();
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


