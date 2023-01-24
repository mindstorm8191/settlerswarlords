/*  game.jsx
    Holds the core game object, controlling all functionality of the game operations
    For the game Settlers & Warlords
*/

import { createNewWorker } from "./worker.jsx";
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
    tasks: [], // All tasks in this area, active or not
        // task structure
        //  building this task is assigned to
        //  worker this task is assigned to (if assigned yet)
        //  status of this task. Most jobs will start as unassigned
        //  location for this work to take place at. Users may list this as 'anywhere'; a location will be selected when a worker assigns it
        //  secondary location. This is used for jobs involving picking items up
        //  items & tools needed for the task
        //  items & tools collected for this task
        //  progress of this task
        //  skills required (some tasks need a certain level to be successful each time. Workers completing this at lower levels have X chance of failure)

        // so, a worker will assign themselves a task. If they need to do something else, the worker will self-assign themselves the task needed
        // before-hand. For example, if they need to cut a stick, they'll first need to craft a Flint Stabber, then carry it to the job site.
    taskManager: [], // all task management entries
        //  building that has the task to complete
        //  task that will be generated when needed
        //  item to keep on hand
        //  amount needed on hand

    tickTime: 0,
    timeout: null, // We keep this handle so that the timeout can be interrupted
    runState: 0, // Set to 1 when game is running. This is checked at start of game-tick to stop the cycle if the game isn't running
    clockCheck: 0,
    lastBlockId: 0,
    lastWorkerId: 0,
    lastTaskId: 0,
    unlockedItems: [], // array of item names. This gets added to for every new item the user crafts
    landTypeOptions: [], // array of objects:
        // landType, as string
        // tasks, as array of objects (matching building tasks list)

    tutorialState: 0,
    tutorialModes: [
        {name: 'shelter1', display: 'You need shelter! Select Lean-To from the left, then click any tile with trees to place it.'},
        {name: 'food1', display: 'Next is food. Place a Forage Post anywhere, then click Enable to assign a worker to serach for food.'},
        {name: 'tools1', display: "Tools are vital for progress. Place a Rock Knapper, then make a Flint Knife or Stabber (you'll need both)"},
        {name: 'rope1', display: "Rope comes from the bark of decaying trees. Use a Forage Post to collect Twine Strips"},
        {name: 'rope2', display: "Use the Rope Maker to turn Twine Strips into useable rope"},
        {name: 'rope3', display: "New items unlocked! Build a Flint Shovel, Hatchet and Spear at the Rock Knapper. More tech will unlock from that!"}
    ],
    tutorialDisplay: true, // set to true / false to show tutorial. Users can hide the tutorial. When not in mobile mode, progress will re-display
                           // the tutorial
    tutorialDisplayFunction: 0, // 
    advanceTutorial: ()=>{
        // Automates the updates that happen when the tutorial tasks are completed
        game.tutorialState++;
        if(typeof(game.tutorialDisplay)==='function') game.tutorialDisplay(true);
    },
    mobileModeEnabled: false,

    getNextBlockId: ()=> {
        // Returns the next available block id (for this map area)
        game.lastBlockId++;
        return game.lastBlockId;
    },
    /*getNextTaskId: ()=> { what we really need is a more robust deletion method
        game.lastTaskId++;
        return game.lastTaskId;
    },*/
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

    setupGame: (content, funcUpdateTiles, funcUpdateWorkers) => {
        // A public function to set up game basics
        // parameters:
        //  content - all data received from the server, as it was provided. It should contain the following
        //  funcUpdateTiles - callback function from React to update all game tiles
        //  funcUpdateWorkers - callback function from React to udpate all workers

        //game.unlockedItems = content.unlockedItems;
        for(let i=0; i<content.unlockedItems.length; i++) {
            game.checkUnlocks(content.unlockedItems[i]);
        }

        // For local tiles, convert all grouped items into individual items
        game.tiles = content.localTiles.map(t=>{
            let ni = [];
            for(let j=0; j<t.items.length; j++) {
                if(typeof(t.items[j].amount)==='undefined') {
                    ni.push({group:'item', inTask: 0, ...t.items[j]});
                }else{
                    let amount = t.items[j].amount;
                    delete t.items[j].amount;
                    for(let k=0; k<amount; k++) {
                        ni.push({group:'item', inTask: 0, ...t.items[j]});
                    }
                }
            }
            return {...t, items:ni, modified:false};
            // All tiles will have a field to show if they have been modified
            // Places this gets altered:
            //      when a new building is put down
            //      when a worker adds / removes items from a tile
        });

        // Worker creation has its own function
        for (let i = 0; i < content.workers.length; i++) createNewWorker(content.workers[i]);

        // Generate existing structures... and figure out how they're generated to begin with
        //console.log(content.structures);
        if(content.structures!==null) {
            for (let i = 0; i < content.structures.length; i++) {
                // Find the tile needed to place this on
                let tile = game.tiles.find(t=>t.x===content.structures[i].x && t.y===content.structures[i].y);
                if(typeof(tile)==='undefined') {
                    console.log('Error in game.setupGame->load structures: structure location of '+ content.structures[i].x +','+ content.structures[i].y +' could not be found. '+ content.structures[i].name +' not loaded');
                    continue;
                }
                
                /* wait... I don't need all this! Use the name in the 
                switch(content.structures[i].name) {
                    case "LeanTo": b = game.blockTypes.find(ty=>ty.name==='Lean-To').create(tile); break;
                    case "Forage Post": b = game.blockTypes.find(ty=>ty.name==="Forage Post").create(tile); break;
                    case "Rock Knapper": b = game.blockTypes.find(ty=>ty.name==='Rock Knapper').create(tile); break;
                    case "Rope Maker": b = game.blockTypes.find(ty=>ty.name==='Rope Maker').create(tile); break;

                    default:
                        console.log('Error in game.setupGame->load structures: structure type '+ content.structures[i].name +' not found in list');
                }*/
                let bType = game.blockTypes.find(ty=>ty.name===content.structures[i].name);
                if(typeof(bType)==='undefined') {
                    console.log('Error in game.setupGame->load structures: structure type '+ content.structures[i].name +' could not be loaded');
                    continue;
                }
                let b = bType.create(tile);
                b.onLoad(content.structures[i]); // Let the structure collect all its relevant data

                game.blockList.push(b);
                tile.buildid = b.id;
                tile.image = b.image;
                tile.modified = false; // nothing counts as modified here, as it still matches the status that is saved on the server
                // We also don't need to generate a construct task (when applicable); if not built there should already be that task assigned
            }
        }

        // Now, we must load tasks. This really involves converting task content from server into working tasks here
        if(content.tasks!==null) {
            game.tasks = content.tasks.map(task => {
                if(task.building===0) {
                    delete task.building;
                }else{
                    task.building = game.blockList.find(b=>b.id===task.building);
                    // The task field will need to be correctly associated with the target building's tasks, too. However, not all tasks
                    // are associated with a specific building type.
                    let rootTask = task.building.tasks.find(t=>t.name===task.task);
                    if(typeof(rootTask)!=='undefined') {
                        task.task = rootTask;
                    }
                }
                if(task.targetx===-1) delete task.targetx;
                if(task.targety===-1) delete task.targety;

                // Also attach the worker, instead of only its id
                if(task.worker!==0) {
                    task.worker = game.workers.find(w=>w.id===task.worker);
                }

                // The ToolsNeeded structure will need quite a bit more management
                task.toolsNeeded = task.toolsNeeded.map(tn=>{
                    // Case 1: no tool has been selected yet
                    if(tn.selected==="null") {
                        tn.selected = null;
                        return tn;
                    }

                    // Case 2: a worker is carrying the target tool. We need the selected property to target the specific tool,
                    // then clear the other variables
                    if(tn.selectedAt==='worker') {
                        let worker = game.workers.find(w=>w.id===tn.selectedWorker);
                        tn.selected = worker.carrying.find(i=>i.name===tn.selected);
                        delete tn.selectedAt;
                        delete tn.selectedWorker;
                        return tn;
                    }

                    // Case 3: the item is on a map tile. Again, set the selected property to target the specific tool
                    let tile = game.tiles.find(t=>t.x===tn.selectedx && t.y===tn.selectedy);
                    tn.selected = tile.items.find(i=>i.name===tn.selected);
                    delete tn.selectedx;
                    delete tn.selectedy;
                    return tn;
                });
                return task;
            });
        }
        
        // At this point, we have all buildings, workers and tasks loaded. But they're not associated with each other.
        // Run through all buildings and swap the task id for the task itself (with the same id)
        for(let i=0; i<game.blockList.length; i++) {
            game.blockList[i].activeTasks = game.blockList[i].activeTasks.map(t=>game.tasks.find(u=>u.id===t));
        }
        for(let i=0; i<game.workers.length; i++) {
            game.workers[i].tasks = game.workers[i].tasks.map(t=>game.tasks.find(u=>u.id===t));
        }
        console.log(game.workers);

        // Lastly, we need to get the last task id of the current list, to prevent duplicating task ids between saves
        game.lastTaskId = game.tasks.reduce((carry, task)=>Math.max(carry, task.id), 0);
        
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
        window.game = game;
    },

    stopGame: () => {
        // A public function to stop the game
        clearTimeout(game.timeout);
        game.timeout = null;
        game.runState = 0;
    },
    checkUnlocks: (itemName)=>{
        // Determines if any existing buildings will become unlocked with a specific item. This is run every time a new item is created,
        // and again when the game is loaded.

        // If the item is already in the list, don't add it again
        if(game.unlockedItems.some(i=>i===itemName)) return;

        game.unlockedItems.push(itemName);
        // Also determine if this unlocks a specific building type
        for(let i=0; i<game.blockTypes.length; i++) {
            if(game.blockTypes[i].locked===0) continue;
            // Run through each element of the prereq array. The outer array denotes AND clauses, the inner array denotes OR clauses
            if(game.blockTypes[i].prereq.every(outer=>(
                outer.some(inner=>game.unlockedItems.some(item=>item===inner))
            ))) {
                game.blockTypes[i].locked = 0;
                if(typeof(game.updateWorkers)==='function')
                    game.updateWorkers([...game.workers]); // We need to trigger a page update, so that this building will display
            }
        }

        // For all existing structures, we also want to determine if this item unlocks new abilities in the structures
        for(let i=0; i<game.blockTypes.length; i++) {
            if(game.blockTypes[i].newFeatures.includes(itemName)) game.blockTypes[i].featuresUnlocked = true;
        }
        
    },
    createItem:(itemname, itemgroup, extras)=>{
        // Creates a new item, returning its structure. New items are added to the unlock list, if they don't already exist in it
        // itemname - name of this new object
        // itemgroup - what type of object this is. Pick between: item, tool, food, dust, liquid, gas
        // itemextras - extra fields for this item, depending on what type it is
        //    endurance (as float): for tools, determines how long this item lasts
        //    efficiency (as float): for tools, determines how fast this item completes work
        //    lifetime (as int): for food, how long (in seconds) this food will last. Ideally, this will only be checked before the food is
        //      used; the food won't be discarded until that point. Thus unuseable food will still take up inventory space. But this part isn't
        //      coded yet
        //    temperature (as float): for food, liquids & gasses, how hot this item is
        // Returns the completed object; it is not attached to anything specific

        // First, check if this item type is in the unlocked items list yet
        
        game.checkUnlocks(itemname);

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
            if(x<0 || x>41) {
                //console.log('out of bounds');
                return false;
            }
            if(y<0 || y>41) {
                //console.log('out of bounds');
                return false;
            }

            let tile = game.tiles.find(t=>t.x===x && t.y===y);
            if(typeof(tile)==='undefined') return false;

            return tile.items.some(i=>{
                //if(i.name===targetItem) {
                    //console.log('Found target');
                //}
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
    findItemFromList: (workerx, workery, itemList, skipFlagged=false, forTask=null) => {
        // Works like findItem, but accepts a list of acceptable items instead of just one.
        // workerx - X coordinate to begin searching from
        // workery - Y coordinate to begin searching from
        // itemList - array of item names to look for
        // skipFlagged - true to exclude any items already flagged for a project
        // forTask - task instance this is for. If not null, items associated with this task will be included

        // Let's start with a function
        function hasItem(x,y) {
            // returns an item name if this tile has any of the target items, or an empty string if not found
            if(x<0 || x>41) return false;
            if(y<0 || y>41) return false;

            let tile = game.tiles.find(t=>t.x===x && t.y===y);
            if(typeof(tile)==='undefined') return '';

            let slot = tile.items.findIndex(i=>{
                if(skipFlagged) {
                    if(i.inTask!==0) {
                        if(forTask!==null && forTask===i.inTask) {
                            return itemList.includes(i.name);
                        }
                        return false; // this item is tagged for some other task
                    }
                    // this item is not part of any task
                    return itemList.includes(i.name);
                }else{
                    return itemList.includes(i.name);
                }
            });
            if(slot===-1) return '';
            return tile.items[slot].name;
        }

        let distance = 1;
        let i = hasItem(workerx,workery);
        if(i!='') return [workerx,workery,i];  // This one is easy - there's already an item at the worker's spot
        while(true) {
            for(let line=-distance; line<distance; line++) {
                i = hasItem(workerx+line, workery-distance); if(i!='') return [workerx+line, workery-distance,i]; // right across the top
                i = hasItem(workerx+distance, workery+line); if(i!='') return [workerx+distance, workery+line,i]; // down the right
                i = hasItem(workerx-line, workery+distance); if(i!='') return [workerx-line, workery+distance,i]; // left across the bottom
                i = hasItem(workerx-distance, workery-line); if(i!='') return [workerx-distance, workery-line,i]; // up the left
            }
            distance++;
            if(workerx+distance>41 && workerx-distance<0 && workery+distance>41 && workery-distance<0) return [-1,-1,''];
        }
    },
    groupItems: original=>{
        // takes a list of items, and groups them into name & amount sets
        // Returns the completed groupings as an array

        //console.log(original);
        let list = [];
        for(let i=0; i<original.length; i++) {
            let slot = list.findIndex(l=>l.name===original[i].name);
            if(slot===-1) {
                list.push({name:original[i].name, qty: 1});
            }else{
                list[slot].qty++;
            }
        }
        return list;
    },
    createTask: (mods)=>{
        // Creates a new task, assigning it to the game.tasks list
        // mods - object that is attached to the new task object, replacing any pre-made properties

        // It has become clear that I need to validate these settings, as I keep finding myself making incomplete tasks, and it's
        // throwing all kinds of errors. Therefore, we should do some error checking on our input
        if(mods.taskType==='workAtBuilding' && typeof(mods.targetx)==='undefined') {
            console.log('Error: new task missing location');
        }
        if(typeof(mods.task)==='undefined') {
            console.log('Error: new task missing root task instance');
        }
        // Well, that's all I can think of so far...

        game.lastTaskId = game.lastTaskId+1;
        
        let task = {
            id: game.lastTaskId,
            building: null,
            task: null,
            taskType: '',
            worker: null,
            status: 'unassigned',
            targetx: null,
            targety: null,
            itemsNeeded: [],
            toolsNeeded: [],
            skillsNeeded: [],
            taggedItems: [], // all items tagged for use with this task, so they can be cleared when the job is done
            progress: 0,
            ticksToComplete: 1,
            ...mods
        };
        game.tasks.push(task);
        return task;
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
            hasWorkerUpdate ||= game.workers[i].tick();
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


