/*  workers.jsx
    Manages workers and all the various tasks associated with them
    For the game Settlers & Warlords
*/

import {game} from "./game.jsx";
import {minimapTiles} from "./comp_LocalMap.jsx";

let lastWorkerId = 0;

export function createNewWorker(pack) {
    // Creates a new worker, with all the proper functions tied to them. The new worker will be automatically attached to the game's workers list
    // pack: object containing info from the server
    //      id - optional. The server doesn't assign IDs to workers, but they will be kept when saved
    //      name - name of this worker
    //      x & y - map coordinates of this worker
    //      moveCounter - 
    // Returns the completed worker object

    let workerid = pack.id;
    if(typeof(workerid)==='undefined') {
        lastWorkerId++;
        workerid = lastWorkerId;
    }
    let w = {
        name:pack.name,
        id: workerid,
        x:pack.x,
        y:pack.y,
        status:'idle',
        moveCounter: pack.moveCounter ?? 0,
            // counter influencing movement. The game will Tick 20 times a second, but workers will take longer to travel each square of the map
        tasks:[],    // list of tasks this worker is completing. The first task is always what they are currently working on
        carrying:[],  // list of items this worker is carrying. Some items will enable workers to carry more
        addTask: (building, taskName,assignStyle,amount,toolName='') => {
            // Gives a new task to a worker
            // No return value. The building and worker will be modified.

            // Assertions
            // building has the correct task associated to it
            // assignStyle is one of: assign, first, queue, or reassign

            w.status = 'working';
            
            let task = building.tasks.find(t=>(t.name===taskName));
            if(typeof(task)==='undefined') {
                console.log(`Error: could not find task ${taskName} at building ${building.name}`);
                return;
            }

            if(typeof(task.buildTime)==='undefined') {
                console.log(`Task ${building.name}->${taskName} missing buildTime`, task);
            }

            let taskInstance = {
                worker:w,
                task:task,
                progress:0,
                progressTarget:task.buildTime,
                count:0,
                targetCount:amount
            };
            building.activeTasks.push(taskInstance);
            let taskPack = {
                task:task,
                atBuilding:building,
                taskInstance:taskInstance,
                ...task.getTask(w)
            }

            // Giving the task to the worker depends on the assignStyle given
            switch(assignStyle) {
                case 'assign': case 'queue':
                    w.tasks.push(taskPack);
                break;
                case 'first':
                    w.tasks.splice(0,0,taskPack);
                break;
                case 'reassign':
                    w.clearTask();
                    w.tasks.splice(0,0,taskPack);
                break;
            }

            // So, that gives us a completed task... except for gathering tools for a job
            if(typeof(task.toolsNeeded)==='undefined') return;
            if(task.toolsNeeded.length===0) return;
            // Find the getTool task for this building. Each building that uses tools should have one
            //let toolTask = building.tasks.find(t=>t.name==='Get Tool');
            // For each tool, add a new task to fetch the target tool
            for(let i=0; i<task.toolsNeeded.length; i++) {
                w.addTask(building, "gettool", 'first', 0, task.toolsNeeded[i]);
            }
            
            console.log(w.tasks);
            
        },
        work: ()=>{
            // Has the worker do another tick of the current task, if one is assigned
            // Returns true if any workers have updated their position (thus needing the map to be redrawn), or false if not

            if(w.tasks.length===0) return;  // We later plan on having them wander around - or even help other workers. But for now they'll just sit idle
            let p = null;

            return w.move(()=>{
                switch(w.tasks[0].subtask) {
                    case 'cantwork':
                        // Whatever work was assigned to this worker can't be done right now. Some tasks need reassignment to do something else;
                        // for example, getting a tool when none is available means going to make it instead.
                        if(w.tasks[0].toolNeeded) {
                            // In this case, the worker needs a tool, but none exists to equip. They need to go make one. They will also
                            // need to equip that tool once completed.

                            // We actually have two scenarios to encounter this: when the task is first assigned and the worker needs to
                            // craft the tool. And then when the worker has just finished crafting the tool and needs to pick it up.
                            // So, determine if we have the target tool at this worker's location
                            let tile = game.tiles.find(t=>t.x===w.x && t.y===w.y);
                            let slot = tile.items.findIndex(i=>i.name===w.tasks[0].targetitem);
                            if(slot===-1) {
                                // Find a building - and its task - that can craft this item... that means a new attribute for each task
                                let taskSlot = 0;
                                for(let b=0; b<game.blocks.length; b++) {
                                    taskSlot = game.blocks[b].tasks.findIndex(t=>{
                                        return t.outputItems.includes(w.tasks[0].targetitem);
                                    });
                                    if(taskSlot!==-1) {
                                        w.addTask(game.blocks[b], game.blocks[b].tasks[taskSlot].name, 'first', 1, '');
                                        w.tasks[0].onProgress();
                                        return; // That should be all we need here
                                    }
                                }
                                // If we go through all the buildings and can't find the correct task, we'll reach here
                                console.log(`${w.name} can't find a building to make ${w.tasks[0].targetitem}. Task cancelled.`);
                                w.clearTask();
                            }

                            // We should be able to equip this tool, and the next task in line should use it (or gather another tool).
                            w.carrying.push(...tile.items.splice(slot,1));
                            console.log('CantWork task completed');
                            w.clearTask();
                        }
                        return;
                    
                    case 'gettool':
                        // We should be able to pick up a tool where we have arrived
                        let tile = game.tiles.find(t=>t.x===w.x && t.y===w.y);
                        let islot = tile.items.findIndex(i=>i.name===w.tasks[0].targetitem);
                        if(islot===-1) {
                            // We didn't find the tool here. Replace this task with a can't-work task so we can craft one
                            // Actually, replacing this with a cant-work task might just be easier
                            w.tasks[0].subtask = 'cantwork';
                            w.tasks[0].toolNeeded = true;
                            return;
                        }

                        // Pick up the tool here; that will conclude this task
                        w.carrying.push(...tile.items.splice(islot,1));
                        w.clearTask();
                        console.log('getTool task completed');
                        return;
                    case 'construct':
                        // Worker is at the location to complete construction. Let's make progress on it.
                        w.tasks[0].taskInstance.progress++;
                        w.tasks[0].task.onProgress();  // This basically calls the structure's Blinker function
                        if(w.tasks[0].taskInstance.progress<w.tasks[0].taskInstance.progressTarget) return;

                        // Worker has completed their task
                        w.tasks[0].task.onComplete();
                        w.clearTask();
                        return;
                    
                    case 'workonsite':
                        // Worker moves to the location to craft something
                        w.tasks[0].taskInstance.progress++;
                        if(w.tasks[0].taskInstance.progress < w.tasks[0].taskInstance.progressTarget) {
                            w.tasks[0].task.onProgress();
                            return;
                        }

                        // Work here is done
                        w.tasks[0].task.onComplete();
                        w.tasks[0].taskInstance.count++;

                        if(w.tasks[0].taskInstance.count < w.tasks[0].taskInstance.targetCount) {
                            // We made one, now onto the next
                            w.tasks[0].taskInstance.progress -= w.tasks[0].taskInstance.progressTarget; // Don't forget to reset progress!
                            let pack = w.tasks[0].task.getTask(w.x, w.y);
                            w.tasks[0] = {...w.tasks[0], ...pack};
                            // Remember, spread operator will overwrite previously posted attributes
                            w.tasks[0].task.onProgress();
                            return;
                        }

                        // There is no more work here. Close out the building task; but we also need to trigger progress
                        p = w.tasks[0].task.onProgress;
                        w.clearTask();
                        p();
                        return;

                    case 'workatspot':
                        // We are going to a particular spot to do work, instead of a specific block.

                        // Before making progress here, we need to ensure we have everything needed
                        if(!w.carrying.some(i=>i.name==='Flint Knife')) {
                            // We don't have the necessary materials on hand. Create a pickupItem task to retrieve this item
                            w.addTask(w.tasks[0].atBuilding, 'moveItem', 'first', 1);
                            // Okay but where are we moving it to?!?
                            return;
                        }

                        // By the time we reach here we should already be at the place. We just need to make progress.
                        w.tasks[0].taskInstance.progress++;
                        if(w.tasks[0].taskInstance.progress < w.tasks[0].taskInstance.progressTarget) {
                            w.tasks[0].task.onProgress();  // This basically calls the structure's Blinker function
                            //w.tasks[0].atBuilding.blinker(++w.tasks[0].atBuilding.blink);
                            return;
                        }

                        // Work here is done
                        w.tasks[0].task.onComplete(w);
                        w.tasks[0].taskInstance.count++;
                        if(w.tasks[0].taskInstance.count < w.tasks[0].taskInstance.targetCount) {
                            // We made one, now onto the next
                            w.tasks[0].taskInstance.progress -= w.tasks[0].taskInstance.progressTarget; // Don't forget to reset progress!
                            let pack = w.tasks[0].task.getTask(w.x, w.y);
                            w.tasks[0] = {...w.tasks[0], ...pack};
                            // Remember, spread operator will overwrite previously posted attributes
                            w.tasks[0].task.onProgress();
                            return;
                        }

                        // There is no more work here. Close out the building task; but we also need to trigger progress
                        p = w.tasks[0].task.onProgress;
                        w.clearTask();
                        p();
                        return;

                    case 'moveitem':
                        // We are going to a location to pick something up, then bringing it to our structure

                        // Assertions
                        // w.tasks[0].targetitem is a valid item to pick up & put down
                        
                        // Start by finding the tile the worker is on. If it's the building, we drop an item. Otherwise, pick something up
                        let workertile = game.tiles.find(e=>e.x===w.x && e.y===w.y);
                        if(typeof(workertile.items)==='undefined') workertile.items = [];

                        if(!(w.tasks[0].atBuilding.x===w.x && w.tasks[0].atBuilding.y===w.y)) {
                            // This is where we pick an item up at. First, find the item in this tile's inventory
                            let slot = workertile.items.findIndex((i,index)=>{
                                if(typeof(i)==='undefined') {
                                    console.log(workertile.items); //workertile.landtype +','+ workertile.x +','+ workertile.y +','+ index);
                                }
                                return i.name===w.tasks[0].targetitem;
                            });
                            if(slot===-1) {
                                // We didn't find the item we were looking for. Don't worry, this can happen, especially for the Forage Post
                                // Let's get a new task from the same source
                                w.tasks[0] = {...w.tasks[0], ...w.tasks[0].task.getTask(w.x, w.y)};
                                return;
                            }

                            // Pick up this item, then start heading to the target structure
                            w.carrying.push(workertile.items[slot]);
                            workertile.items.splice(slot,1);
                            w.tasks[0].targetx = w.tasks[0].atBuilding.x;
                            w.tasks[0].targety = w.tasks[0].atBuilding.y;
                            return;
                        }

                        // This is where we need to drop the item off at
                        let slot = w.carrying.findIndex(e=>e.name===w.tasks[0].targetitem);
                        if(slot===-1) {
                            console.log(`Error in workers->work->case fetchitem: ${w.name} tried to place an item, but isn't carrying it now. Item=${w.tasks[0].targetitem}, carrying size=${w.carrying.length}. Task cancelled`);
                            w.clearTask();
                            return;
                        }
                        workertile.items.push(w.carrying[slot]);
                        w.carrying.splice(slot,1);
                        w.tasks[0] = {...w.tasks[0], ...w.tasks[0].task.getTask(w.x,w.y)};
                        w.tasks[0].task.onProgress();
                        return;
                }
            });
        },
        move: (callback)=>{
            // Handles worker movement. When they reach their destination, the callback function will be called. This is mostly called from this
            // object's work() method.
            // Returns true if the worker's location has been altered, or false if not

            // Assertions
            // w.tasks[0] is the current task, and has targetx & targety defined

            // Have we reached the destination?
            if(w.x===w.tasks[0].targetx && w.y===w.tasks[0].targety) {
                callback();
                return false;
            }

            // Are we done waiting on this tile?
            if(w.moveCounter>0) {
                w.moveCounter--;
                return false;
            }

            // We are ready to move to the next tile.
            w.x += (w.tasks[0].targetx===w.x)?0:(w.tasks[0].targetx-w.x) / Math.abs(w.tasks[0].targetx - w.x);
            w.y += (w.tasks[0].targety===w.y)?0:(w.tasks[0].targety-w.y) / Math.abs(w.tasks[0].targety - w.y);
            // Do this formula again for the new location
            let diffx = (w.tasks[0].targetx===w.x)?0:(w.tasks[0].targetx-w.x) / Math.abs(w.tasks[0].targetx - w.x);
            let diffy = (w.tasks[0].targety===w.y)?0:(w.tasks[0].targety-w.y) / Math.abs(w.tasks[0].targety - w.y);
            let distance = (diffx===0 || diffy===0)?1:1.4; // This manages extra time it costs to move diagonally

            let tile = game.tiles.find(e=>e.x===w.x && e.y===w.y);
            if(typeof(tile)==='undefined') {
                console.log(`Error in worker->move: ${w.name} moved to [${w.x},${w.y}] that doesn't exist. Target:[${w.targetx},${w.targety}]`);
                w.moveCounter = 1;
                return true;
            }

            // Determine the land type, between what is naturally there vs what was added
            let landType = (tile.newlandtype===-1)? tile.landtype : tile.newlandtype;
            let tileType = minimapTiles.find(f=>f.id===landType);
            if(typeof(tileType)==='undefined') {
                w.moveCounter = 50;
                console.log(`Error: ${w.name} is on a tile that isn't in minimapTiles. Base tile=${tile.landtype}, new tile=${tile.newlandtype}`);
            }else {
                w.moveCounter = tileType.walkLag * distance;
            }
            return true;
        },
        clearTask: ()=>{
            // Clears the currently assigned task of this worker
            // No return value. The worker and the building for this task will be modified.

            // Assertions
            // w.tasks[0] is the correct activeTask instance
            // w.tasks[0].atBuilding is the correct building for this task
            // w.tasks[0].atBuilding.activeTasks has the same task instance as w.tasks[0]

            let slot = w.tasks[0].atBuilding.activeTasks.findIndex(task=>(w.id===task.worker.id));
            if(slot===-1) {
                w.tasks.splice(1,0);
                return;
            }

            // Finally, we can do what we set out for
            w.tasks[0].atBuilding.activeTasks.splice(slot,1);
            w.tasks.splice(0,1);

            if(w.tasks.length===0) w.status = 'idle';
        }
    };
    game.workers.push(w);
    return w;
}


