/*  game.jsx
    Holds the core game object, controlling all functionality of game operations
    For the game Settlers & Warlords
*/

import { DanLog } from "./libs/DanLog.js";
import { DanCommon } from './libs/DanCommon.js';

import { createWorker } from "./worker.jsx";
import { LeanTo } from "./structures/LeanTo.jsx";

export const game = {
    timerLoop: null, // Contains a timer handle when the game starts
    tiles: [], // all tiles of the local map
    workers: [], // all workers on this map
    updateWorkers: null, // references React's setLocalWorkers function. Gets updated on game setup
    structures: [], // all structures added to this map
    localMapBiome: '',

        // Each structure needs a unique ID
    lastStructureId: 0,
    getNextStructureId: ()=>{
        game.lastStructureId++;
        return game.lastStructureId;
    },

    tasks: [],
    lastTaskId: 0, // All tasks also need IDs
    getNextTaskId: ()=>{
        game.lastTaskId++;
        return game.lastTaskId;
    },

    structureTypes: [
        LeanTo()
    ],

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
                build.onLoad(st);

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
                    task.building = building.id;
                    // We don't need to reference the other way, since buildings only keep task IDs. But we do need to assign the
                    // root task to this task
                    task.task = building.tasks.find(t=>t.name===task.name);
                }else{
                    console.log('This task does not have a building associated to it');
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

    createTask: (building, task)=>{
        // Generates a new task, assigning it to the game object and to the respective building.
        //  building - what building this task is associated with
        //  task - class details to generate a task instance from

        // All tasks start without a worker assigned to it; it will be assigned later
        console.log(task);

        // Task location depends on settings in the task
        let targetx = null;
        let targety = null;
        if(task.workLocation==='structure') {  //if(task.workAtStructure) {
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
            //itemsNeeded: [] - this data will be pulled as static information from the root task object. No need to keep it here
            itemsTagged: [],
            progress: 0,
            //ticksToComplete - this will also be from the root task object
        };
        // Work on this task won't begin until all the needed items are in the tile inventory at [targetx,targety]

        game.tasks.push(newtask);
        building.activeTasks.push(newtask.id);
        return newtask;
    }
};

