/*  game.jsx
    Holds the core game object, controlling all functionality of game operations
    For the game Settlers & Warlords
*/

import { createWorker } from "./worker.jsx";
import { minimapTiles } from "./minimapTiles.js";
import { LeanTo } from "./structures/LeanTo.jsx";
import { RockKnapper } from "./structures/RockKnapper.jsx";
import { LoggersPost } from "./structures/LoggersPost.jsx";

export const game = {
    timerLoop: null, // Contains a timer handle when the game starts
    tiles: [], // all tiles of the local map
    workers: [], // all workers on this map
    unlockedItems: [], // All items that have become accessible in this location
    updateWorkers: null, // references React's setLocalWorkers function. Gets updated on game setup
    localMapBiome: '', // This is filled out from server data

    structures: [], // all structures added to this map
    lastStructureId: 0,  // Each structure needs a unique ID
    getNextStructureId: ()=>{
        game.lastStructureId++;
        return game.lastStructureId;
    },
    structureTypes: [
        LeanTo(),
        RockKnapper(),
        LoggersPost()
    ],

    tasks: [],
    lastTaskId: 0, // All tasks also need IDs
    getNextTaskId: ()=>{
        game.lastTaskId++;
        return game.lastTaskId;
    },

    tutorialState:0,
    tutorialModes: [
        {name:'Welcome', display:'Welcome to your space! Drag the map around to view your area. Click on a tile to view info about it'},
        {name:'shelter', display:'You need shelter! Drag a lean-to from the left onto a tile that has trees. One of your workers will build it'},
        // We need to add food collection here, but don't have the Forage Post built yet
        {name:'tools1', display:`Tools are vital for progress. Place a Rock Knapper, then use it to craft a Flint Knife or Stabber (you'll need both)`},
        {name:'tools2', display:`New buildings unlocked! As you craft more materials, more abilities (buildings & tasks) become available to you.`}
    ],
    tutorialDisplay: null, // This is set to the tutorial display flag-function upon game startup
    advanceTutorial: ()=>{
        // Handles advancing the tutorial when called
        game.tutorialState++;
        if(typeof(game.tutorialDisplay)==='function') game.tutorialDisplay(true);
    },

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
            let items = []; // Right now, items only have a name - nothing else
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
            // Make sure all items have an inTask property
            items = items.map(i=>{
                if(typeof(i.inTask)==='undefined') i.inTask = 0;
                return i;
            });
            return { ...t, items: items, modified: false };
        });

        let lastStructureId = 0;
        if(content.structures!==null) {
            game.structures = content.structures.map(st=>{
                // Setting up structures will take quite a bit more to do correctly. First, find the tile the structure should be
                // placed on
                let tile = game.tiles.find(t=>st.x===t.x && st.y===t.y);
                let build = game.structureTypes.find(structureType=>structureType.name===st.name).create(tile);
                tile.image = build.image;
                build.id = st.id;
                build.activeTasks = st.activeTasks;
                if(typeof(build.onLoad)!=='undefined') build.onLoad(st);

                if(st.id>lastStructureId) lastStructureId = st.id;
                return build;
            });
            game.lastStructureId = lastStructureId;
        }

        game.workers = [];
        for(let i=0; i<content.workers.length; i++) {
            createWorker(content.workers[i]);
        }
        
        // With workers complete, we can create all the tasks
        if(content.tasks!==null) {
            game.tasks = content.tasks.map(task => {
                // We need to tie references to their actual objects, here
                if(task.building!==0) {
                    let building = game.structures.find(b=>b.id===task.building);
                    task.building = building;
                    // We don't need to reference the other way, since buildings only keep task IDs. But we do need to assign the
                    // root task to this task
                    task.task = building.tasks.find(t=>t.name===task.name);
                    if(typeof(task.task)==='undefined') task.task = null;
                }else{
                    console.log('This task does not have a building associated to it');
                    task.task = null;
                }
                if(task.worker!==0) {
                    let worker = game.workers.find(w=>w.id===task.worker);
                    task.worker = worker;
                    let taskSlot = worker.tasks.findIndex(t=>t===task.id);
                    worker.tasks[taskSlot] = task;
                    //console.log(worker.name +' got assigned task id='+ task.id);
                }else{
                    console.log('This task does not have a worker associated to it');
                }
                task.itemsTagged = task.itemsTagged.map(tag=>{
                    if(tag.place==='worker') {
                        let worker = game.workers.find(w=>w.id===tag.id);
                        if(worker.carrying.length < tag.slot) {
                            console.log('Could not use slot of '+ tag.slot +' because worker carrying has only '+ worker.carrying.length +' items');
                        }else{
                            return worker.carrying[tag.slot];
                        }
                    }
                    if(tag.place==='tile') {
                        let tile = game.tiles.find(t=>t.x===tag.x && t.y===tag.y);
                        if(tile.items.length < tag.slot) {
                            console.log('Could not use slot of '+ tag.slot +' because tile has only '+ tile.items.length +' items');
                        }else{
                            return tile.items[tag.slot];
                        }
                    }
                    console.log('Could not locate item; place type of '+ tag.place +' not supported');
                    return null;
                });
                console.log(task.taskType +' with itemsTagged:', task.itemsTagged);
                if(task.targetx===-1) task.targetx = null;
                if(task.targety===-1) task.targety = null;

                return task;
            });
        }

        game.updateWorkers = funcUpdateWorkers;

        console.log(game.workers);

        // Now we're ready to start up the game
        game.start();
        game.updateWorkers(game.workers);

        window.game = game;  // This allows us to access the Game object from the console log. Very helpful for debugging
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
            hasWorkerUpdate ||= game.workers[i].tick();   //updateWorker(game.workers[i]);
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

    createItem: (name, itemGroup, extras) => {
        // Creates a new item, returning it. New items are added to the unlock list (if not already in it). Other game features may unlock
        // from new items, as well
        // name - name of the item
        // itemGroup - what type of object it is. Pick between: item, tool, food, dust, liquid, gas
        // itemExtras - extra fields based on what type of item it is
        //      endurance (as float): for tools, determines how long this item will last, in game ticks
        //      efficiency (as float): for tools, determines how fast this item completes work
        //      lifetime (as int): for food, how long (in ticks) this food will last. Ideally, this will only be checked before the food
        //          is used / found; the food won't be discarded until then
        //      temperature (as float): for food, liquid & gasses. How hot this item is.
        //      pressure (as float): for gasses, how much pressure this gas is under, in storage
        // Returns the completed item

        // First, check if this name is in the unlocked list.
        game.checkUnlocks(name);

        return {name:name, group:itemGroup, inTask:0, ...extras};
    },

    checkUnlocks: (itemName) => {
        // Adds new items to the Unlocks list. Also determines if any existing buildings will become unlocked with a specific item

        // See if the item is already in the list. Don't add it again
        if(game.unlockedItems.some(i=>i===itemName)) return;
        game.unlockedItems.push(itemName);

        // Check unlocks of each building type
        for(let i=0; i<game.structureTypes.length; i++) {
            if(game.structureTypes[i].locked===0) continue; // already unlocked

            // We use a nested list to determine what items can unlock the building. For the outer list, we must get a match on each
            // entry of that list. For the inner list, we must get a mach on any single one. For example, [[A,B],[C]], the player can
            // unlock either A or B, but must unlock C.
            if(game.structureTypes[i].prereq.every(outer=>(
                outer.some(inner=>game.unlockedItems.some(i=>i===inner))
            ))) {
                game.structureTypes[i].locked = 0;
                // Also trigger a game update, assuming doing so is safe
                if(typeof(game.updateWorkers)==='function') game.updateWorkers([...game.workers]);
            }
        }

        // For all existing structures, we also want to determie if this new item unlocks new abilities in those structures.
        // If so, the block display on the left will become green
        for(let i=0; i<game.structureTypes.length; i++) {
            if(game.structureTypes[i].newFeatures.includes(itemName)) game.structureTypes[i].featuresUnlocked = true;
        }
    },

    pathTo: (startX, startY, callback)=>{
        // Creates a new path to a target location
        // startX & Y - where the search process begins at. This can be a worker's location, or a building
        // callback - a function called on every tile location. This will receive a tile instance, and should return true if the
        //      location is/has what is being searched for
        // Returns an object:
        //      result - if successful, returns 'success'. If not, returns 'fail', and the other parameters will not be included
        //      tile - the tile instance where the path stopped
        //      path - path for the worker to reach this item
        //      distance - total distance points needed to reach this location
        

        let filledTiles = [{
            x:startX,
            y:startY,
            travelled:0,
            path:'',
            completed: false
        }];

        let runState = true;
        while(runState) {

            // Determine if we have exhausted our search
            if(filledTiles.every(t=>t.completed)) {
                return {result:'fail'};
            }

            // Start with sorting the existing tiles
            filledTiles.sort((a,b)=> {
                // First, completed tiles need to be sorted after new tiles
                if(a.completed) return 1;
                if(b.completed) return -1;
                if(a.travelled > b.travelled) return 1;
                if(a.travelled < b.travelled) return -1;
                return 0;
            });

            // Determine if this tile is the one we need
            let tile = game.tiles.find(t=>t.x===filledTiles[0].x && t.y===filledTiles[0].y)
            if(tile.x===startX && tile.y===startY) console.log('Checking origin tile...');
            if(callback(tile)) {
                // We have a hit!
                console.log('Size of search: '+ filledTiles.length);
                return {
                    result: 'success',
                    tile:tile,
                    path: filledTiles[0].path,
                    distance: filledTiles[0].travelled
                };
            }

            // Alas, no luck. Determine the costs to travel over this tile
            let land = (tile.newlandtype===-1) ? tile.landtype : tile.newlandtype;
            let lag = minimapTiles.find(tile=>tile.id===land).walkLag;

            // Generate more filled tiles from each possible direction from here
            for(let dx=-1; dx<=1; dx++) {
                for(let dy=-1; dy<=1; dy++) {
                    if(dx===0 && dy===0) continue; // skip the tile we're already on
                    // Make sure this tile isn't outside the map
                    if(filledTiles[0].x +dx < 0) continue;
                    if(filledTiles[0].x +dx > 40) continue;
                    if(filledTiles[0].y +dy < 0) continue;
                    if(filledTiles[0].y +dy > 40) continue;

                    // Diagonals will take longer to travel through
                    let diagonals = (dx===0 || dy===0) ? 1 : 1.4;

                    // Make sure this location hasn't been filled yet
                    let locationMatch = filledTiles.findIndex(tile=>tile.x===filledTiles[0].x + dx && tile.y===filledTiles[0].y +dy);
                    if(locationMatch!==-1) {
                        if(filledTiles[locationMatch].completed===true) continue; // Don't worry about already-completed tiles

                        if(filledTiles[0].travelld + (lag * diagonals) < filledTiles[locationMatch].travelled) {
                            // Our current path is shorter than the existing one
                            filledTiles.splice(locationMatch, 1);
                            filledTiles.push({
                                x: filledTiles[0].x +dx,
                                y: filledTiles[0].y +dy,
                                travelled: filledTiles[0].travelled + (lag * diagonals),
                                path: filledTiles[0].path + ( (dy+1)*3 + (dx+1) ),
                                completed: false,
                            });
                        }
                        continue;
                    }

                    // Add this location
                    filledTiles.push({
                        x: filledTiles[0].x +dx,
                        y: filledTiles[0].y +dy,
                        travelled: filledTiles[0].travelled + (lag * diagonals),
                        path: filledTiles[0].path + ( (dy+1)*3 + (dx+1) ),
                        completed: false
                    });
                }
            }

            // Tag this tile as completed
            filledTiles[0].completed = true;
        }
    },

    createTask: (building, task, quantity=1)=>{
        // Generates a new task, assigning it to the game object and to the respective building.
        //  building - what building this task is associated with
        //  task - class details to generate a task instance from
        //  quantity - how many of this item to make. Not all tasks use a quantity amount, it will be ignored for those tasks

        // All tasks start without a worker assigned to it; it will be assigned later
        console.log(task);

        // Task location depends on settings in the task
        let targetx = null;
        let targety = null;
        if(task.workLocation==='structure') {
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
            targetItem: '',     // this is really only used in itemMove tasks, but is here so that it doesn't get missed
            //itemsNeeded: [] - this data will be pulled as static information from the root task object. No need to keep it here
            recipeChoices: [],  // This determines which option of each portion of the recipe is to be used. This is set shortly after
                                // a task is assigned
            quantity: quantity, // this value will go down as we complete each unit
            itemsTagged: [],
            hasAllItems: false, // this gets set to true when all items have been found for this task
            progress: 0,
            //ticksToComplete - this will also be from the root task object (as buildTime). If no root task is associated to this task,
            // its value will be 1 instead.
        };
        // Work on this task won't begin until all the needed items are in the tile inventory at [targetx,targety]

        game.tasks.push(newtask);
        building.activeTasks.push(newtask.id);
        return newtask;
    },

    createItemMoveTask: (item, sourcex, sourcey, destx, desty) => {
        // Creates a task to move an item to a new location. This task isn't associated to any building, but has a specific item to locate
        // on a specific tile.
        // Returns the newly made task so that it can be assigned to the right worker
        
        let newtask = {
            id: game.getNextTaskId(),
            building: null,
            task: null,
            status: 'unassigned',
            taskType: 'pickupItem', // This will be set to putdownItem once an item has been picked up
            targetx: sourcex,
            targety: sourcey,
            targetItem: item,
            recipeChoices: [],
            quantity: 1,
            itemsTagged: [],
            hasAllItems: false,
            progress: 0,
            nextx: destx,
            nexty: desty
        };
        game.tasks.push(newtask);
        return newtask;
    },

    deleteTask: (task) => {
        // Deletes a task, ensuring all references to the task are removed
        //     task - which task to delete
        // No return value

        // Start with removing the task from all tagged items. Fortunately the task has a direct link to the related items, so we can
        // just run through its list.
        for(let i=0; i<task.itemsTagged.length; i++) {
            if(task.itemsTagged[i] !== null) {
                task.itemsTagged.inTask = 0;
                console.log('Clear item tag:', task.itemsTagged[i]);
            } 
        }

        // Remove the task from the building, if there's a building associated to it
        let slot;
        let buildingHold = task.building;
        if(task.building!==null) {
            // Remember, buildings only hold the ID of a task, not the task itself
            slot = task.building.activeTasks.findIndex(t=>t===task.id);
            if(slot!==-1) task.building.activeTasks.splice(slot,1);
        }

        // Remove the task from the worker it's assigned to
        if(task.worker!==null) {
            slot = task.worker.tasks.findIndex(t=>t===task);
            if(slot!==-1) task.worker.tasks.splice(slot,1);
        }

        // Remove the task from the game
        slot = game.tasks.findIndex(t=>t===task);
        if(slot!==-1) game.tasks.splice(slot,1);

        // If the building for this task is currently selected, we need to make the building update its display 
        if(buildingHold!=null) {
            buildingHold.update();
        }

        // That should take care of it...
    }
};

