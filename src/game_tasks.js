/*  game_tasks.jsx
    Holds the task functions for the game object
    For the game Settlers & Warlords
*/

import { game } from "./game.jsx";

export const gameTasks = {
    tasks: [],
    lastTaskId: 0, // All tasks also need IDs
    getNextTaskId: () => {
        game.lastTaskId++;
        return game.lastTaskId;
    },

    createTask: (building, task, quantity = 1) => {
        // Generates a new task, assigning it to the game object and to the respective building.
        //  building - what building this task is associated with
        //  task - class details to generate a task instance from
        //  quantity - how many of this item to make. Not all tasks use a quantity amount, it will be ignored for those tasks

        // All tasks start without a worker assigned to it; it will be assigned later
        //console.log(task);

        // Task location depends on settings in the task
        let targetx = null;
        let targety = null;
        if (task.workLocation === "structure") {
            targetx = building.x;
            targety = building.y;
        }

        let newtask = {
            id: game.getNextTaskId(),
            building: building,
            task: task,
            status: "unassigned",
            taskType: task.taskType,
            worker: null,
            targetx: targetx,
            targety: targety,
            targetItem: "", // this is really only used in itemMove tasks, but is here so that it doesn't get missed
            //itemsNeeded: [] - this data will be pulled as static information from the root task object. No need to keep it here
            recipeChoices: [], // This determines which option of each portion of the recipe is to be used. This is set shortly after
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

    createItemMoveTask: (item, sourcex, sourcey, destx, desty, codeSource) => {
        // Creates a task to move an item to a new location. This task isn't associated to any building, but has a specific item to locate
        // on a specific tile.
        // item - item instance to be moved
        // sourcex, sourcey - where to pick the target item up from
        // destx, desty - where to place the item when finished
        // codeSource - where this code was called from. Used for debugging
        // Returns the newly made task so that it can be assigned to the right worker

        if (typeof item === "string")
            console.log("Error in game.createItemMoveTask - you need to pass the item, not the name. Called from " + codeSource);
        if (typeof item === "undefined")
            console.log("Error in game.createItemMoveTask: got target item of undefined. called from " + codeSource);

        let newtask = {
            id: game.getNextTaskId(),
            building: null,
            task: null,
            worker: null,
            status: "unassigned",
            taskType: "pickupItem", // This will be set to putdownItem once an item has been picked up
            targetx: sourcex,
            targety: sourcey,
            targetItem: item,
            recipeChoices: [],
            quantity: 1,
            itemsTagged: [],
            hasAllItems: false,
            progress: 0,
            nextx: destx,
            nexty: desty,
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
        //console.log('This task has '+ task.itemsTagged.length +' items to de-tag');
        for (let i = 0; i < task.itemsTagged.length; i++) {
            if (task.itemsTagged[i] !== null) {
                if (task.itemsTagged[i].inTask === task.id) {
                    task.itemsTagged[i].inTask = 0;
                } else {
                    console.log("Item has tag " + task.itemsTagged[i].inTask + " for task id=" + task.id);
                }
                //console.log('Clear item tag:', task.itemsTagged[i]);
            }
        }

        // Remove the task from the building, if there's a building associated to it
        let slot;
        let buildingHold = task.building;
        if (task.building !== null) {
            // Remember, buildings only hold the ID of a task, not the task itself
            slot = task.building.activeTasks.findIndex((t) => t === task.id);
            if (slot !== -1) task.building.activeTasks.splice(slot, 1);
        }

        if (typeof task.worker === "undefined") {
            console.log("Error in game.deleteTask: task.worker is not defined");
        }

        // Remove the task from the worker it's assigned to
        if (task.worker !== null) {
            slot = task.worker.tasks.findIndex((t) => t.id === task.id);
            if (slot !== -1) {
                task.worker.tasks.splice(slot, 1);
            } else {
                console.log("Did not find task with id=" + task.id + " with a worker. Trying all workers...");
                let tslot = 0;
                let newworker = game.workers.find((w) => {
                    let slot = w.tasks.findIndex((ta) => ta.id === task.id);
                    if (slot === -1) return false;
                    tslot = slot;
                    return true;
                });
                if (typeof newworker === "undefined") {
                    console.log("Could not find any worker with this task. Moving on...");
                } else {
                    newworker.tasks.splice(tslot, 1);
                }
            }
        } else {
            console.log("Task id=" + task.id + " has no worker assigned");
        }

        // Remove the task from the game
        slot = game.tasks.findIndex((t) => t === task);
        if (slot !== -1) game.tasks.splice(slot, 1);

        // If the building for this task is currently selected, we need to make the building update its display
        if (buildingHold != null) {
            buildingHold.update();
        }

        // That should take care of it...
    },
};
