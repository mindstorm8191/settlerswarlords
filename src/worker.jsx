/*  worker.jsx
    Manages workers and all their actions
*/

import {game} from "./game.jsx";
import {minimapTiles} from "./comp_LocalMap.jsx";

let lastWorkerId = 0;

export function createNewWorker(pack) {
    // Creates a new worker from server data, adding it to the game's workers list
    //  pack - full worker content, as received from the server (from the database)
    //      id - optional. The server doesn't assign IDs to workers, but they will be kept when saved
    //      name - name of this worker
    //      x & y - map coordinates of this worker
    //      moveCounter - how long this worker must remain in this tile before being able to move to the next tile
    //      taskId - ID of the task that this worker had. This is used primarily for saving & loading the game
    // No return value

    let workerid = pack.id;
    if(typeof(workerid)==='undefined') {
        lastWorkerId++;
        workerid = lastWorkerId;
    }
    let w = {
        name: pack.name,
        id: workerid,
        x: pack.x,
        y: pack.y,
        status: 'idle',
        moveCounter: pack.moveCounter ?? 0,
        tasks: [],
        carrying: [],
        tick: () => {
            // Handles all actions of this worker
            // Returns true if this worker's location has updated (thus requiring React to re-render the map)

            // First, determine if this worker has a task
            if(w.tasks.length===0) {
                // No tasks assigned to this worker. Let's find one to assign
                let openTask = game.tasks.find(t=>t.status==='unassigned');
                if(typeof(openTask)==='undefined') {
                    // No work to do. We'll just sit here idle
                    w.status = 'idle';
                    return false;
                }
                // Assign this task to this worker
                openTask.status = 'active';
                openTask.worker = w;
                w.tasks.push(openTask); // From here, we can determine if pre-tasks need to be completed before this task can be done
                return false;
            }

            // Certain tasks require pre-setup after a worker is assigned, but before it can be started
            switch(w.tasks[0].taskType) {
                case 'fetchItem':
                    if(w.tasks[0].targetx===null && w.tasks[0].task.name==='Forage for Food') {
                        // No location for this has been determined yet. Currently, this only applies to the Forage Post. We need to
                        // locate a place now. Fortunately, we can pick a spot based on the worker's current location
                        let searchminx = Math.max(w.x-5, 0);
                        let searchmaxx = Math.min(w.x+5, 40);
                        let searchminy = Math.max(w.y-5, 0);
                        let searchmaxy = Math.min(w.y+5, 40);
                        let searchsizex = searchmaxx-searchminx;
                        let searchsizey = searchmaxy-searchminy;
                        let targetx = Math.floor(Math.random()*searchsizex) +searchminx;
                        let targety = Math.floor(Math.random()*searchsizey) +searchminy;

                        // Now, randomly decide if we find an edible item here
                        if(Math.floor(Math.random()*5)===0) {
                            // Add an apple at this location, for the worker to find & pick up
                            let tile = game.tiles.find(t=>t.x===targetx && t.y===targety);
                            tile.items.push(game.createItem("Apple", 'food', {}));
                            w.tasks[0].targetItem = 'Apple';
                        }
                        w.tasks[0].targetx = targetx;
                        w.tasks[0].targety = targety;
                    }
                break;
                case 'workAtLocation':
                case 'workAtBuilding':
                    // First, check each tool type needed, to see if they're at the location. If they're already there (and not
                    // in use), we can go ahead and add it to the toolsGot list
                    if(!w.validateTools()) return;
                    if(!w.validateItems()) return;
                break;
            }

            return w.move(()=>{
                // At this point, the worker is already at the correct location. The action done here depends on the task type
                let slot;
                let tile;
                switch(w.tasks[0].taskType) {
                    case 'construct':
                        // This worker is construting whatever building is here
                        w.tasks[0].progress++;
                        if(w.tasks[0].progress > w.tasks[0].ticksToComplete) {
                            w.tasks[0].task.onComplete(w);
        
                            // With the task complete, we can now delete it
                            w.deleteTask();
                        }else{
                            w.tasks[0].task.onProgress();
                        }
                    break;
                    case 'fetchItem':
                        // This worker needs to bring a qualified item to a specific location. They should be at the location now; all they need to
                        // do is to pick it up.
                        tile = game.tiles.find(t=>t.x===w.x && t.y===w.y);
                        if(typeof(tile.items)==='undefined') tile.items = [];
                        slot = tile.items.findIndex(i=>i.name===w.tasks[0].targetItem);
                        if(slot===-1) {
                            console.log('Did not find '+ w.tasks[0].targetItem)
                            // Item not found.
                            // At this point, workers will check themselves for being hungry, thirsty, tired, hot/cold, dirty, sick, unhappy, etc
                            // If the ForagePost is still enabled, update this task to search again
                            if(w.tasks[0].building.name==='Forage Post' && w.tasks[0].building.keepWorking) {
                                // Finding a new target is as simple as setting the target location to null
                                w.tasks[0].targetx = null;
                                w.tasks[0].targety = null;
                                return;
                            }
                            w.deleteTask();
                        }else{
                            // pick up the item here
                            if(typeof(tile.items[slot].amount)!=='undefined' && tile.items[slot].amount>1) {
                                tile.items[slot].amount--;
                                w.carrying.push({...tile.items[slot], amount:1});
                                // When we pick this item up, the remaining items don't need to be tagged with a task anymore
                                
                            }else{
                                w.carrying.push(tile.items.splice(slot, 1)[0]);
                            }

                            // Next, change this to a moveItemTo task, and set our target to the other location in this task
                            // For the ForagePost, that would be the building location
                            w.tasks[0].targetx = w.tasks[0].carryTox;
                            w.tasks[0].targety = w.tasks[0].carryToy;
                            w.tasks[0].taskType = 'moveItemTo';
                            // We still have the same target item name
                        }
                    break;
                    case 'moveItemTo':
                        // The worker has carried an item to this location. Place it in inventory... that should be all
                        tile = game.tiles.find(t=>t.x===w.x && t.y===w.y);
                        if(typeof(tile.items)==='undefined') tile.items = [];
                        slot = w.carrying.findIndex(i=>i.name===w.tasks[0].targetItem);
                        let tileSlot = tile.items.findIndex(i=>i.name===w.tasks[0].targetItem);
                        if(tileSlot===-1) {
                            // There is no matching item here
                            tile.items.push(w.carrying.splice(slot, 1)[0]);
                            console.log('Push item.', w.carrying);
                        }else{
                            if(typeof(tile.items[tileSlot].amount)==='undefined') {
                                tile.items[tileSlot].amount = 2;
                            }else{
                                tile.items[tileSlot].amount++;
                            }
                            w.carrying.splice(slot,1);
                            console.log('Append item.', w.carrying);
                        }
                        if(typeof(w.tasks[0].task.onComplete)==='function') w.tasks[0].task.onComplete(w);
                        // For the ForagePost, we will use this same worker to search for the next item
                        if(w.tasks[0].building.name==='Forage Post') {
                            if(w.tasks[0].building.keepWorking) {
                                w.tasks[0].taskType = 'fetchItem';
                                w.tasks[0].targetx = null;
                                w.tasks[0].targety = null;
                                w.tasks[0].targetitem = null;
                            }else{
                                // No more work is needed here
                                w.tasks[0].building.activeTasks.splice(w.tasks[0].building.activeTasks.findIndex(t=>t===w.tasks[0].task), 1);
                                game.tasks.splice(game.tasks.findIndex(t=>t===w.tasks[0].task), 1);
                                w.tasks.splice(0,1);
                            }
                        }else{
                            // if it's not the forage post, we can be done with this task
                            w.deleteTask();
                        }
                    break;
                    case 'workAtBuilding':
                        w.tasks[0].progress++;
                        if(w.tasks[0].progress>=w.tasks[0].ticksToComplete) {
                            w.tasks[0].task.onComplete(w);
                            // With the task complete, we can now delete it
                            w.deleteTask();
                        }else{
                            w.tasks[0].task.onProgress();
                        }
                    break;
                    case 'workAtLocation':
                        w.tasks[0].progress++;
                        if(w.tasks[0].progress>=w.tasks[0].ticksToComplete) {
                            w.tasks[0].task.onComplete(w);
                            w.deleteTask();
                        }else{
                            w.tasks[0].task.onProgress();
                        }
                    break;
                }
            });
        },
        validateTools: ()=>{
            // Ensures that the job site (where ever it is) has the correct tools needed to complete the worker's current task
            // Returns true if the tools are in place (and the current task can continue), or false if not
            if(typeof(w.tasks[0].toolsNeeded)==='undefined') {
                console.log('Task '+ w.tasks[0].task.name +' missing toolsNeeded array');
            }
            if(w.tasks[0].toolsNeeded.length===0) return true;
            for(let i=0; i<w.tasks[0].toolsNeeded.length; i++) {
                // Start with determining if we have a tool for this yet. hasTool being set to true means that the work location
                // already has the tool and it is reserved for the task at hand
                if(!w.tasks[0].toolsNeeded[i].hasTool) {
                    // Next, search the area for an appropriate tool for the job. We will do this 0-n, picking the first tool
                    // found on the list; we will want the best tool in the list first
                    const [x,y,toolName] = game.findItemFromList(w.x, w.y, w.tasks[0].toolsNeeded[i].tools, true);
                    if(toolName==='') {
                        console.log('Did not find any valid tools');
                        // We didn't find any existing tools. We'll have to make one.
                        // We should probably pick the highest level tool that has been unlocked to be crafted
                        let firstAvailable = w.tasks[0].toolsNeeded[i].tools.findIndex(t=>
                            game.unlockedItems.includes(t) && !w.tasks.some(ts=>ts.task.name.indexOf(t))
                            // Here we also make sure we don't schedule to make the same tool twice
                        );
                        // the tool name we need to make is now w.tasks[0].toolsNeeded[i].tools[firstAvailable];
                        // Now, find an existing structure that is able to create this (if it requires more parts, that can be added
                        // to the queue as well)
                        let taskSlot = null;
                        let structure = game.blockList.find(s=>{
                            let t = s.tasks.findIndex(u=>u.name.indexOf(firstAvailable)!==-1);
                            if(t===-1) return false;
                            taskSlot = t;
                            return true;
                        });
                        let newTask = structure.tasks[taskSlot].create();
                        newTask.worker = w;
                        newTask.status = 'active';
                        w.tasks.unshift(newTask); // puts at front of array - where we need it
                        return false;
                        // This should do for now. Once the tool is made, we will run this search again, find this tool, and create
                        // a task to move it to the job site
                    }else{
                        // Our tool should be located at x,y. First, tag this item for use in our work
                        game.tiles.find(t=>t.x===x && t.y===y).items.find(i=>i.name===toolName).inTask = w.tasks[0];


                        // Now, see if this is already our work location
                        if(x===w.tasks[0].targetx && y===w.tasks[0].targety) {
                            // This tool is already in place. Update this tool request to show we already have it
                            w.tasks[0].toolsNeeded[i].hasTool = true;
                        }else{
                            // Create a fetchItem task to go take it to the work site
                            let newTask = {
                                building: w.tasks[0].building,
                                task: 'Move '+ toolName +' to jobsite',
                                taskType: 'fetchItem',
                                targetx: x,
                                targety: y,
                                carryTox: w.tasks[0].targetx,
                                carryToy: w.tasks[0].targety,
                                targetItem: toolName,
                                itemsNeeded: [],
                                itemsGot: [],
                                toolsNeeded: [],
                                toolsGot: [],
                                progress: 0,
                                ticksToComplete: 1,
                                skillsNeeded: []
                            };
                            
                            game.tasks.push(newTask);
                            w.tasks.unshift(newTask);
                            console.log(w.tasks[0].building.tasks);
                            return false;
                        }
                    }
                }
            }
            return true;
        },
        validateItems: ()=>{
            // Ensures that the job site (where-ever it is) has the correct items needed to complete this job.
            // Returns true if the target task is ready to be completed, or false if not.
            
            if(w.tasks[0].itemsNeeded.length===0) return true;
            console.log(w.tasks[0].building.tasks);
            for(let i=0; i<w.tasks[0].itemsNeeded.length; i++) {
                // See if this item is already marked as being present
                if(!w.tasks[0].itemsNeeded[i].hasItem) {
                    const [x,y,itemName] = game.findItemFromList(w.x, w.y, [w.tasks[0].itemsNeeded[i].name], true);
                    if(itemName==='') {
                        // No item was found. We'll have to make one
                        let taskSlot = null;
                        let structure = game.blockList.find(s=>{
                            let t = s.tasks.findIndex(u=>u.name.indexOf(w.tasks[0].itemsNeeded[i].name)!==-1);
                            if(t===-1) return false;
                            taskSlot = t;
                            return true;
                        });
                        // Now create the task, and assign it to this worker
                        let newTask = structure.tasks[taskSlot].create();
                        newTask.worker = w;
                        newTask.status = 'active';
                        w.tasks.unshift(newTask);
                        return false;
                    }else{
                        game.tiles.find(t=>t.x===x && t.y===y).items.find(i=>i.name===itemName).inTask = w.tasks[0];
                        if(x===w.tasks[0].targetx && y===w.tasks[0].targety) {
                            // This item is already at the location.
                            w.tasks[0].itemsNeeded[i].hasItem = true;
                            return true;
                        }else{
                            // Create a fetchItem task to take the item to the correct location
                            console.log('Found '+ itemName +' at ['+ x +','+ y +']');
                            let newTask = {
                                building: w.tasks[0].building,
                                task: 'Move '+ itemName +' to jobsite',
                                taskType: 'fetchItem',
                                targetx: x,
                                targety: y,
                                carryTox: w.tasks[0].targetx,
                                carryToy: w.tasks[0].targety,
                                targetItem: itemName,
                                itemsNeeded: [],
                                itemsGot: [],
                                toolsNeeded: [],
                                toolsGot: [],
                                progress: 0,
                                ticksToComplete: 1,
                                skillsNeeded: []
                            };
                            game.tasks.push(newTask);
                            w.tasks.unshift(newTask);
                            return false;
                        }
                    }
                }
            }
            return true;
        },
        deleteTask: ()=>{
            // Deletes the worker's current task, usually when it's complete

            // Remove from building (if it exists)
            let slot = w.tasks[0].building.activeTasks.findIndex(t=>t===w.tasks[0]);
            if(slot!=-1) w.tasks[0].building.activeTasks.splice(slot, 1);  // some tasks won't be assigned to structures - that's fine

            // remove from game
            slot = game.tasks.findIndex(t=>t===w.tasks[0]);
            if(slot===-1) {
                console.log('Task deleted that was not in game.tasks');
            }else{
                game.tasks.splice(slot, 1);
            }

            // remove from worker. We already know it's the first task
            w.tasks.splice(0, 1);
        },
        move: callback => {
            // Handles worker movement. When they reach their destination, the callback function will be called. This is a private worker class function
            // Returns true if the worker's location has changed, or false if not

            // Assertions
            // w.tasks[0].targetx & targety exist and is a valid point on the map

            // Have we reached our destination?
            if(w.x===w.tasks[0].targetx && w.y===w.tasks[0].targety) {
                callback();
                return false;
            }

            // Are we done waiting on this tile?
            if(w.moveCounter>0) {
                w.moveCounter--;
                return false;
            }

            // We are ready to move to the next tile
            if(w.tasks[0].targetx !== w.x) {
                let d = (w.tasks[0].targetx-w.x > 0)? 1: -1;
                w.x += d;
            }
            if(w.tasks[0].targety !== w.y) {
                let d = (w.tasks[0].targety - w.y > 0)? 1: -1;
                w.y += d;
            }

            let diffx = 0, diffy = 0;
            if(w.tasks[0].targetx !== w.x) {
                diffx = (w.tasks[0].targetx - w.x > 0)? 1: -1;
            }
            if(w.tasks[0].targety !== w.y) {
                diffy = (w.tasks[0].targety - w.y > 0)? 1: -1;
            }
            let distance = (diffx===0 || diffy===0)? 1 : 1.4;  // diagonals cost a little more time

            let tile = game.tiles.find(e=>e.x===w.x && e.y===w.y);
            if(typeof(tile)==='undefined') {
                console.log(`Error in worker->move: ${w.name} moved to [${w.x},${w.y}] that doesn't exist. Target:[${w.targetx},${w.targety}]`);
                w.moveCounter = 1;
                return true;
            }

            let landType = (tile.newlandtype===-1)? tile.landtype : tile.newlandtype;
            let tileType = minimapTiles.find(f=>f.id===landType);
            if(typeof(tileType)==='undefined') {
                w.moveCounter = 50;
                console.log(`Error: ${w.name} is on a tile not in minimapTiles. Base tile=${tile.landtype}, new tile=${tile.newlandtype}`);
            }else{
                w.moveCounter = tileType.walkLag * distance;
            }
            return true;
        }
    };
    game.workers.push(w);
}