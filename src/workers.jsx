/*  workers.jsx
    Manages workers and all the various tasks associated with them
    For the game Settlers & Warlords
*/

import {game} from "./game.jsx";

let lastWorkerId = 0;

export function createNewWorker(name,x,y) {
    // Creates a new worker, with all the proper functions tied to them. The new worker will be automatically attached to the game's workers list

    lastWorkerId++;
    let w = {
        name:name,
        id: lastWorkerId,
        x:x,
        y:y,
        moveCounter:0, // counter influencing movement. The game will Tick 20 times a second, but workers will take longer to travel each square of the map
        tasks:[],    // list of tasks this worker is completing. The first task is always what they are currently working on
        carrying:[],  // list of items this worker is carrying. Some items will enable workers to carry more
        clearTask: ()=>{
            // Clears the currently assigned task of this worker
        }
    };
    game.workers.push(w);
    return w;
}