/*  Game.js
    Provides the data structure that manages the operations of the game
    For the game Settlers & Warlords
*/

import { LeanTo } from "./blocks/LeanTo.jsx";

export const game = {
    blocks: [], // All functioning buildings
    tiles: [], // All map tiles of the local map
    timerLoop: null, // This gets updated to a timer handle when the game starts
    updateWorkers: null, // This gets assigned to the React's setWorkers
    updateLocalMap: null, // This comes from React's setLocalMap
    workers: [], // List of all local workers (and their stats)

    getNextBlockId: () => {
        // Returns the next available block ID, based on existing building IDs
        if (game.blocks.length === 0) return 1;
        return game.blocks.reduce((ca, bl) => Math.max(bl.id, ca), 1) + 1;
    },

    blockTypes: [{ name: "Lean-To", img: "leanto.png", create: LeanTo }],
    update: () => {
        // First, allow workers to do work, for whatever building they're doing work at
        let hasWorkerUpdates = false;
        game.workers.forEach((wk) => {
            if (wk.currentTask === "") {
                // This worker has no work right now. Let's see if we can help out someone else doing work (that's easier than finding work)
                let leader = game.workers.find((ele) => {
                    if (ele.id === wk.id) return false; // oh - this is the same worker. Skip this one
                    if (ele.currentTask === "") return false; // This worker also has no work
                    // First, find the building this other worker is working at
                    let building = game.blocks.find((b) => b.id === ele.buildingId);
                    if (typeof building === undefined) {
                        console.log("Error in game.update->update workers: Failed to find building id=" + ele.buildingId);
                        return false;
                    }
                    return building.openTasks().length > 0; // aka there is at least 1 task that can be done here
                });
                if (typeof leader !== "undefined") {
                    // So, we can aid in the work that this worker is doing. Let's do that now
                    let building = game.blocks.find((b) => b.id === leader.buildingId); // We already know this exists - skip error checking
                    let task = building.assignTask(wk);
                    console.log("I'm gonna help the other guy");
                    // That should be it, for now
                } else {
                    // No worker was found that has a task this worker can assist with. Let's check the other buildings to find something
                    // we can work on
                    let building = game.blocks.find((b) => b.openTasks().length > 0);
                    if (typeof building !== "undefined") {
                        console.log("We got work!");
                        building.assignTask(wk);
                    }
                }
            } else {
                // We currently have work set up for this. First, determine what we need to do next
                switch (wk.currentTask) {
                    case "construct": // We need to be at the site to build this. Move to the building's location
                        let building = game.blocks.find((b) => b.id === wk.buildingId);
                        if (!worker_atLocation(wk, building.x, building.y)) {
                            worker_stepToward(wk, building.x, building.y);
                            hasWorkerUpdates = true;
                        } else {
                            let result = building.doWork(wk.currentTask);
                            if (result === "done") {
                                console.log("The work is done here...");
                                wk.buildingId = 0;
                                wk.currentTask = "";
                            }
                        }
                        break;
                }
            }
        });
        if (hasWorkerUpdates) {
            game.updateWorkers(game.workers);
            game.updateLocalMap([...game.tiles]);
        }

        game.blocks.forEach((block) => {
            block.update();
        });
    },
};

function worker_atLocation(worker, targetX, targetY) {
    // A simple function that returns true if this worker is at the correct location
    return worker.x === targetX && worker.y === targetY;
}

function worker_stepToward(worker, targetX, targetY) {
    // Updates a given worker's location to step closer to the place they need to go

    // Check that the Y coordinate is lined up
    if (worker.y > targetY) {
        worker.y--;
    } else if (worker.y < targetY) {
        worker.y++;
    } else if (worker.x > targetX) {
        worker.x--;
    } else if (worker.x < targetX) {
        worker.x++;
    }
}
