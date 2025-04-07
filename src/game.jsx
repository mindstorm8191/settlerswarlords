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
import { DAX } from "./libs/DanAjax.js";
import {minimapTiles} from "./minimapTiles.js";
import { createWorker } from "./worker.jsx";

import LeanTo from "./structures/LeanTo.jsx";
import ItemMover from "./structures/ItemMover.jsx";
import RockKnapper from "./structures/RockKnapper.jsx";
import LoggersPost from "./structures/LoggersPost.jsx";
import RopeMaker from "./structures/RopeMaker.jsx";
import DirtManager from "./structures/DirtManager.jsx";

export const game = {
    userId: 0,
    runState: 0, // This gets set to 1 when the game is running
    tickTime: 0, // holds the last tick time
    timeout: null, // Holds the object received from setTimeout(), which is called in game.start()
    tiles: [],
    chunksToLoad: [], // List of all chunks that need to be loaded. We will load 10 chunks at a time, in order to prevent overloading the server. This list also prevents
        // existing chunks on the list from being loaded again. Before loading each chunk, we also need to verify if it has been loaded already.
    chunksLoaded: [], // List of all loaded chunks. Data will only be the x,y,z coordinates of each chunk
    fetchingTiles: false,
    scrollXFunc: null, // Handle to the function that manages scrolling
    scrollX: 0,
    playerDirections: {
        up:0,right:0
    },
    playerUpdateFunc: null,
    playerPos: [],
    userName: '',
    workers: [],
    lastWorkerId: 0,
    getNextWorkerId: ()=>{
        game.lastWorkerId++;
        return game.lastWorkerId;
    },
    structureTypes: [
        LeanTo(),
        ItemMover(),
        RockKnapper(),
        LoggersPost(),
        RopeMaker(),
        DirtManager(),
    ],
    structures: [],
    lastStructureId: 0,
    getNextStructureId: () => {
        game.lastStructureId++;
        return game.lastStructureId;
    },
    unlockedItems: [],  // Keeps track of items the player has crafted, which triggers when new structures are made available

    setup: (localChunk, playerId, playerFunc, location, userName, workers) => {
        // Handles setting up various fields for the player's location to be updated
        console.log(workers);

        
        game.addTiles([localChunk]); // On game start, the server will send us data for one chunk (the one the player is in). 
                                     // We need to pass this in as an array (of 1 element)

        game.userId = playerId;
        game.playerUpdateFunc = playerFunc;
        game.playerPos = location;
        game.userName = userName;
        

        // With the player loaded, we want to trigger loading all tiles surrounding the player (except the chunk that the player is already in)
        let centerx = Math.floor(game.playerPos[0]/chunkSize);
        let centery = Math.floor(game.playerPos[1]/chunkSize);
        let centerz = Math.floor(game.playerPos[2]/chunkSize);
        for(let x=-2; x<=2; x++) {
            for(let y=-1; y<=1; y++) {
                for(let z=-2; z<=2; z++) {
                    if(x===0 && y===0 && z===0) continue;
                    game.chunksToLoad.push({x:centerx+x, y:centery+y, z:centerz+z});
                }
            }
        }

        game.workers = workers.map(w => createWorker(w));
        
        console.log(game.chunksToLoad.length);

        window.game = game;
    },

    start: ()=>{
        // A public function to get the game started, making the game ticks happen at regular intervals
        game.tickTime = new Date().valueOf();
        game.runState = 1;
        game.timeout = setTimeout(function() {
            window.requestAnimationFrame(game.tick);
        }, 50);
    },

    save: () => {
        // Saves all content of the game to the server.

        // We don't want to save every tile of the game to the server every time - that'd be way too much data to send! Instead, for each chunk loaded, collect all modified
        // tiles and only send those

        // For now, structures placed down won't modify tiles. Structures should all have a global structure ID value... but that requires fetching a new ID from the
        // database. We'll do that later.

        // That leaves all modifications down to when items are placed, or removed.
        // Right now we don't have any easy way to do this other than setting tile.modified to true each time we add or remove an item from a tile.
        // (this is now done)

        // Another obstacle is to determine the extents of our search for modified tiles. With our infinite expanding map, plus players that can move anywhere, modified tiles
        // could end up anywhere
        // The solution to that is to keep a log of all the chunks we have loaded. From the log, we can then look over every chunk we have loaded, to decide what has been changed.
        // This could be time-consuming, but we'll worry about spreading out work load at a later time, when delays become evident.

        // Start by running through the list of loaded chunks, and collecting all modified tiles
        let modifiedList = [];
        for(let i=0; i<game.chunksLoaded.length; i++) {
            //console.log('['+ (game.chunksLoaded[i].x*chunkSize) +','+ (game.chunksLoaded[i].y*chunkSize) +','+ (game.chunksLoaded[i].z*chunkSize) +']');
            for(let x=game.chunksLoaded[i].x*chunkSize; x<(game.chunksLoaded[i].x+1)*chunkSize; x++) {
                for(let y=game.chunksLoaded[i].y*chunkSize; y<(game.chunksLoaded[i].y+1)*chunkSize; y++) {
                    for(let z=game.chunksLoaded[i].z*chunkSize; z<(game.chunksLoaded[i].z+1)*chunkSize; z++) {
                        if(game.tiles[x][y][z].modified===1) modifiedList.push(
                            // As we save this back to the server, we should convert this to the short-hand variables
                            //{x:x, y:y, z:z, ...game.tiles[x][y][z]}
                            {   x:x, y:y, z:z,
                                h:game.tiles[x][y][z].health,
                                t:game.tiles[x][y][z].show,
                                f:game.tiles[x][y][z].floor,
                                i:game.tiles[x][y][z].items,
                                s:game.tiles[x][y][z].structure
                            }
                        );
                    }
                }
            }
        }
        if(modifiedList.length>0) {
            console.log(modifiedList[0]);
        }else{
            console.log('Found '+ modifiedList.length +' modified tiles');
        }
        

        // So... with that list made, we need to consider other things that need to be saved. Let's start with the structures.
        // To successfully save the structures, we need to save all the data with it: current assigned recipe, progress along that task, etc.
        // We also need to include an ID with each building...
        // Per-player IDs
        // Need to keep active list per player, and include building owner on server map
        // Building owners will be needed anyway
        // No need to fetch a new ID from the server for every new structure
        // No real limit on number of structures in a server
        // Full server IDs
        // Single value for each structure on the map
        // Anyone can operate an existing structure; don't know who owns any structure

        // So, here's the plan
        // Every building will have a player ID and unique structure ID associated with it. These fields will be saved in the tile data of each tile
        // Each chunk will have a structure list, complete with details of each structure. This will be stored as JSON text in the database
        // Items will still be stored in each tile. We may alter this later. Options include keeping a separate list of items as JSON, along with their coords.
        //      We could also have each tile reference a different database record (one or more), holding all item data. But for now... keep it simple

        // Start with a single message to save the game.
        fetch(
            serverURL +"/routes/save.php",
            DAX.serverMessage({
                playerpos:game.playerPos,
                workers:game.workers.map(w=>{
                    return {
                        id:w.id,
                        spot: w.spot,
                        path: (typeof(w.path)==='undefined'?'':w.path),
                        // We don't need the waitingForPath field - it won't matter anymore when the game is reloaded
                        stepProgress: w.stepProgress,
                        carrying: w.carrying,
                        job: (w.job===null?'none':{id: w.job.id, x: w.job.position[0], y: w.job.position[1], z: w.job.position[2]})
                    };
                }),
                tiles:modifiedList,
                unlockedItems: game.unlockedItems,
                structures: game.structures.map(build=>{
                    let out = {
                        id: build.id,
                        kind: build.name,
                        position: build.position,
                        recipe: (build.recipe===null?-1:build.recipes.findIndex(r=>r===build.recipe)),
                        worker: (build.workerAssigned===null?-1:game.workers.find(w=>w===build.workerAssigned).id),
                        workProgress: build.workProgress
                    };
                    if(typeof(build.save)!=='undefined') {
                        out = {...out, ...build.save()};
                    }
                    return out;
                })
            }, true)
        )
            .then(res=>DAX.manageResponseConversion(res))
            .catch(err =>console.log(err))
            .then(data => {
                console.log('Complete!', data);
            });
    },

    createItem: (name, stats) => {
        // Creates a new item and returns it. If this item is new, its name will be added to game.unlockedItems, and then any structures waiting for that item will
        // become unlocked.
        let item = {name: name,...stats};
        game.checkUnlocks(name);
        return item;
    },

    checkUnlocks: (newItemName) => {
        // Allows structures to be unlocked 
        if(game.unlockedItems.includes(newItemName)) return;
        if(newItemName!=='') game.unlockedItems.push(newItemName);
        
        for(let i=0; i<game.structureTypes.length; i++) {
            if(game.structureTypes[i].locked===1) {
                // We use a nested list to determine what items can unlock the building. For the outer list, we must get a match on each
                // entry of that list. For the inner list, we must get a mach on any single one. For example, [[A,B],[C]], the player can
                // unlock either A or B, but must unlock C.
                if(game.structureTypes[i].prereq.every(outer=>(
                    outer.some(inner=>game.unlockedItems.some(i=>i===inner))
                ))) {
                    game.structureTypes[i].locked = 0;
                }
            }
        }
    },

    addTiles: newChunkList => {
        // Handles loading new map tiles into the game's tiles structure. New tiles received from the server will be in a linear format and need to be
        // converted. The existing tiles map also needs to accept individual tiles, not chunks
        // No return value. the game map will be modified

        newChunkList.forEach((chunk) => {
            // Each of these will be in its own JSON, so we will have to convert it here
            let chunkData = JSON.parse(chunk.content);
            chunkData.forEach((t, i) => {
                // i here will keep track of the index as we progress
                let x = i % chunkSize;
                let y = Math.floor(i / chunkSize) % chunkSize;
                let z = Math.floor(i / (chunkSize * chunkSize));
                // create new array indices in the tiles array if it doesn't exist yet
                if(typeof(game.tiles[chunk.chunkx * chunkSize + x]) === 'undefined') {
                    game.tiles[chunk.chunkx * chunkSize + x] = [];
                }
                if(typeof(game.tiles[chunk.chunkx * chunkSize +x][chunk.chunky * chunkSize + y]) === 'undefined') {
                    game.tiles[chunk.chunkx * chunkSize + x][chunk.chunky * chunkSize + y] = [];
                }
                // This field will always be new
                game.tiles[chunk.chunkx * chunkSize +x][chunk.chunky * chunkSize +y][chunk.chunkz * chunkSize +z] = {
                    show: t.t,
                    floor: t.f,
                    health: t.h,
                    items: t.i,
                    modified: 0
                };
            });

            // We also need to process any structures that might be in this area
            if(chunk.structures!=='' && typeof(chunk.structures)!=='undefined') {
                console.log('Flat structure data: '+ chunk.structures);
                let structureList = JSON.parse(chunk.structures);
                //console.log(structureList);
                structureList.forEach(st => {
                    // Find the correct structure type, based on a matching name
                    let structureType = game.structureTypes.find(sType=>sType.name===st.kind);
                    if(typeof(structureType)!=='object') {
                        console.log('Error: Could not find Structure Type of '+ st.kind);
                        return;
                    }
                    // load the correct tile based on the structure's position
                    let mytile = game.tiles[st.position[0]][st.position[1]][st.position[2]];
                    if(typeof(mytile)==='undefined') {
                        console.log('Error: Could not load structure, tile not found at:', st.position);
                        return;
                    }
                    console.log(st.position, mytile);
                    // This should be enough to generate the structure. Then modify the internal variables
                    let newStruct = structureType.create(mytile);
                    console.log('New structure location: ', newStruct.position, mytile)
                    if(typeof(newStruct.position[0])==='undefined') {
                        newStruct.position = st.position;
                    }
                    if(st.recipe!==-1) newStruct.recipe = newStruct.recipes[st.recipe];
                    newStruct.workProgress = st.workProgress;
                    // Also add workers, if they are assigned to this structure
                    if(st.worker!==-1) {
                        // Unfortunately, workers are not always loaded when tiles are created
                        if(game.workers.length===0) {
                            // For now, we will need to mark this structure's worker with an ID. As workers are loaded, we will need to convert the ID of the structure
                            // to the worker's handle.
                            newStruct.worker = st.worker;
                        }else{
                            let w = game.workers.find(u=>u.id===st.worker);
                            console.log(game.workers, st.worker);
                            w.job = newStruct;
                            newStruct.worker = w;  
                        }
                    }
                    game.structures.push(newStruct);
                    
                    if(typeof(newStruct.onLoad)!=='undefined') newStruct.onLoad(st);
                    // That is... hopefully everything we need to load existing structures
                    console.log('Completed structure load:', newStruct);
                });
            }


            game.chunksLoaded.push({x:chunk.chunkx, y:chunk.chunky, z:chunk.chunkz});
            // As chunks are loaded, find each chunk in the chunksToLoad list and remove it.
            let chunkSlot = game.chunksToLoad.findIndex(ch=>{
                return ch.x===chunk.chunkx && ch.y===chunk.chunky && ch.z===chunk.chunkz;
            });
            if(chunkSlot!==-1) game.chunksToLoad.splice(chunkSlot,1);
        });
        console.log(game.chunksToLoad.length +' chunks left to load');
        //console.log('Now with '+ game.chunksLoaded.length +' chunks');
    },

    fetchTiles2: () => {
        // Handles loading all tiles that are in game.chunksToLoad.
        // Note that this will only start a new fetch when the previous fetch has been completed.
        // It will also remove a chunk from the list if it has already been loaded.

        if(game.fetchingTiles===true) return;
        if(game.chunksToLoad.length===0) return;

        // Start by picking out 10 tiles from the chunksToLoad list. We will eliminate any chunks that have already been loaded as we do this
        for(let i=0; i<game.chunksToLoad; i++) {
            if(game.chunksLoaded.some(c=>c.x===game.chunksToLoad[i].x && c.y===game.chunksToLoad[i].y && c.z===game.chunksToLoad[i].z)) {
                // This chunk has already been loaded
                game.chunksToLoad.splice(i,1);
                i--; // reduce i, to accomodate for this removed tile
            }
            if(i>=10) break; // exit this loop if we have checked 10 chunks
        }
        let chunksToFetch = (game.chunksToLoad.length>10?game.chunksToLoad.splice(0,10):game.chunksToLoad);
        game.fetchingTiles = true;
        fetch(serverURL +"/routes/loadmap.php", DAX.serverMessage({chunkList: chunksToFetch.map(c=>([c.x,c.y,c.z]))}, true))
            .then(res => DAX.manageResponseConversion(res))
            .catch(err => console.log(err))
            .then(data => {
                if(data.result !== 'success') {
                    console.log("There was an error loading map chunks", data);
                    return;
                }
                //console.log('We got '+ data.chunks.length +' from the server');
                game.addTiles(data.chunks);
                game.fetchingTiles = false;
            });
    },

    loadAroundPlayer: ()=>{
        // Searches around the player, and adds tiles to the chunksToLoad list, to keep content around the player loaded

        // Instead of checking for the existence of individual tiles like I used to, we can now verify that chunks are loaded or not.
        let chunkSpot = game.playerPos.map(u=>Math.floor(u/chunkSize));
        let range = 2;
        for(let x=-range; x<=range; x++) {
            for(let y=-range; y<=range; y++) {
                for(let z=-range; z<=range; z++) {
                    
                }
            }
        }
    },

    fetchTiles: (surrounding) => {
        // Manages collecting tiles from the server
        //   surrounding - array with 3 slots, containing X, Y & Z positions
        // No return value. The tile map will be updated when this completes.

        // Eventually, we're going to need a way to prevent the player from scrolling right off the map; in that, as we are waiting for map portions to load,
        // they have to wait until new tiles are received before going that direction

        // This function can be called directly from tick(), and repeatedly. It will manage how often requests are sent to the server
        if(game.fetchingTiles===false) {
            // See what map chunks are missing around the player, currently
            // This would normally be a challenging thing to do, since tiles are not stored according to chunk coordinates.
            // However, they are always loaded in chunks. So if we check any tile within a chunk, we can decide if that chunk has been loaded
            let chunksNeeded = [];
            let range = 1;
            // Player coordinates are stored as a 3-slot array of floats... which makes it hard to pick array elements. Let's fix that
            let intSpot = surrounding.map(u=>Math.floor(u));
            for(let x=-range; x<=range; x++) {
                for(let y=-1; y<=1; y++) {
                    for(let z=-range; z<=range; z++) {
                        // Check each slot of the array here, using Javascript tricks; if one condition fails, it'll skip checking the rest
                        if(
                            typeof(game.tiles[intSpot[0] + (x*chunkSize)]) === 'undefined' ||
                            typeof(game.tiles[intSpot[0] + (x*chunkSize)][intSpot[1] +(y*chunkSize)]) === 'undefined' ||
                            typeof(game.tiles[intSpot[0] + (x*chunkSize)][intSpot[1] +(y*chunkSize)][intSpot[2] +(z*chunkSize)]) === 'undefined'
                        ) {
                            chunksNeeded.push([Math.floor(intSpot[0]/chunkSize) +x, Math.floor(intSpot[1]/chunkSize) +y, Math.floor(intSpot[2]/chunkSize) +z]);
                        }
                    }
                }
            }
            if(chunksNeeded.length>0) {
                console.log(chunksNeeded.length +' chunks left to load, '+ typeof(chunksNeeded.length));
                game.fetchingTiles = true;
                //console.log('We have '+ chunksNeeded.length +' chunks to load');
                if(chunksNeeded.length > 10) chunksNeeded.splice(10, chunksNeeded.length-10); // Limit our fetch to 10 chunks. We can load more on the nex pass
                fetch(serverURL +"/routes/loadmap.php", DAX.serverMessage({chunkList: chunksNeeded}, true))
                    .then(res => DAX.manageResponseConversion(res))
                    .catch(err => console.log(err))
                    .then(data => {
                        if(data.result !== 'success') {
                            console.log("There was an error loading map chunks", data);
                            return;
                        }
                        //console.log('We got '+ data.chunks.length +' from the server');
                        game.addTiles(data.chunks);
                        game.fetchingTiles = false;
                    });
            }
        }
    },

    tick: () => {
        // Handles updating the world. This should run about once every 50 ticks, or 20 times a second

        if(game.runState===0) return; // Break this continuous cycle if the game should stop

        // Start with loading additional map chunks around the player
        //game.fetchTiles(game.playerPos);
        game.fetchTiles2();

        
        //Manage player movement
        if(game.playerDirections.down===-1) game.playerPos[2] -= 0.1;
        if(game.playerDirections.down===1) game.playerPos[2] += 0.1;
        if(game.playerDirections.right===-1) game.playerPos[0] -= 0.1;
        if(game.playerDirections.right===1) game.playerPos[0] += 0.1;
        //if(game.playerDirections.up===1 && game.playerDirections.down!==1) game.playerPos[2]-=0.1; // move player up
        //if(game.playerDirections.down===1 && game.playerDirections.up!==1) game.playerPos[2]+=0.1; // move player down
        //if(game.playerDirections.left===1 && game.playerDirections.right!==1) game.playerPos[0]-=0.1; // move player left
        //if(game.playerDirections.right===1 && game.playerDirections.left!==1) game.playerPos[0]+=0.1; // move player right
        if(game.playerUpdateFunc) game.playerUpdateFunc({name: game.userName, x:game.playerPos[0], y:game.playerPos[1], z:game.playerPos[2]});


        // Handle worker assignments
        // To do this, run through all workers to find any idle workers. They will then search by range for any buildings with a recipe that is not running but can be
        // Searching by range will be hard. Right now, we'll simply find the first available building to work at
        for(let z=0; z<game.workers.length; z++) {
            game.workers[z].tick();
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

    pathTo: async (startX, startY, startZ, range, callBack, onComplete) => {
        // Generates a path from a known location to a target location.
        // startX, Y & Z: Where the search process begins at. This can be a worker's location or a building
        // range - how many tiles to travel before giving up a search. This is important to keep workers from wandering off doing work and never making it back home again
        // callBack - this is called for every tile location scanned
        //      tile - tile being scanned
        //      position - array with 3 slots representing the tile's world location
        //      This should return true if this is an acceptable tile, or false if not
        // onComplete - a second callback that is called when this process is complete.
        //  passes a single object:
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

        if(typeof(game.tiles[startX])==='undefined' ||
           typeof(game.tiles[startX][startY])==='undefined' ||
           typeof(game.tiles[startX][startY][startZ])==='undefined') {
            onComplete({result:'fail', reason:'start not loaded'});
            return;
        }

        let runState = true;
        while(runState) {

            // Determine if we have exhausted all branches of our search
            if(filledTiles.every(t=>t.completed)) {
                onComplete({result:'fail', reason:'limited paths'});
                return;
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

            //console.log('['+ filledTiles[0].x +','+ filledTiles[0].y +','+ filledTiles[0].z +']');

            // Get the next working tile. We can also determine if this tile is the one we need
            let targetTile = game.tiles[filledTiles[0].x][filledTiles[0].y][filledTiles[0].z];
            if(callBack(targetTile, [filledTiles[0].x, filledTiles[0].y, filledTiles[0].z])) {
                // We got a hit!
                onComplete({
                    result: 'success',
                    tile: targetTile,
                    path: filledTiles[0].path,
                    distance: filledTiles[0].travelled
                });
                return;
            }

            
            // Alas, no luck.
            // Before continuing, check how many tiles we have passed over. We don't want to wander out too far, it'll eat too many resources
            if(filledTiles[0].path.length>range) {
                onComplete({result:'fail', reason:'nothing close'});
                return;
            }

            // Determine the cost of travelling across this tile. We might modify this later so diagonal travling will cost more
            //let lag = minimapTiles.find(t=>t.id===targetTile.floor).walkLag;
            let miniTile = minimapTiles.find(t => t.id===targetTile.floor);
            let lag = 50;
            if(typeof(miniTile)==='undefined') {
                //console.log('Error: Could not find minimapTile data for floor type='+ targetTile.floor);
            }else{
                lag = miniTile.walkLag;
            }


            // Generate more filled tiles from each possible direction from here
            for(let dx=-1; dx<=1; dx++) {
                for(let dy=-1; dy<=1; dy++) {
                    for(let dz=-1; dz<=1; dz++) {
                        if(dx===0 && dy===0 && dz===0) continue; // skip the tile we're already on
                        if(dy!==0 && (dx!==0 || dz!==0)) continue; // going up or down doesn't move the worker's location
                        //[-1,-1,-1]; dy!==0(true), dx!==0(true) - exit
                        //[0,-1,-1]; dy!==0(true), dz!==0(true) - exit
                        //[-1,0,-1]; dy!==0(false) - keep going

                        // Moving vertically will depend on specifoc tile types. We don't have those types yet.
                        if(dy>0) continue;
                        if(dy<0) continue;


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
                            if(data.result!=='success') {
                                console.log('Error in .pathTo(): fetching more tiles resulted in error', data);
                            }else{
                                console.log('Add tiles for pathfinding. Current path: '+ filledTiles[0].path);
                                game.addTiles(data.chunks);
                            }
                        } /// ...sooo, from this we should be able to retrieve data from the tile

                        // Diagonals will take longer to travel through. This is a simple method to solve the issue; we multiply this with the lag value. So if we are
                        // moving diagonally, 
                        let diagonals = (dx===0 || dz===0) ? 1 : 1.4;

                        // pathing is just a bit more complex now; we need to account for going up or down
                        let pathDir = ( (dz+1) *3 + (dx+1) );
                        if(dy===1) pathDir = 'u';
                        if(dy===-1) pathDir = 'd';

                        // Also make sure this location hasn't been filled in yet
                        let locationMatch = filledTiles.findIndex(tile=>tile.x===filledTiles[0].x+dx && tile.y===filledTiles[0].y +dy && tile.z===filledTiles[0].z +dz);
                        if(locationMatch!==-1) {
                            // We've already seen this location before...
                            if(filledTiles[locationMatch].completed===true) continue; // Don't worry about already-completed tiles
                            if(filledTiles[0].travelled + (lag*diagonals) < filledTiles[locationMatch].travelled) {
                                // Our current path is shorter than the existing one. This can happen; for example a path through water is fewer tiles but takes longer
                                // than a path over a bridge
                                filledTiles.splice(locationMatch, 1);
                                filledTiles.push({
                                    x: filledTiles[0].x +dx,
                                    y: filledTiles[0].y +dy,
                                    z: filledTiles[0].z +dz,
                                    travelled: filledTiles[0].travelled + (lag * diagonals),
                                    path: filledTiles[0].path + pathDir,
                                    completed: false
                                });
                            }
                            continue;
                        }

                        // We should be good to add this location now
                        filledTiles.push({
                            x: filledTiles[0].x +dx,
                            y: filledTiles[0].y +dy,
                            z: filledTiles[0].z +dz,
                            travelled: filledTiles[0].travelled + (lag * diagonals),
                            path: filledTiles[0].path + pathDir,
                            completed: false
                        });
                    } // dz
                } // dy
            } // dx

            // Don't forget to tag this tile as completed
            filledTiles[0].completed = true;
        }
    }
};


