/*  gamemap.php
    Handles functions and operations related to loading and preparing the game map
    For the game Settlers & Warlords
*/

import { serverURL, chunkSize } from "./App.js";
import { DAX } from "./libs/DanAjax.js";
import { game } from "./game.jsx";

export const gamemap = {
    tiles: [],
    chunksToLoad: [], // List of all chunks that need to be loaded. We will load 10 chunks at a time, in order to prevent overloading the server. This list also prevents
        // existing chunks on the list from being loaded again. Before loading each chunk, we also need to verify if it has been loaded already.
    chunksLoaded: [], // List of all loaded chunks. Data will only be the x,y,z coordinates of each chunk
    fetchingTiles: false,
    
    queueChunkLoad: (newChunk, fromSpot) => {
        // Adds a single chunk to the list of chunks to be loaded.
        // Ensures that if the chunk already exists in the list or is loaded, it won't be loaded again.
        // newChunk = array of 3 ints to determine where the chunk is
        // Returns true, or false if there was a problem with the input data.

        if(newChunk.length!==3) {
            console.error('From '+ fromSpot +': Error in game.queueChunkLoad(): Array length is '+ newChunk.length +', it must be 3');
            return false;
        }
        if(typeof(newChunk[0])!=='number') {
            console.error('From '+ fromSpot +': Error in game.queueChunkLoad(): X is of type '+ typeof(newChunk[0]) +', it must be a whole number');
            return false;
        }
        if(isNaN(newChunk[0])) {
            console.error('From '+ fromSpot +': Error in game.queueChunkLoad(): X is NaN');
            return false;
        }
        if(typeof(newChunk[1])!=='number') {
            console.error('From '+ fromSpot +': Error in game.queueChunkLoad(): Y is of type '+ typeof(newChunk[1]) +', it must be a whole number');
            return false;
        }
        if(typeof(newChunk[2])!=='number') {
            console.error('From '+ fromSpot +': Error in game.queueChunkLoad(): Z is of type '+ typeof(newChunk[2]) +', it must be a whole number');
            return false;
        }

        // Check if this chunk is already added somewhere
        if(game.chunksLoaded.some(cin => cin[0]===newChunk[0] && cin[1]===newChunk[1] && cin[2]===newChunk[2])) return true;
        if(game.chunksToLoad.some(cin => cin[0]===newChunk[0] && cin[1]===newChunk[1] && cin[2]===newChunk[2])) return true;
        game.chunksToLoad.push(newChunk);
        return true;
    },

    fetchTiles2: () => {
        // Handles loading all tiles that are in game.chunksToLoad.
        // Note that this will only start a new fetch when the previous fetch has been completed.
        // It will also remove a chunk from the list if it has already been loaded.

        if(game.fetchingTiles===true) return; // We can't do any additional work while we wait for an existing fetch to return content.
        if(game.chunksToLoad.length===0) {
            // If there are no current chunks to load, at least make sure that the space around the player is loaded
            let searchCenter = game.playerPos.map(i=>Math.floor(i/chunkSize));
            for(let x=-1; x<=1; x++) {
                for(let y=-1; y<=1; y++) {
                    for(let z=-1; z<=1; z++) {
                        if(x===0 && y===0 && z===0) continue;
                        if(!game.chunksLoaded.some(c=>c[0]===searchCenter[0]+x && c[1]===searchCenter[1]+y && c[2]===searchCenter[2]+z)) {
                            game.queueChunkLoad([searchCenter[0]+x, searchCenter[1]+y, searchCenter[2]+z]);
                        }
                    }
                }
            }
            return;
        }else{
            // Start by picking out 10 tiles from the chunksToLoad list. We will eliminate any chunks that have already been loaded as we do this
            for(let i=0; i<game.chunksToLoad.length; i++) {
                if(game.chunksLoaded.some(c=>c[0]===game.chunksToLoad[i][0] && c[1]===game.chunksToLoad[i][1] && c[2]===game.chunksToLoad[i][2])) {
                    // This chunk has already been loaded
                    game.chunksToLoad.splice(i,1);
                    i--; // reduce i, to accomodate for this removed tile
                }
                // Also check if this chunk contains valid chunk coordinates
                if(typeof(game.chunksToLoad[i][0])!=='number' || typeof(game.chunksToLoad[i][1])!=='number' || typeof(game.chunksToLoad[i][2])!=='number') {
                    console.error('Error in game->fetchTiles2(): Found chunk to load with invalid values', game.chunksToLoad[i]);
                    game.chunksToLoad.splice(i,1);
                    i--;
                }
                if(i>=10) break; // exit this loop if we have checked 10 chunks
            }
        }

        let chunksToFetch = [];
        if(game.chunksToLoad.length>10) {
            chunksToFetch = game.chunksToLoad.splice(0,10);
        }else{
            chunksToFetch = game.chunksToLoad;
        }

        game.fetchingTiles = true;
        fetch(serverURL +"/routes/loadmap.php", DAX.serverMessage({chunkList: chunksToFetch.map(c=>([c[0],c[1],c[2]]))}, true, 'src/gamemap.jsx->fetchTiles2()->get tiles'))
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
                //console.log('Flat structure data: '+ chunk.structures);
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
                    //console.log(st.position, mytile);
                    // This should be enough to generate the structure. Then modify the internal variables
                    let newStruct = structureType.create(mytile);
                    //console.log('New structure location: ', newStruct.position, mytile, st.position);
                    if(typeof(newStruct.position[0])==='undefined') {
                        newStruct.position = st.position;
                    }
                    newStruct.id = st.id;
                    if(st.recipe!==-1) newStruct.recipe = newStruct.recipes[st.recipe];
                    newStruct.workProgress = st.workProgress;
                    // Also add workers, if they are assigned to this structure
                    if(st.worker!==-1) {
                        // Unfortunately, workers are not always loaded when tiles are created
                        if(game.workers.length===0) {
                            // For now, we will need to mark this structure's worker with an ID. As workers are loaded, we will need to convert the ID of the structure
                            // to the worker's handle.
                            newStruct.workerAssigned = st.worker;
                        }else{
                            let w = game.workers.find(u=>u.id===st.worker);
                            console.log(game.workers, st.worker);
                            w.job = newStruct;
                            newStruct.workerAssigned = w;  
                        }
                    }
                    game.structures.push(newStruct);
                    
                    if(typeof(newStruct.onLoad)!=='undefined') newStruct.onLoad(st);
                    // That is... hopefully everything we need to load existing structures
                    //console.log('Completed structure load:', newStruct);
                });
            }


            //game.chunksLoaded.push({x:chunk.chunkx, y:chunk.chunky, z:chunk.chunkz});
            game.chunksLoaded.push([chunk.chunkx, chunk.chunky, chunk.chunkz]);

            // As chunks are loaded, find each chunk in the chunksToLoad list and remove it.
            let chunkSlot = game.chunksToLoad.findIndex(ch=>{
                return ch[0]===chunk.chunkx && ch[1]===chunk.chunky && ch[2]===chunk.chunkz;
            });
            if(chunkSlot!==-1) game.chunksToLoad.splice(chunkSlot,1);
        });
    }
};