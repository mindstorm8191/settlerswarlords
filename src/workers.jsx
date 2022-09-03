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
        addTask: (building, taskName,assignStyle,amount) => {
            // Gives a new task to a worker
            // No return value. The building and worker will be modified.

            // Assertions
            // building has the correct task associated to it
            // assignStyle is one of: assign, first, queue, or reassign

            w.status = 'working';
            
            let task = building.tasks.find(t=>(t.name===taskName));
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
                ...task.getTask(w.x,w.y)
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
            // And... that should be it, actually
        },
        work: ()=>{
            // Has the worker do another tick of the current task, if one is assigned
            // Returns true if any workers have updated their position (thus needing the map to be redrawn), or false if not

            if(w.tasks.length===0) return;  // We later plan on having them wander around - or even help other workers. But for now they'll just sit idle

            return w.move(()=>{
                switch(w.tasks[0].subtask) {
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
                        let p = w.tasks[0].task.onProgress;
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
                            let slot = workertile.items.findIndex(i=>i.name===w.tasks[0].targetitem);
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
                console.log(`Error in worker->move: ${w.name} moved to [${w.x},${w.y}] that doesn't exist`);
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


