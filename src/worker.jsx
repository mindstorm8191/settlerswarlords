/*  worker.jsx
    Provides a worker object, that handles all worker operations
    For the game Settlers & Warlords
*/

import { DanCommon } from './libs/DanCommon.js';

import { game } from "./game.jsx";
import { minimapTiles } from './minimapTiles.js';
import { itemStats } from "./itemstats.js";

export function createWorker(pack) {
    // Creates a new worker, based on data recevied from the server
    //  pack - worker data received from the server. It should contain the following
    //      name - A randomly selcted name given to this worker
    //      id - An ID, unique to all workers in the world
    //      x - X coordinate
    //      y - Y coordinate
    //      status - current status of this worker. Currently only 'idle', this will change to 'working' in the future
    //      moveCounter - how far along they are in moving between tiles
    //      tasks - A list of task IDs this worker is assigned to
    //      carrying - A list of items carried by this worker
    //      walkPath - A string of numbers representing this worker's path to their next destination
    // No return value. This worker will be added to the Game object

    console.log(pack.carrying);

    let w = {
        name: pack.name,
        id: pack.id,
        x: pack.x,
        y: pack.y,
        status: pack.status,
        moveCounter: pack.moveCounter,
        tasks: pack.tasks,      // This needs to be converted to the actual task instance, but tasks are loaded after workers; it will be converted then
        carrying: pack.carrying,
        walkPath: pack.walkPath,
        foodTimer: typeof(pack.foodTimer)==='undefined'?20*60*3:pack.foodTimer,

        tick: () => {
            // Handles worker actions every game tick
            // Returns true if the worker location was updated, or false if not. (This can be OR'd with other worker tick results to see if any
            // have moved)

            // See if this worker needs to eat anything now
            if(game.mapTick>w.foodTimer) {
                if(!w.tasks.some(t=>t.task!==null && t.task.name==='Eat Food')) {
                    //console.log(w.name +' is hungry!');
                    let structure = game.structures.find(s=>s.name==='Forage Post');
                    if(typeof(structure)==='undefined') {
                        console.log(w.name +' is hungry, theres no forage post!');
                    }else{
                        let taskType = structure.tasks.find(t=>t.name==='Eat Food');
                        //console.log(w.name +' creates task '+ taskType.name);
                        let task = game.createTask(structure, taskType, 1, 'worker.tick()->go eat');
                        //task.worker = w;
                        w.tasks.unshift(task);
                        w.tasks[0].worker = w;
                    }
                }
            }

            // See if this worker has any current work
            if(w.tasks.length===0) {
                let foundTask = game.tasks.find(task=>task.worker===null && task.status==='unassigned');
                if(typeof(foundTask)==='undefined') {
                    w.status = 'idle';
                    return false;
                }

                // Assign this task to this worker
                foundTask.worker = w;
                w.tasks.push(foundTask);
                w.walkPath = '';
                //console.log(w.name +' starts task '+ (typeof(w.tasks[0].task)==='undefined' || w.tasks[0].task===null)?w.tasks[0].taskType:w.tasks[0].task.name);
                game.clearOldTasks();
            }

            // First thing we should do is to determine where this task should be performed at. Some task locations are based on where
            // a fixed-position item is located
            let itemNameToUse = '';
            if(w.tasks[0].targetx===null) {
                if(typeof(w.tasks[0].task.workLocation)==='undefined') {
                    console.log('Error: task type does not have workLocation defined. Task name='+ w.tasks[0].task.name);
                }
                // Some tasks have customized locations to pick
                if(w.tasks[0].task.workLocation==='custom') {
                    let result = w.tasks[0].task.pickLocation(w);
                    w.tasks[0].targetx = result[0];
                    w.tasks[0].targety = result[1];
                }else{

                    // Find the item with a flag of workSite, and that such a value is set to true
                    let targetSet = w.tasks[0].task.itemsNeeded.find(list=>{
                        if(typeof(list.workSite)==='undefined') return false;
                        return list.workSite;
                    });
                    if(typeof(targetSet)==='undefined') {  // Making sure I coded the tasks correctly
                        console.log('Error in worker.jsx->tick(): No required item marked as workSite. Task cannot be completed');
                        // For this, we should show a proper user-error message: That task is broken (it has no job site). Try something else
                        let taskCount = w.tasks.length;
                        game.deleteTask(w.tasks[0]);
                        if(w.tasks.length===taskCount) {
                            console.log('Error: above deleted task still assigned to worker. Dropping manually...');
                            w.tasks.splice(0,1);
                        }
                        return;
                    }

                    // Next; find the (pathwise) closest route to a suitable object. While we select a valid tile, also pick up the target item(s)
                    //let itemNameToUse = '';
                    let outcome = game.pathTo(w.x, w.y, tile=>{
                        if((w.tasks[0].taskType==='gatherfood' || w.tasks[0].taskType==='gatheritems') &&
                            tile.x===w.tasks[0].building.x &&
                            tile.y===w.tasks[0].building.y) return false;

                        // This would be much simpler if we didn't need to hold onto the item we locate
                        for(let r=0; r<targetSet.options.length; r++) {
                            let total = tile.items.filter(i=>{
                                if(i.inTask!==0) return false;
                                return targetSet.options[r].name === i.name;
                            }).length;
                            //console.log('Found '+ total +' of '+ targetSet.options[r].name +' at ['+ tile.x +','+ tile.y +']');
                            if(typeof(targetSet.options[r].qty)==='undefined') {
                                console.log("Error in worker.tick()->find work location: task type's options array missing quantities");
                            }
                            if(total >= targetSet.options[r].qty) {
                                itemNameToUse = targetSet.options[r].name;
                                return true;
                            } 
                        }
                        return false;
                    });
                    if(outcome.result==='fail') {
                        // There isn't any of these items on the map anywhere. Pick one and look for a building that can craft it.
                        let sR = w.findCraftingStructure(targetSet.options.map(o=>o.name));
                        if(sR.result==='fail') {
                            // We searched everything, nothing can craft any of these items. Show a proper error message... for now show a console log entry
                            console.log('Error: there are no buildings that can craft any of '+ targetSet.options.map(o=>o.name).join(', ') +'. Task cancelled');
                            let taskCount = w.tasks.length;
                            game.deleteTask(w.tasks[0]);
                            if(w.tasks.length===taskCount) {
                                console.log('Error: above deleted task still assigned to worker. Dropping manually...');
                                w.tasks.splice(0,1);
                            }
                            return;
                        }
                        // Generate this task, and then assign it (as first) to this worker
                        let newTask = game.createTask(sR.structure, sR.structure.tasks[sR.taskSlot], 1, 'worker.tick()->pick location->craft fixed item');
                        w.tasks.unshift(newTask);
                        return;
                        // We will leave our current task still without a target location, but that should be remedied once this task is resumed
                    }
                    // Mark this item as part of our task, and set the x & y coordinates of this task. We don't need the path to get here
                    //w.tasks[0].itemsTagged.push(outcome.tile.items.find(i=>i.name===foundItem));
                    // We can't actually add this item at this time, as it will mess with the recipe selection below...
                    // but we need to add this item now, or else we won't know what to look out for later.
                    // We will have to handle this one as a special case

                    w.tasks[0].targetx = outcome.tile.x;
                    w.tasks[0].targety = outcome.tile.y;
                    //console.log('Found target for '+ w.tasks[0].task.name +' at '+ outcome.tile.x +','+ outcome.tile.y);
                }
            }

            /////////////////////////////////////////////////////////////////
            if(typeof(w.tasks[0].task)==='undefined') {
                console.log('Found task id='+ w.tasks[0].id +' with no root:', w.tasks[0]);
                w.tasks[0].task = null;
            }

            // Next, we need to determine the exact recipe we will use. My intention is to allow multiple ways to produce each item, and the
            // workers wil select the best recipe to use
            if(w.tasks[0].task !== null && w.tasks[0].task.itemsNeeded.length>0) {
                // The first thing we should do is determine what materials we will use for this. Once decided, we will use that recipe to
                // complete the task.
                // If there are multiple possible recipes, we will choose the one that requires the least amount of work (or time, or energy,
                // I don't know yet. We'll go with the first one always, for now).
                // If there are no possible recipes at this time, we will still choose the one that requires the least amount of work, based
                // on the existing stocks and what each one requires

                // ToDo: make sure to set & clear the task tag with each item found during initial searches

                if(w.tasks[0].recipeChoices.length===0 || w.tasks[0].recipeChoices.some(u=>u===null)) {
                    // To handle this, we will generate a new structure as we go
                    let optionChoices = [];
                    // groupId - which of the recipe parts this is for
                    // optionId - which choice of that recipe this is for
                    // hasAllItems - true if all items can be accounted for
                    // items - another array:
                    //      item - link to the item we're after
                    //      distance - how far away this item is. We will use this to determine which group of items we decide to use
                    //      x & y - coordinates for this item
                    
                    // instead of running through each needed group, and then making a selection based on the group, we need to make a selection
                    // right after our group is finished being made
                    for(let group=0; group < w.tasks[0].task.itemsNeeded.length; group++) {
                        // First, see if this slot has already been completed
                        if(typeof(w.tasks[0].recipeChoices[group])!=='number') {
                            // See if we have already solved this when looking for a work location (above)
                            if(typeof(w.tasks[0].task.itemsNeeded[group].workSite)!=='undefined' && w.tasks[0].task.itemsNeeded[group].workSite===true) {
                                // All we need to hold on to is the slot ID
                                if(itemNameToUse!=='') {
                                    w.tasks[0].recipeChoices[group] = w.tasks[0].task.itemsNeeded[group].options.findIndex(r=>r.name===itemNameToUse);
                                    //console.log('Slot '+ group +' already tagged');
                                }else{
                                    //console.log('Seeking new target item for slot '+ group +' - was the target item deleted?');
                                    let tile = game.tiles.find(t=>t.x===w.tasks[0].targetx && t.y===w.tasks[0].targety);
                                    let items = tile.items.map(i=>i.name);
                                    w.tasks[0].recipeChoices[group] = w.tasks[0].task.itemsNeeded[group].options.findIndex(r=>items.includes(r.name));
                                }
                            }else{
                                optionChoices = [];
                                for(let choice=0; choice<w.tasks[0].task.itemsNeeded[group].options.length; choice++) {
                                    let targetItemName = w.tasks[0].task.itemsNeeded[group].options[choice].name;
                                    //console.log('Working slot '+ group +', item '+ targetItemName);

                                    // Go ahead and build a working group
                                    let build = { groupId: group, optionId:choice, hasAllItems:false, items:[]};
                                    let working = true;
                                    while(working) { // we need to loop until we have the number of items needed
                                        let foundItem = null;
                                        let searchOutcome = game.pathTo(w.tasks[0].targetx, w.tasks[0].targety, tile => {
                                            let match = tile.items.findIndex(b=>b.inTask===0 && b.name===targetItemName);
                                            if(match===-1) return false;
                                            foundItem = tile.items[match];
                                            return true;
                                        });
                                        if(searchOutcome.result==='fail') {
                                            // We didn't find this item in any tile
                                            working = false;
                                            //console.log('Could not find any more of item '+ targetItemName);
                                        }else{
                                            //console.log('Found '+ targetItemName +' at relative location ['+ (searchOutcome.tile.x-w.tasks[0].targetx) +','+ (searchOutcome.tile.y-w.tasks[0].targety) +']');
                                            build.items.push({
                                                item:foundItem,
                                                distance:searchOutcome.path.length,
                                                x:searchOutcome.tile.x,
                                                y:searchOutcome.tile.y
                                            });
                                            foundItem.inTask = w.tasks[0].id;
                                            // We are setting the item's inTask value, but not adding the item to the task's itemsTagged list
                                            if(build.items.length>=w.tasks[0].task.itemsNeeded[group].options[choice].qty) {
                                                // We got all we need here - we can move on
                                                build.hasAllItems = true;
                                                working = false;
                                            }
                                        }
                                    }
                                    optionChoices.push(build);
                                }
                                // With our list complete, we can decide what items will be used in the recipe
                                let valid = optionChoices.find(ch=>ch.hasAllItems);
                                if(typeof(valid)==='undefined') {
                                    // No current options are complete. Instead, locate the one with the highest percent of ready parts
                                    valid = optionChoices.reduce((carry,working) => {
                                        if(carry===null) return working;  // we had nothing to start with, so start with this one
                                        let cRatio = parseFloat(carry.items.length) / parseFloat(w.tasks[0].itemsNeeded[carry.group].options[carry.choice].qty);
                                        let wRatio = parseFloat(working.items.length) / parseFloat(w.tasks[0].itemsNeeded[working.group].options[working.choice].qty);
                                        if(cRatio > wRatio) return carry;
                                        return working;
                                    }, null);
                                }

                                // Before dropping this list, remove the inTask value from all items tagged this way. Including any items
                                // we use for our selected recipe - this step is ONLY to select the recipe
                                for(let i=0; i<optionChoices.length; i++) {
                                    for(let j=0; j<optionChoices[i].items.length; j++) {
                                        optionChoices[i].items[j].item.inTask = 0;
                                    }
                                }
                            
                                w.tasks[0].recipeChoices[group] = valid.optionId;
                                //console.log('Chose slot '+ valid.optionId +' out of ['+ w.tasks[0].task.itemsNeeded[group].options.map(u=>u.name).join(',') +']');
                            }
                        }
                    }
                }

                // Currently, we know where to perform the task, and also what recipe to use. We still need to tag items to be used
                // Determine if all parts needed are at the job site. If any is not on site, we will generate an itemMove task to
                // get it there. If no items exist, we will generate a task to create one
                for(let i=0; i<w.tasks[0].task.itemsNeeded.length; i++) {
                    // Here, the item we need to locate is w.tasks[0].task.itemsNeeded[i].choices[w.tasks[0].recipeChoices[i]].name
                    let choice = w.tasks[0].task.itemsNeeded[i].options[w.tasks[0].recipeChoices[i]];
                    // When a tool breaks, this code will trigger needing another one
                    let onHand = w.tasks[0].itemsTagged.filter(item=>{
                        return item.name === choice.name;
                    }).length;
                    if(onHand < choice.qty) {
                        //console.log('Need more '+ choice.name +' (have '+ onHand +', need '+ choice.qty +')');
                        // We don't have enough tagged items. Before making a task to produce more, see if there are more we can find.
                        // This will count as this worker's 'turn' / tick
                        let slot = -1;
                        let outcome = game.pathTo(w.tasks[0].targetx, w.tasks[0].targety, tile=>{
                            let s = tile.items.findIndex(i=>{
                                //if(i.name===choice.name && choice.name==='Flint Knife') {
                                //    console.log('Got Flint Knife with inTask of '+ i.inTask +' at relative ['+ (tile.x-w.tasks[0].targetx) +','+ (tile.y-w.tasks[0].targety) +']');
                                //}
                                return i.inTask===0 && i.name===choice.name;
                            });
                            if(s===-1) return false;
                            slot = s;
                            return true;
                        });
                        if(outcome.result==='success') {
                            // Wait - we found a hit! Tag this item. This will still result in the end of our 'turn'
                            //console.log('Found '+ choice.name +' at relative ['+ (outcome.tile.x-w.x) +','+ (outcome.tile.y-w.y) +'] after '+ outcome.tilesScanned +' tiles');
                            w.tasks[0].itemsTagged.push(outcome.tile.items[slot]);
                            outcome.tile.items[slot].inTask = w.tasks[0].id;
                            return;
                        }
                        // Otherwise, we will need to craft this item now
                        outcome = w.findCraftingStructure([choice.name]);
                        if(outcome.result==='fail') {
                            // We couldn't find a suitable structure. We will have to abandon this task
                            console.log('Error: there are no buildings that can craft '+ choice.name +'. Task cancelled');
                            let taskCount = w.tasks.length;
                            game.deleteTask(w.tasks[0]);
                            if(w.tasks.length===taskCount) {
                                console.log('Error: above deleted task still assigned to worker. Dropping manually...');
                                w.tasks.splice(0,1);
                            }
                            return;
                        }
                        let newTask = game.createTask(outcome.structure, outcome.structure.tasks[outcome.taskSlot], 1, 'worker.tick()->gather items->craft missing items');;
                        w.tasks.unshift(newTask);
                        newTask.worker = w;
                        return;
                    }
                }

                // Ensure all our items at the correct location. As we run through this, create a list of itemMove tasks. Once finished,
                // we will setup to complete all these move tasks first.
                let newTaskList = [];
                let tile = game.tiles.find(t=>t.x===w.tasks[0].targetx && t.y===w.tasks[0].targety);
                for(let i=0; i<w.tasks[0].itemsTagged.length; i++) {
                    //console.log('Search for item at job site:', w.tasks[0].itemsTagged[i]);
                    if(tile.items.findIndex(j=>j===w.tasks[0].itemsTagged[i]) === -1) {
                        // This item is not at the correct location.
                        // Before we can generate a move task for it, we first need to determine where it is located.
                        // I wanted to do an object/array to help locate these faster, but I can't guarantee that an item will remain
                        // where it was originally listed. We're better off searching for it here & now
                        let outcome = game.pathTo(w.tasks[0].targetx, w.tasks[0].targety, tile=>tile.items.some(j=>j===w.tasks[0].itemsTagged[i]));
                        if(outcome.result==='fail') {
                            // oh no, we didn't find the item. Remove this from the tagged items. We will need to add another to replace it
                            // First we need the name, though
                            console.log('Error: could not find path to item name='+ w.tasks[0].itemsTagged[i].name +' for '+ w.name +'. Searching for replacement');
                            let itemName = w.tasks[0].itemsTagged[i].name;
                            w.tasks[0].itemsTagged.splice(i,1);
                            let item = null;
                            outcome = game.pathTo(w.x, w.y, tile=>{
                                return tile.items.some(i=>{
                                    if(i.inTask!==0) return false;
                                    if(i.name!==itemName) return false;
                                    item = i;
                                    i.inTask = w.tasks[0].id;
                                    return true;
                                });
                            });
                            if(outcome.result==='fail') {
                                // We still couldn't find any matching items. This task is no longer completable as it is
                                console.log('Error: Could not find any item to replace '+ itemName +'. Task needs to be cancelled');
                                let taskCount = w.tasks.length;
                                game.deleteTask(w.tasks[0]);
                                if(w.tasks.length===taskCount) {
                                    console.log('Error: above deleted task still assigned to worker. Dropping manually...');
                                    w.tasks.splice(0,1);
                                }
                                return;
                            }else{
                                // While we have this path data, go ahead and create a task to move this to our location, so we don't have to
                                // search for it again later
                                w.tasks[0].itemsTagged[i] = item;
                                let newTask = game.createItemMoveTask(item, outcome.tile.x, outcome.tile.y, w.tasks[0].targetx, w.tasks[0].targety, 'worker.jsx->check item locations');
                                w.tasks.unshift(newTask);
                                return;
                            }
                        }else{
                            console.log('Found '+ w.tasks[0].itemsTagged[i].name +' at '+ outcome.tile.x +','+ outcome.tile.y);
                            w.tasks[0].itemsTagged[i].inTask = w.tasks[0].id;
                            // We found a valid task to this current item.
                            let newTask = game.createItemMoveTask(w.tasks[0].itemsTagged[i], outcome.tile.x, outcome.tile.y, w.tasks[0].targetx, w.tasks[0].targety);
                            newTaskList.push(newTask);
                            newTask.worker = w;
                        }
                    }
                    // If we found all items in the above list, we are ready to actually complete our task!
                }
                if(newTaskList.length>0) {
                    w.tasks = [...newTaskList, ...w.tasks];
                    console.log(w.tasks);
                    return;
                }
            }

            // Now manage worker movement
            return w.move(()=>{
                switch(w.tasks[0].taskType) {
                    case 'construct': case 'craft':
                        // The worker only needs to build something here. Have them make progress until it is complete
                        w.tasks[0].progress++;

                        // Allow tools to wear out and break. We have the recipeChoices array, we need to drain the endurance of any
                        // items marked as tools
                        let toolTile = game.tiles.find(t=>t.x===w.x && t.y===w.y);
                        for(let u=0; u<w.tasks[0].task.itemsNeeded.length; u++) {
                            if(w.tasks[0].task.itemsNeeded[u].role!=='tool') continue;
                            let choice = w.tasks[0].recipeChoices[u];
                            //console.log(choice);
                            let toolName = w.tasks[0].task.itemsNeeded[u].options[w.tasks[0].recipeChoices[u]].name;
                            let slot = toolTile.items.findIndex(i=>i.name===toolName && i.inTask===w.tasks[0].id);
                            // I don't know what we'll do when we need more than one of the same tool for a job!
                            toolTile.items[slot].endurance--;
                            if(toolTile.items[slot].endurance<=0) {
                                // This tool has broken. It needs to be deleted now
                                // Find the item in the itemsTagged list, and remove it
                                let tagSlot = w.tasks[0].itemsTagged.findIndex(y=>y===toolTile.items[slot]);
                                if(tagSlot===-1) {
                                    console.log('Error on tool break: target tool not found in task.itemsTagged. Finding another way...');
                                    tagSlot = w.tasks[0].itemsTagged.findIndex(y=>y.name===toolTile.items[slot].name && y.inTask===toolTile.items[slot].inTask);
                                    if(tagSlot===-1) {
                                        console.log('Error on tool break: still didnt find tool. Trying by name only');
                                        tagSlot = w.tasks[0].itemsTagged.findIndex(y=>y.name===toolTile.items[slot].name);
                                        if(tagSlot===-1) {
                                            console.log('Error on tool break: still couldnt find tool by name only. Ignoring');
                                        }else{
                                            w.tasks[0].itemsTagged.splice(tagSlot,1);
                                        }
                                    }else{
                                        w.tasks[0].itemsTagged.splice(tagSlot,1);
                                    }
                                }else{
                                    w.tasks[0].itemsTagged.splice(tagSlot,1);
                                }
                                toolTile.items.splice(slot,1);
                            }
                        }

                        if(w.tasks[0].progress>=w.tasks[0].task.buildTime) {
                            // This task is now complete. Call the onComplete function
                            let lastId = w.tasks[0].id;
                            w.tasks[0].task.onComplete(w);
                            if(w.tasks[0].id !== lastId) return; // This worker got something else assigned. Go ahead and exit this sub-function

                            // We might need to craft more than one item. If so, start that process now
                            if(w.tasks[0].quantity>1) {
                                w.tasks[0].quantity--;
                                w.tasks[0].progress = 0;
                                if(w.tasks[0].workLocation==='atItem') {
                                    w.tasks[0].targetx = null;
                                    w.tasks[0].targety = null;
                                }
                                w.tasks[0].recipeChoices = [];
                                // We need to manually clear all items, so they can be (properly) tagged again
                                for(let i=0; i<w.tasks[0].itemsTagged.length; i++) {
                                    w.tasks[0].itemsTagged[i].inTask = 0;
                                }
                                w.tasks[0].itemsTagged = [];
                                console.log('Attempted task reset for next crafting of quantity');
                            }else{
                                let taskCount = w.tasks.length;
                                game.deleteTask(w.tasks[0]);
                                if(w.tasks.length===taskCount) {
                                    console.log('Error: above deleted task still assigned to worker. Dropping manually...');
                                    w.tasks.splice(0,1);
                                }
                            }
                        }else{
                            if(typeof(w.tasks[0].task.onProgress)==='undefined') {
                                // This has no onProgress function. Call the building's update command instead
                                if(typeof(w.tasks[0].building.update)==='undefined') {
                                    console.log('Error: building '+ w.tasks[0].building.name +' missing update function, needed for the blinker');
                                }else{
                                    w.tasks[0].building.update(w.tasks[0].progress);
                                } 
                            }else{
                                w.tasks[0].task.onProgress(w.tasks[0].progress);
                            }
                        }
                    break;
                    case 'pickupItem':
                        // Here we only need to pick up an item. The task should have a nextX and nextY, that we can set the targetX & targetY to
                        if(typeof(w.tasks[0].targetItem)==='undefined') {
                            console.log('Error: got pickupItem task but task.targetItem is undefined. Cancelling task');
                            game.deleteTask(w.tasks[0]);
                            return;
                        }
                        let tile = game.tiles.find(t=>t.x===w.x && t.y===w.y);
                        let slot = tile.items.findIndex(i=>i===w.tasks[0].targetItem);
                        if(slot===-1) {
                            console.log('Error: could not find item='+ w.tasks[0].targetItem.name +' in tile. Cancelling task');
                            game.deleteTask(w.tasks[0]);
                            return;
                        }
                        w.carrying.push(tile.items[slot]);
                        tile.items.splice(slot,1);
                        tile.modified = true;

                        // Now that we have the item, update this task
                        w.tasks[0].targetx = w.tasks[0].nextx;
                        w.tasks[0].targety = w.tasks[0].nexty;
                        w.tasks[0].taskType = 'putdownItem';
                    break;
                    case 'putdownItem':
                        // Here we only need to put down the correct item the worker is carrying
                        let ptile = game.tiles.find(t=>t.x===w.x && t.y===w.y);
                        let pslot = w.carrying.findIndex(i=>i===w.tasks[0].targetItem);
                        if(pslot===-1) {
                            console.log('Error: could not find item='+ w.tasks[0].targetItem.name +' in worker');
                            game.deleteTask(w.tasks[0]);
                            return;
                        }
                        ptile.items.push(w.carrying[pslot]);
                        w.carrying.splice(pslot,1);
                        ptile.modified = true;
                        let taskCount = w.tasks.length;
                        game.deleteTask(w.tasks[0]);
                        if(w.tasks.length===taskCount) {
                            console.log('Error: above deleted task still assigned to worker. Dropping manually...');
                            w.tasks.splice(0,1);
                        }
                    break;
                    case 'gatherfood':
                        // This is a task type unique to the Forage Post
                        w.tasks[0].progress++;
                        
                        let mile = game.tiles.find(t=>t.x===w.x && t.y===w.y);
                        // The progress limit is based on which food item the worker is working on
                        let foodName = w.tasks[0].task.itemsNeeded[0].options[w.tasks[0].recipeChoices[0]].name;
                        let option = itemStats.find(f=>f.name===foodName);
                        if(typeof(option.harvestTime)!=='undefined' && w.tasks[0].progress<option.harvestTime) return;

                        // We will really be dealing with 2 food possibilities: one is direct food, and the other is food providers

                        // If this food item has a resultOutput, apply it to this tile while we're here
                        if(typeof(option.output)!=='undefined') {
                            // This item gets converted from one state to another after the harvest work is completed

                            // Start by finding & removing the item we're looking at
                            let slot = mile.items.findIndex(i=>i.name===foodName);
                            if(slot===-1) {
                                console.log('Error: could not find '+ foodName +' in tile. No other changes have been made');
                                return;
                            }
                            mile.items.splice(slot,1);
                            // With the rest of the items, we need to dump these items onto the tile
                            for(let y=0; y<option.output.length; y++) {
                                for(let x=0; x<option.output[y].qty; x++) {
                                    mile.items.push(game.createItem(option.output[y].name, 'item'));
                                }
                            }
                            // Since we are changing items here, we need to convert this into another target item
                            foodName = option.conversion;
                        }else{
                            //if(typeof(option.conversion)!=='undefined') {
                            if(option.role==='foodprovider') {
                                // We still need to convert one of the crops to a food item
                                mile.items.splice(mile.items.findIndex(i=>i.name===foodName), 1);
                                mile.items.push(game.createItem(option.conversion, 'item'));
                                foodName = option.conversion;
                            }
                        }
                        
                        // Some tiles have a reload tile-event that can be created
                        if(typeof(option.minReload)!=='undefined') {
                            let pickedTime = Math.floor(Math.random()*(option.maxReload-option.minReload) + option.minReload);
                            console.log('Tile update in '+ pickedTime +' ticks');
                            if(typeof(mile.events)==='undefined') mile.events = [];
                            mile.events.push({
                                action: 'regrow crops',
                                adding: foodName,
                                timepoint: game.maptick + pickedTime
                                // That's about all we can really handle here
                            });
                        }

                        // With our updates completed, we still need to take our food item to the Forage Post. Create a new itemMove task,
                        // and delete this existing task
                        //console.log(foodName);
                        let target = mile.items.find(i=>{
                            console.log(i.name);
                            return i.name===foodName;
                        });
                        //console.log(target);
                        let newTask = game.createItemMoveTask(target, w.x,w.y, w.tasks[0].building.x, w.tasks[0].building.y);
                        game.deleteTask(w.tasks[0]);
                        w.tasks.unshift(newTask);
                        w.tasks[0].worker = w;
                    break;
                    case 'gatheritems':
                        // This is similar to gatherfood, but is not exclusive to food-related items. There is no potential conversion of
                        // objects, either
                        w.tasks[0].progress++;
                        if(w.tasks[0].progress >=w.tasks[0].task.buildTime) {
                            let result = w.tasks[0].task.onComplete(w);
                            if(!result) return;
                            // Since this was successful, we need to create an item-move task, to take the target item to the target structure
                            let carryName = w.tasks[0].task.itemsNeeded[0].options[w.tasks[0].recipeChoices[0]].name;
                            let tile = game.tiles.find(t=>t.x===w.x && t.y===w.y);
                            let item = tile.items.find(i=>i.name===carryName);
                            let building = w.tasks[0].building;
                            if(w.tasks[0].quantity>1) {
                                w.tasks[0].quantity--;
                                w.tasks[0].progress = 0;
                                w.tasks[0].targetx = null;
                                w.tasks[0].targety = null;
                                w.tasks[0].recipeChoices = [];
                                // Manually clear all tagged items
                                for(let i=0; i<w.tasks[0].itemsTagged.length; i++) {
                                    w.tasks[0].itemsTagged[i].inTask = 0;
                                }
                                w.tasks[0].itemsTagged = [];
                                // This will allow us to start the process again, when the worker gets back to this task
                            }else{
                                game.deleteTask(w.tasks[0]);
                            }
                            let newTask = game.createItemMoveTask(item, w.x, w.y, building.x, building.y);
                            w.tasks.unshift(newTask);
                            newTask.worker = w;
                        }
                    break;
                    default:
                        console.log('Have task type of '+ w.tasks[0].taskType +' but have no case for it');
                }
            });
        },

        findCraftingStructure: itemsList => {
            // Locates a suitable crafting structure to craft one of the items in the items list
            //      itemsList - list of item names to pick a crafting operation from
            // Returns an object. If successful, will contain the building instance and slot of the task in the building's task array

            let taskSlot = -1;
            let taskBuilding = game.structures.find(st=>{
                let t = st.tasks.findIndex(u=>{
                    return DanCommon.doubleIncludes(itemsList, u.outputItems);
                });
                if(t!==-1) {
                    // We got a hit. Return this... but we're in a array.find function
                    taskSlot = t;
                    return true;
                }
                return false;
            });
            if(taskSlot!==-1) {
                return {
                    result: 'success',
                    structure: taskBuilding,
                    taskSlot: taskSlot
                };
            }
            return {result:'fail'};
        },

        move: callback => {
            // Handles worker movement
            //  callback - This is called when the worker is at the right position. This should return true only if the worker's position has
            //      changed
            // Returns true if this worker's location has changed, or false if not.

            if(w.tasks.length===0) return false;
            if(typeof(w.tasks[0].targetx)==='undefined' || w.tasks[0].targetx===null) {
                console.log('Error in worker.move(): '+ w.name +' is trying to move but targetx is not defined (or is null). Task: ', w.tasks[0]);
                return false;
            } 

            // Check if the worker is at the right location
            if(w.x===w.tasks[0].targetx && w.y===w.tasks[0].targety) {
                return callback();
            }

            // Check the worker's walkPath. If it is empty, generate a new path to the right location
            if(w.walkPath==='') {
                //w.createPath();
                let outcome = game.pathTo(w.x, w.y, tile=>tile.x===w.tasks[0].targetx && tile.y===w.tasks[0].targety);
                if(outcome.result==='fail') { 
                    console.log(`Something is wrong with this task. Could not find path from ${w.x},${w.y} to ${w.tasks[0].targetx},${w.tasks[0].targety}`);
                    let taskCount = w.tasks.length;
                    game.deleteTask(w.tasks[0]);
                    if(w.tasks.length===taskCount) {
                        console.log('Error: above deleted task still assigned to worker. Dropping manually...');
                        w.tasks.splice(0,1);
                    }
                    return;
                }
                // If successful, we're only really concerned about collecting the path to the target location
                w.walkPath = outcome.path;
                //console.log(w.name +' got path '+ w.walkPath);
            }

            // See if we have waited long enough on this current tile
            if(w.moveCounter>0) {
                w.moveCounter--;
                return false;
            }

            // We are ready to move somewhere. Determine where to move next
            let direction = parseInt(w.walkPath[0]);
            let dx = (direction % 3) -1;
            let dy = Math.floor(direction / 3.0) - 1;
            let diagonals = (dx===0 || dx===0) ? 1 : 1.4; // make diagonals need a little more time

            let tile = game.tiles.find(tile=>tile.x===w.x && tile.y===w.y);
            if(typeof(tile)==='undefined') {
                console.log(`Error in worker->move: ${w.name} moved to [${w.x},${w.y}] that doesn't exist.
                             Target:[${w.tasks[0].targetx},${w.tasks[0].targety}]`);
            }
            let tileType = minimapTiles.find(rile=>rile.id===tile.landtype);
            if(typeof(tileType)==='undefined') {
                w.moveCounter = 50;
                console.log(`Error: ${w.name} is on a tile not in the minimapTiles. Tile type=${tile.landtype}`);
            }else{
                w.moveCounter = tileType.walkLag * diagonals;
            }

            // Don't forget to update the worker's location! And trim the walk path
            w.x += dx;
            w.y += dy;
            w.walkPath = w.walkPath.substring(1);
            return true;
        }
    };

    game.workers.push(w);
    //return w;
}


