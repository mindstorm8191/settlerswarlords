/*  game.jsx
    Holds the core game object, controlling all functionality of game operations
    For the game Settlers & Warlords
*/

import React from "react";
import * as Three from "three";
import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber";
//import { useGLTF } from "@react-three/drei";
import { TextureLoader } from "three/src/loaders/TextureLoader";

import {serverURL, chunkSize } from "./App.js";
import {minimapTiles} from "./minimapTiles.js";

import LeanTo from "./structures/LeanTo.jsx";
import RockKnapper from "./structures/RockKnapper.jsx";

export const game = {
    runState: 0, // This gets set to 1 when the game is running
    tickTime: 0, // holds the last tick time
    timeout: null, // Holds the object received from setTimeout(), which is called in game.start()
    tiles: [],
    scrollXFunc: null, // Handle to the function that manages scrolling
    scrollX: 0,
    playerDirections: {
        up:0,down:0,left:0,right:0
    },
    playerUpdateFunc: null,
    playerPos: [],
    userName: '',
    workers: [],
    structures: [],
    structureTypes: [
        LeanTo(),
        RockKnapper()
    ],

    setup: (tileList, playerFunc, location, userName, workers) => {
        // Handles setting up various fields for the player's location to be updated
        game.playerUpdateFunc = playerFunc;
        game.playerPos = location;
        game.userName = userName;

        game.workers = workers.map(w => {
            w.spot = JSON.parse(w.spot);
            return w;
        });
        console.log('Set workers:', game.workers);
        game.tiles = tileList;
    },

    start: ()=>{
        // A public function to get the game started, making the game ticks happen at regular intervals
        game.tickTime = new Date().valueOf();
        game.runState = 1;
        game.timeout = setTimeout(function() {
            window.requestAnimationFrame(game.tick);
        }, 50);
    },

    tick: () => {
        // Handles updating the world. This should run about once every 50 ticks, or 20 times a second

        if(game.runState===0) return; // Break the continuous cycle if the game should stop

        //Manage player movement
        if(game.playerDirections.up===1 && game.playerDirections.down!==1) game.playerPos[2]-=0.1; // move player up
        if(game.playerDirections.down===1 && game.playerDirections.up!==1) game.playerPos[2]+=0.1; // move player down
        if(game.playerDirections.left===1 && game.playerDirections.right!==1) game.playerPos[0]-=0.1; // move player left
        if(game.playerDirections.right===1 && game.playerDirections.left!==1) game.playerPos[0]+=0.1; // move player right
        if(game.playerUpdateFunc) game.playerUpdateFunc({name: game.userName, x:game.playerPos[0], y:game.playerPos[1], z:game.playerPos[2]});

        // Handle worker assignments
        // To do this, run through all workers to find any idle workers. They will then search by range for any buildings with a recipe that is not running but can be
        // Searching by range will be hard. Right now, we'll simply find the first available building to work at
        for(let i=0; i<game.workers.length; i++) {
            if(typeof(game.workers[i].job)==='undefined') {
                game.workers[i].job = null;
            }
            if(game.workers[i].job===null) {
                // It's an idle worker. Let's look for a job for them
                for(let j=0; j<game.structures.length; j++) {
                    //console.log(game.structures[j].recipe?.name);
                    if(!(game.structures[j].recipe===null)) {
                        //console.log(j +' has active recipe');
                        if(game.structures[j].workerAssigned===null) {
                            if(game.structures[j].recipe.canWork()) {
                                // This is a good job for this worker
                                game.workers[i].job = game.structures[j];
                                game.structures[j].workerAssigned = game.workers[i];
                                console.log('Job at structure #'+ j +' given to worker #'+ i);
                            }
                        }
                    }
                }
            }else{
                // First, we need to get this worker to the proper location. This will require pathfinding at some point (through a 3D environment), but for now I will simply
                // use cardinal checks. So workers will move faster along diagonal lines... don't worry about it, it's only temporary
                let atPosition = true;
                if(game.workers[i].spot[0]-.1>game.workers[i].job.position[0]) {
                    atPosition = false;
                    game.workers[i].spot[0] -= 0.1;
                }
                if(game.workers[i].spot[0]+.1<game.workers[i].job.position[0]) {
                    atPosition = false;
                    game.workers[i].spot[0]+=0.1;
                }
                if(game.workers[i].spot[2]-.1>game.workers[i].job.position[2]) {
                    atPosition=false;
                    game.workers[i].spot[2]-=0.1;
                }
                if(game.workers[i].spot[2]+.1<game.workers[i].job.position[2]) {
                    atPosition=false;
                    game.workers[i].spot[2]+=0.1;
                }
                if(atPosition) {
                    game.workers[i].job.doWork();
                }
            }
        }


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

    pathTo: async (startX, startY, startZ, callBack) => {
        // Generates a path from a known location to a target location.
        // startX, Y & Z: Where the search process begins at. This can be a worker's location or a building
        // callBack - this is called for every tile location. Its input should be a tile. The function should return true if the location is valid, or false if not
        // Returns an object:
        //      result: will be set to 'success' if successful. If not successful, this will be 'fail', and a reason field will also be provided
        //      tile - tile instance where the path stopped
        //      path - path for the worker to reach this item. This will be a string of numbers for lateral directions, with U and D for a worker's Y level changes
        //      distance - total distance points needed to reach this location. Distance will factor in walking lag time for each tile type

        let filledTiles = [{
            x: startX, y:startY, z:startZ,
            travelled: 0, // this will include walk lag... eventually
            tilesPassed: 0, // this will be raw number of tiles travelled, regardless of walk lag
            path: '',
            completed: false
        }];

        let runState = true;
        while(runState) {

            // Determine if we have exhausted all branches of our search
            if(filledTiles.every(t=>t.completed)) {
                return {result:'fail', reason:'limited paths'};
            }

            // Next, sort the existing tiles
            filledTiles.sort((a,b) => {
                // First, completed tiles need to be sorted after new tiles. We don't care about ordering of completed tiles
                if(a.completed) return 1;
                if(b.completed) return -1;
                if(a.travelled > b.travelled) return 1;
                if(a.travelled < b.travelled) return -1;
                return 0;
            });

            // Get the next working tile. We can also determine if this tile is the one we need
            let targetTile = game.tiles[filledTiles[0].x][filledTiles[0].y][filledTiles[0].z];
            if(callBack(targetTile)) {
                // We got a hit!
                return {
                    result: 'success',
                    tile: targetTile,
                    path: filledTiles[0].path,
                    distance: filledTiles[0].travelled
                };
            }

            // Alas, no luck.
            // Before continuing, check how many tiles we have passed over. We don't want to wander out too far, it'll eat too many resources
            if(filledTiles[0].tilesPassed>1000) {
                return {result:'fail', reason:'nothing close'};
            }

            // Determine the cost of travelling across this tile. We might modify this later so diagonal travling will cost more
            let lag = minimapTiles.find(t=>t.id===targetTile.floor).walkLag;

            // Generate more filled tiles from each possible direction from here
            for(let dx=-1; dx<=1; dx++) {
                for(let dy=-1; dy<=1; dy++) {
                    for(let dz=-1; dz<=1; dz++) {
                        if(dx===0 && dy===0 && dz===0) continue; // skip the tile we're already on
                        if(dy!==0 && (dx!==0 || dz!==0)) continue; // going up or down doesn't move the worker's location
                        //[-1,-1,-1]; dy!==0(true), dx!==0(true) - exit
                        //[0,-1,-1]; dy!==0(true), dz!==0(true) - exit
                        //[-1,0,-1]; dy!==0(false) - keep going
                        // Now we run into an issue; previous pathfinding was limited to the area inside our map boundary. This time, however, we may need to fetch tiles
                        // outside the map already generated... meaning we may not be able to calculate a full path in one call

                        // Therefore, this pathTo function itself will need to be fully asynchronous. We will have to manage delays in receiving paths on the workers' side

                        // At this point, we need to determine if the next tile in this direction exists. If not, we will need to (synchronously) load the chunk for it
                        if(typeof(game.tiles[filledTiles[0].x+dx])==='undefined' ||
                           typeof(game.tiles[filledTiles[0].x+dx][filledTiles[0].y+dy])==='undefined' ||
                           typeof(game.tiles[filledTiles[0].x+dx][filledTiles[0].y+dy][filledTiles[0].z+dz])==='undefined') {
                            // This tile has not been loaded. Fetch this chunk from the database here
                            let response = await fetch(serverURL +"/routes/loadmap.php", DAX.serverMessage({
                                chunkList: [[Math.floor((filledTiles[0].x+dx)/chunkSize), Math.floor((filledTiles[0].y+dy)/chunkSize), Math.floor((filledTiles[0].z+dz)/chunkSize)]]
                            }, true));
                            let data = await DAX.manageResponseConversion(response);
                            
                        }
                    }
                }
            }
        }
    }
};


