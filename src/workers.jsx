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
        addTask: (building, taskName,assignStyle,amount,targetItem='') => {
            // Gives a new task to a worker
            // No return value. The building and worker will be modified.

            // Assertions
            // building has the correct task associated to it
            // assignStyle is one of: assign, first, queue, or reassign

            w.status = 'working';
            
            let task = building.tasks.find(t=>(t.name===taskName));
            if(typeof(task)==='undefined') {
                console.log(`Error: could not find task ${taskName} at building ${building.name}. Current worker tasks: `+
                            w.tasks.reduce((c,t)=>(c+', '+ t.subtask),''));
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
                taggedItems: [],
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
        },
        addMoveItemTask: (building, targetItem, amount, targetx, targety)=>{
            // Creates a new task that specifically moves an item from one location to another. This task will be done before any other
            // task for this worker. If the target item doesn't exist, another task will be created & inserted before this, to craft
            // that item. This process will continue until a crafting solution can be completed.
            // building - what building the base task is for
            // targetItem - name of the item to move
            // amount - number of items to pick up at the target location
            // targetx & targety - location on the map to move the items to

            /*
            SO here's how the process should work
            1) Player assigns the workAtSite task to worker
            2) Worker ticks; checks & finds that there is no tool at the job site. AddMoveItemTask is called, thus pausing the workAtSite task.
            3) Worker goes to the location of the tool, takes it to the workAtSite location. That ends the moveItem task.
            4) Worker resumes the workAtSite task - they're already 'on scene'

            If the item doesn't already exist somewhere:
            1) Player assigns the workAtSite task to worker.
            2) Worker ticks, finds no tool at the job site. AddMoveItemTask() creates a moveItem task, and also a task to create the new item,
                before moveItem.
            3) Worker creates the item, ending the first task.
            4) MoveItem has the worker move the item to the job site
            5) Worker resumes workAtSite, already at location.

            If no prereq item exists because it needs to be crafted first:
            1) Player assigns the workAtSite task to worker. This completes without a location
            2) Worker ticks, and finds that there is no target location. It searches again for the item to find, and can't locate it. It
                then creates a task to create the item needed.
            3) Worker creates the missing item, ending the first task
            4) Work ticks, and finds that there is no target location. It searches again for the item to find, and locates it (usually at
                the same location as the worker).
            */

            // Assertions
            // Building - is a valid building to get work from
            // targetItem - valid string of an item in the game
            // amount - non-zero number of items 
            // targetx & targety - valid map coordinates that a worker can go to

            let taskSlot;
            let targetBuilding;

            let [sourcex, sourcey] = game.findItem(w.x, w.y, targetItem, true);
            if(sourcex===-1 && sourcey===-1) {
                // No items currently exist on the map. Instead, we need to find a building capable of crafting that item
                taskSlot = 0;
                targetBuilding = game.blockList.find(b=> {
                    if(typeof(b.tasks)==='undefined') return false; // This structure has no tasks (not sure why, yet...)
                    // Find a task with the correct output items
                    return b.tasks.some((t,index)=> {
                        // every task should have an outputItems list
                        if(typeof(t.outputItems)==='undefined') {
                            console.log('Error in workers->addMoveItemTask->find producer building: block '+ b.name +' task '+ t.name +' missing outputItems array. Continuing without...');
                            return false;
                        }
                        if(t.outputItems.includes(targetItem)) {
                            taskSlot = index;
                            return true;
                        }
                        return false;
                    });
                     
                });
                // From this... pile, we should have a target building we can assign a new task to. That is, if any such building exists; let's check
                if(typeof(targetBuilding)==='undefined') {
                    console.log('could not find any building to produce item='+ targetItem +'. Action aborted');
                    return;
                }
                // We can go ahead and set the sourcex & y to this building's location
                sourcex = targetBuilding.x;
                sourcey = targetBuilding.y;
            }

            let taskInstance = {
                worker:w,
                task: null, // can we operate this without a specific task object?
                progress: 0,
                progressTarget: 2,
                count: 0,
                targetCount: amount
            };
            let taskPack = {
                task: null,
                // We are not including a building attribute here, since this isn't actually tied to any building
                taskInstance: taskInstance,
                subtask: 'moveitem',
                targetx: sourcex,
                targety: sourcey,
                nextx: targetx,
                nexty: targety,
                targetitem: targetItem,
                taggedItems: []
            }

            // These tasks are always inserted first
            w.tasks.splice(0,0,taskPack);

            // Now, handle situations where we have to craft the item before we can pick it up
            if(typeof(targetBuilding)!=='undefined') {
                // This should behave like a regular task
                w.addTask(targetBuilding, targetBuilding.tasks[taskSlot].name, 'first', 1, '');
            }else{
                // While we're here, we need to flag the target item as being used for a specific task
                // We have the location that the item is at, but not the item itself
                let tile = game.tiles.find(t=>t.x===sourcex && t.y===sourcey);
                let item = tile.items.find(i=>i.name===targetItem);
                // item.inTask = taskInstance; But see, this doesn't actually work; it would attach it to the moveItem task,
                // and that doesn't solve anything
            }
        },
        work: ()=>{
            // Has the worker do another tick of the current task, if one is assigned
            // Returns true if any workers have updated their position (thus needing the map to be redrawn), or false if not

            if(w.tasks.length===0) return;  // We later plan on having them wander around - or even help other workers. But for now they'll just sit idle
            let p = null;

            let tile, itemSlot;

            // Certain tasks require having items on hand before we can proceed to complete the given task
            switch(w.tasks[0].subtask) {
                case 'workatspot': case 'workonsite':
                    // Before attempting to complete this task, we need to make sure that we have a place to go. If not, we may try to
                    // find a place... sometimes we can't until other items are available
                    if(typeof(w.tasks[0].targetx)==='undefined') {
                        // Try to find the item now. It might tell us it can't be found
                        let pack = w.tasks[0].task.getTask(w);
                        if(typeof(pack.targetx)==='undefined') {
                            // There is still no target location, because no pre-req items exist. We will need to craft at least the
                            // first item of this list, to give the worker somewhere to start from
                            // (this assumes there's an itemsNeeded list attached to the task at hand... if not, I don't know what to do)
                            w.addMoveItemTask(w.tasks[0].atBuilding, w.tasks[0].task.itemsNeeded[0], 1, w.x, w.y);
                            console.log(w.tasks);
                        }else{
                            w.tasks[0].targetx = pack.targetx;
                            w.tasks[0].targety = pack.targety;
                        }
                        return false;
                    }

                    // Before moving, check that all needed equipment is at the job site
                    let checktile = game.tiles.find(t=>t.x===w.tasks[0].targetx && t.y===w.tasks[0].targety);
                    if(![...w.tasks[0].task.itemsNeeded, ...w.tasks[0].task.toolsNeeded].every(i=>{
                        if(checktile.items.some(j=>j.name===i)) return true;
                        // Item i (as a name) wasn't found. Create a task to move that item to our target's location
                        let workTask = w.tasks[0];  // pick up this task so we can use it after this call
                        w.addMoveItemTask(w.tasks[0].atBuilding, i, 1, w.tasks[0].targetx, w.tasks[0].targety);

                        if(w.tasks[0].subtask==='moveitem') {
                            // There already exists an item on the map; its location should be at w.tasks[0].targetx,targety.
                            // Go ahead and mark the item as part of the root task
                            let tile = game.tiles.find(t=>t.x===w.tasks[0].targetx && t.y===w.tasks[0].targety);
                            let item = tile.items.find(j=>j.name===i);
                            item.inTask = workTask.taskInstance;
                            workTask.taggedItems.push(item);
                            //console.log(item);
                        }

                        // We're gonna have to break the mold in terms of assigning tasks. We need a task before this current
                        // one that will pick up an item at one place, and put it down at another

                        return false;
                    })) {
                        // One of these elements wasn't found. Return now, and the new task will 
                        return;
                    }
                break;
            }

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
                            tile = game.tiles.find(t=>t.x===w.x && t.y===w.y);
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
                    
                    case 'moveitem':
                        // This is similar to fetchItem, but the destination location is marked as nextx & y, not the task's building location

                        let movetile = game.tiles.find(t => t.x===w.x && t.y===w.y);
                        // First, determine if this has nextx & y variables
                        if(typeof(w.tasks[0].nextx)==='undefined') {
                            // So, this should be where we are placing an item down at.
                            itemSlot = w.carrying.findIndex(i=>i.name===w.tasks[0].targetitem);
                            //tile = game.tiles.find(t=>t.x===w.x && t.y===w.y);
                            movetile.items.push(w.carrying.splice(itemSlot,1)[0]);
                            w.clearTask();
                            console.log(w.name +' finished moveitem. Task list now '+ w.tasks.reduce((carry,t)=>(carry +","+ t.subtask), '') +
                                        '. Items on site: '+ movetile.items.reduce((carry,i)=>(carry +','+ i.name), ''));
                            return;
                        }

                        // We still have nextx & y, so we should be picking an item up from here
                        
                        itemSlot = movetile.items.findIndex(i=>i.name===w.tasks[0].targetitem);
                        if(itemSlot===-1) {
                            // Uhhh, we didn't find the item here... maybe someone else swiped it?
                            console.log('Error in moveitem: target item not found! Task cancelled');
                            w.clearTask();
                            return;
                        }
                        w.carrying.push(movetile.items.splice(itemSlot,1)[0]);
                        console.log(w.name +' now carrying '+ w.carrying.reduce((c,i)=>(c +','+ i.name), '') +' mostly need the '+ w.tasks[0].targetitem);

                        // Now fix the target & next variables
                        w.tasks[0].targetx = w.tasks[0].nextx;
                        w.tasks[0].targety = w.tasks[0].nexty;
                        delete w.tasks[0].nextx;
                        delete w.tasks[0].nexty;
                        // That should force the worker to travel to a new location
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
                            let pack = w.tasks[0].task.getTask(w);
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

                        // By the time we reach here we should already be at the place. We just need to make progress.
                        w.tasks[0].taskInstance.progress++;
                        if(w.tasks[0].taskInstance.progress < w.tasks[0].taskInstance.progressTarget) {
                            w.tasks[0].task.onProgress();  // This basically calls the structure's Blinker function
                            return;
                        }

                        // Work here is done
                        w.tasks[0].task.onComplete(w);
                        w.tasks[0].taskInstance.count++;
                        if(w.tasks[0].taskInstance.count < w.tasks[0].taskInstance.targetCount) {
                            // We made one, now onto the next
                            w.tasks[0].taskInstance.progress -= w.tasks[0].taskInstance.progressTarget; // Don't forget to reset progress!
                            let pack = w.tasks[0].task.getTask(w);
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

                    case 'fetchitem':
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
                                w.tasks[0] = {...w.tasks[0], ...w.tasks[0].task.getTask(w)};
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
                        w.tasks[0] = {...w.tasks[0], ...w.tasks[0].task.getTask(w)};
                        w.tasks[0].task.onProgress();
                        return;
                    
                    default:
                        console.log('Error in workers->tick(): task '+ w.tasks[0].subtask +' not handled. Cancelling task');
                        w.clearTask();
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
            if(w.tasks[0].targetx!==w.x) {
                let d = (w.tasks[0].targetx-w.x > 0)? 1: -1;
                w.x += d;
            }
            if(w.tasks[0].targety !== w.y) {
                let d = (w.tasks[0].targety - w.y > 0)? 1: -1;
                w.y += d;
            }
            //w.x += (w.tasks[0].targetx===w.x)?0:(w.tasks[0].targetx-w.x) / Math.abs(w.tasks[0].targetx - w.x);
            //w.y += (w.tasks[0].targety===w.y)?0:(w.tasks[0].targety-w.y) / Math.abs(w.tasks[0].targety - w.y);
            // Do this formula again for the new location
            let diffx = 0, diffy = 0;
            if(w.tasks[0].targetx !== w.x) {
                diffx = (w.tasks[0].targetx - w.x > 0)? 1: -1;
            }
            if(w.tasks[0].targety !== w.y) {
                diffy = (w.tasks[0].targety - w.y > 0)? 1: -1;
            }
            //let diffx = (w.tasks[0].targetx===w.x)?0:(w.tasks[0].targetx-w.x) / Math.abs(w.tasks[0].targetx - w.x);
            //let diffy = (w.tasks[0].targety===w.y)?0:(w.tasks[0].targety-w.y) / Math.abs(w.tasks[0].targety - w.y);
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

            // Some tasks won't have buildings associated to them... that's okay
            if(typeof(w.tasks[0].atBuilding)==='undefined') {
                console.log('In w.clearTask(): task had no building assigned. Deleting task anyway');
                w.tasks.splice(0,1);
                console.log(w.tasks);
                return;
            }

            // For all items associated with this task, clear their tags to this task
            w.tasks[0].taggedItems.forEach(i=>{
                i.inTask = 0;
                //console.log(i);
            });

            let slot = w.tasks[0].atBuilding.activeTasks.findIndex(task=>(w.id===task.worker.id && w.tasks[0].task.name===task.task.name));
            if(slot===-1) {
                console.log('In w.clearTask(): did not find task at building. building tasks:', w.tasks[0].atBuilding.activeTasks);
                w.tasks.splice(0,1);
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


