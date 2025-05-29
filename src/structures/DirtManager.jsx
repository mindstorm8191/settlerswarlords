/*  DirtManager.jsx
    Allows players to specify where to pick up dirt and where to place it.
    For the game Settlers & Warlords

    Managing tile movement will happen 10 shovel-fulls at a time. We will also have to accomodate sloped tiles, now. Sloped tiles will always use 5 scoops of dirt; full tiles will
    need 10. Sloped tiles can turned into full tiles with an additional 5 scoops.

    One tile marked for dirt deposit; can only hold 5 dirt. More would mean dirt spilling over
    |__|__|__|
    |__|uu|__|
    |__|__|__|

    Two tiles marked. Can only hold 10 dirt
    |__|__|__|__|
    |__|uu|uu|__|
    |__|__|__|__|

    Four tiles can also only hold 20 dirt
    |__|__|__|__|
    |__|uu|uu|__|
    |__|uu|uu|__|
    |__|__|__|__|

    A 3x3 tile section can hold much more dirt: 50 scoops
    |__|__|__|__|__|
    |__|uu|uu|uu|__|
    |__|uu|ff|uu|__|
    |__|uu|uu|uu|__|
    |__|__|__|__|__|

    A 3x4 tile section can have two full tiles: 70 scoops
    |__|__|__|__|__|__|
    |__|uu|uu|uu|uu|__|
    |__|uu|ff|ff|uu|__|
    |__|uu|uu|uu|uu|__|
    |__|__|__|__|__|__|

    A 3x5 can hold 90 dirt
    |__|__|__|__|__|__|__|
    |__|uu|uu|uu|uu|uu|__|
    |__|uu|ff|ff|ff|uu|__|
    |__|uu|uu|uu|uu|uu|__|
    |__|__|__|__|__|__|__|

    A 4x4 can hold 100 dirt
    |__|__|__|__|__|__|
    |__|uu|uu|uu|uu|__|
    |__|uu|ff|ff|uu|__|
    |__|uu|ff|ff|uu|__|
    |__|uu|uu|uu|uu|__|
    |__|__|__|__|__|__|

    Larger areas can show be used to make elevated level surfaces, using 370 scoops, but can also be stacked up a second level, holding 420 scoops
    |__|__|__|__|__|__|__|__|__|
    |__|uu|uu|uu|uu|uu|uu|uu|__|
    |__|uu|ff|ff|ff|ff|ff|uu|__|
    |__|uu|ff|mm|mm|mm|ff|uu|__|
    |__|uu|ff|mm|22|mm|ff|uu|__|
    |__|uu|ff|mm|mm|mm|ff|uu|__|
    |__|uu|ff|ff|ff|ff|ff|uu|__|
    |__|uu|uu|uu|uu|uu|uu|uu|__|
    |__|__|__|__|__|__|__|__|__|
    
    Workers will try to fill the closest tiles they can. They will not be able to add to a sloped tile until all neighboring tiles are also sloped

    Tile slope types
    Flat
    Sloped
    Filled

    The digging process
    Assuming a single tile is dug, the player will need sloped tiles for each of the 4 sides of that tile. The same will be true for building one tile up; the 4 neighboring
    tiles will all have slopes. Therefore, a single build site will need 30 dirt to be filled, before you get to a fully raised tile

    We need to set up new commands. Instead of merely marking pickup places and fill places, we need to have places workers are ordered to clear out, and places that workers
    are ordered to fill in. This will allow for things that use dirt to gather it from somewhere, and for things that generate dirt to put it somewhere. It'll be 4 lists now:
    source site
    dump site
    remove space
    build space

*/

import React from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import { textureURL } from "../App.js";

import { game } from "../game.jsx";
import { GameHelper } from "../GameHelper.jsx";

export default function DirtManager() {
    // Returns an object that can generate new DirtManager structures. This allows players to move dirt or forage-covered tiles to new locations

    return {
        name: 'Dirt Manager',
        image: 'dirtmanager.png',
        tooltip: 'Terraform dirt',
        locked: 1,
        prereq: [['Flint Shovel']],
        canBuild: (tile) => '',
        create: (tile) => {
            let b = {
                name: 'Dirt Manager',
                descr: `Nature puts dirt where it works best; usually for draining rainwater. That isn't always ideal for your needs, such as growing crops or making factories.
                        Now that you have shovels, you can fix that`,
                image: 'dirtmanager.png',
                position: [tile.x, tile.y, tile.z],
                size: [1,1,1],
                id: game.getNextStructureId(),
                workProgress: 0,
                workerAssigned: null,
                recipe: null,
                sourceList: [],  // These are used when we need to gather dirt from some source
                dumpList: [],  // These are used when we need a place to put collected dirt
                removeList: [], // These trigger a worker to remove the dirt from these tiles
                buildList: [], // These trigger a worker to find dirt to place here
                // Old lists to be deprecated
                //pickupList: [],  // list of tile locations where dirt will be picked up from. Once these tiles are completed, they will be removed from the list
                //dropoffList: [], // list of tile locations where dirt will be placed down at. Will be emptied as they get completed
                recipes: [
                    {
                        name: 'Move Dirt',
                        workerTime: 20, // 1 second to pick up dirt, 1 second to pack it down where it goes
                        toolsNeeded: ['Flint Shovel'],
                        canAssign: ()=>true, // This can be assigned at any time
                        canWork: ()=> {
                            // Returns true if there is work that workers can do

                            return (b.removeList.length>0 && b.dumpList.length>0)||(b.buildList.length>0 && b.sourceList.length>0);
                        },
                        workLocation: (tile,position) => {
                            // returns true if the given tile is suitable for work.

                            // We have a single worker assigned to this structure, and they can be reached by b.workerAssigned. We only need to determine if they are already carrying
                            // a unit of dirt.
                            if(typeof(b.workerAssigned)==='undefined') return false;
                            if(b.workerAssigned.carrying.some(i=>i.name==='Dirt Ball')) {
                                // This worker already has dirt. So, we need a drop-off location
                                return b.dumpList.some(spot=>position[0]===spot[0] && position[1]===spot[1] && position[2]===spot[2]) ||
                                       b.buildList.some(spot=>position[0]===spot[0] && position[1]===spot[1] && position[2]===spot[2]);
                            }else{
                                // This worker has no dirt. Find a tile to collect dirt from
                                return b.removeList.some(spot=>position[0]===spot[0] && position[1]===spot[1] && position[2]===spot[2]) ||
                                       b.sourceList.some(spot=>position[0]===spot[0] && position[1]===spot[1] && position[2]===spot[2]);
                            }
                        },
                        doWork: ()=>{
                            // Lets workers perform actions at the given tile

                            // Start by determining what type of spot this worker is at
                            let location = (b.dumpList.some(spot=>spot[0]===b.workerAssigned.spot[0] && spot[1]===b.workerAssigned.spot[1] && spot[2]===b.workerAssigned.spot[2])?'dump':
                                            b.buildList.some(spot=>spot[0]===b.workerAssigned.spot[0] && spot[1]===b.workerAssigned.spot[1] && spot[2]===b.workerAssigned.spot[2])?'build':
                                            b.removeList.some(spot=>spot[0]===b.workerAssigned.spot[0] && spot[1]===b.workerAssigned.spot[1] && spot[2]===b.workerAssigned.spot[2])?'remove':
                                            b.sourceList.some(spot=>spot[0]===b.workerAssigned.spot[0] && spot[1]===b.workerAssigned.spot[1] && spot[2]===b.workerAssigned.spot[2])?'source':
                                            'error');
                            if(location==='error') {
                                console.log("Error in DirtManager->doWork(): Worker location doesn't match any target list");
                                return;
                            }

                            b.workProgress++;
                            if(b.workProgress<b.recipe.workerTime) return;
                            b.workProgress=0;

                            
                            let mytile = GameHelper.getTile(b.workerAssigned.spot[0], b.workerAssigned.spot[1], b.workerAssigned.spot[2], 'DirtManager->doWork()');
                            if(!mytile) return;
                            if(typeof(mytile.items)==='undefined') mytile.items = [];

                            // Now, moving forward depends on what type of location we have
                            if(location==='remove' || location==='source') {
                                // This is where we get dirt from. We'll need a Dirt Ball in the worker's inventory, and also a Removed Dirt item at the site.
                                // Removed Dirt is a void type item that cannot be taken by any worker or machine

                                mytile.items.push({name:'Removed Dirt'}); // We don't need this in the Unlocked Items list
                                b.workerAssigned.carrying.push(game.createItem('Dirt Ball', {}));

                                // If there less than 5 Removed Dirts here, we are finished
                                if(mytile.items.filter(i=>i.name==='Removed Dirt').length<5) return;

                                // If this was not a down-slope already, we can simply turn it into one and be finished here
                                if(typeof(mytile.slope)==='undefined' || mytile.slope!==-1) {
                                    GameHelper.removeItems(mytile, 'Removed Dirt', 5);
                                    mytile.slope = -1; // Right now, we don't worry about removing this tile from any list. This only happens when the tile gets filled up.
                                    return;
                                }

                                // Next, figure out if any neighbors can gain a slope of dirt. The dirt basically spills over to that tile, to make this one bigger
                                let neighborTile = GameHelper.getTile(b.workerAssigned.spot[0]+1,b.workerAssigned.spot[1],b.workerAssigned.spot[2],'DirtManager->doWork()->remove, neighbor x+1');
                                if(!neighborTile) return;
                                if(typeof(neighborTile.slope)==='undefined') neighborTile.slope = 0;
                                if(neighborTile.slope!==-1) {
                                    GameHelper.removeItems(mytile, 'Removed Dirt', 5);
                                    neighborTile.slope = neighborTile.slope - 1;

                                    // We also need to set the slope of the tile under here
                                    neighborTile = GameHelper.getTile(b.workerAssigned.spot[0]+1, b.workerAssigned.spot[1]-1, b.workerAssigned.spot[2], 'DirtManager->doWork()->remove neighbor x+1 y-1');
                                    if(!neighborTile) return;
                                    neighborTile.slope = 1;
                                    return;
                                }
                                
                                neighborTile = GameHelper.getTile(b.workerAssigned.spot[0]-1,b.workerAssigned.spot[1],b.workerAssigned.spot[2], 'DirtManager->doWork()->remove, neighbor x-1');
                                if(!neighborTile) return;
                                if(typeof(neighborTile.slope)==='undefined') neighborTile.slope = 0;
                                if(neighborTile.slope!==-1) {
                                    GameHelper.removeItems(mytile, 'Removed Dirt', 5);
                                    neighborTile.slope = neighborTile.slope -1;

                                    neighborTile = GameHelper.getTile(b.workerAssigned.spot[0]-1, b.workerAssigned.spot[1]-1, b.workerAssigned.spot[2], 'DirtManager->doWork()->remove, neighbor x-1 y-1');
                                    if(!neighborTile) return;
                                    neighborTile.slope = 1;
                                    return;
                                }

                                neighborTile = GameHelper.getTile(b.workerAssigned.spot[0],b.workerAssigned.spot[1],b.workerAssigned.spot[2]+1,'DirtManager->doWork()->remove, neighbor z+1');
                                if(!neighborTile) return;
                                if(typeof(neighborTile.slope)==='undefined') neighborTile.slope = 0;
                                if(neighborTile.slope!==-1) {
                                    GameHelper.removeItems(mytile, 'Removed Dirt', 5);
                                    neighborTile.slope = neighborTile.slope -1;

                                    neighborTile = GameHelper.getTile(b.workerAssigned.spot[0],b.workerAssigned[1]-1,b.workerAssigned.spot[2]+1, 'DirtManager->doWork()->remove, neighbor y-1 z+1');
                                    if(!neighborTile) return;
                                    neighborTile.slope = 1;
                                    return;
                                }

                                neighborTile = GameHelper.getTile(b.workerAssigned.spot[0],b.workerAssigned.spot[1],b.workerAssigned.spot[2]-1, 'DirtManager->doWork()->remove, neighbor z-1');
                                if(!neighborTile) return;
                                if(typeof(neighborTile.slope)==='undefined') neighborTile.slope = 0;
                                if(neighborTile.slope!==-1) {
                                    GameHelper.removeItems(mytile, 'Removed Dirt', 5);
                                    neighborTile.slope = neighborTile.slope -1;

                                    neighborTile = GameHelper.getTile(b.workerAssigned.spot[0],b.workerAssigned.spot[1]-1,b.workerAssigned.spot[2]-1, 'DirtManager->doWork()->remove, neighbor y-1 z-1');
                                    if(!neighborTile) return;
                                    neighborTile.slope = 1;
                                    return;
                                }

                                // If we've made it this far, there are no neighbors that we can remove dirt from. So we will finish off dirt removal from this tile
                                // We also need to get the tile under this, so it can be modified.
                                neighborTile = GameHelper.getTile(b.workerAssigned.spot[0],b.workerAssigned.spot[1]-1,b.workerAssigned.spot[2], 'DirtManager->doWork()->remove, neighbor y-1');
                                if(!neighborTile) return;
                                mytile.floor = 0;
                                mytile.slope = 0;
                                neighborTile.show = 0;

                                // Now, we need to remove this tile from this structure's target list
                                if(location==='remove') {
                                    let slot = b.removeList.findIndex(spot=>spot[0]===b.workerAssigned.spot[0] && spot[1]===b.workerAssigned.spot[1] && spot[2]===b.workerAssigned.spot[2]);
                                    b.removeList.splice(slot, 1);
                                }else if(location==='source') {
                                    let slot = b.sourceList.findIndex(spot=>spot[0]===b.workerAssigned.spot[0] && spot[1]===b.workerAssigned.spot[1] && spot[2]===b.workerAssigned.spot[2]);
                                    b.sourceList.splice(slot, 1);
                                }
                                return;
                            }

                            // This side is for dumping and building
                            // We need to remove a Dirt Ball from the worker's inventory, and place it on the ground here
                            let slot = b.workerAssigned.carrying.findIndex(i=>i.name==='Dirt Ball');
                            mytile.items.push(b.workerAssigned.carrying.splice(slot,1)[0]);

                            // If there is less than 5 Dirt Balls placed here, we're done
                            if(mytile.items.filter(i=>i.name==='Dirt Ball').length<5) return;

                            // If this is not an up-slope already, we can simply make it one
                            if(typeof(mytile.slope)==='undefined' || mytile.slope!==1) {
                                GameHelper.removeItems(mytile, 'Dirt Ball', 5);
                                mytile.slope = 1; // Right now, we don't worry about removing this tile from any list. This only happens when the tile gets filled up.
                                return;
                            }

                            // Next, figure out if any neighbors can gain a slope of dirt. The dirt basically spills over to that tile, to make this one bigger
                            let neighborTile = game.tiles[b.workerAssigned.spot[0]+1][b.workerAssigned.spot[1]][b.workerAssigned.spot[2]];
                            if(typeof(neighborTile)==='undefined') {
                                console.log('Error in DirtManager->doWork(): Could not find neighbor tile at x+1 from worker');
                                return;
                            }
                            if(typeof(neighborTile.slope)==='undefined') neighborTile.slope = 0;
                            if(neighborTile.slope!==1) {
                                GameHelper.removeItems(mytile, 'Dirt Ball', 5);
                                neighborTile.slope = neighborTile.slope + 1;
                                return;
                            }
                            
                            neighborTile = game.tiles[b.workerAssigned.spot[0]-1][b.workerAssigned.spot[1]][b.workerAssigned.spot[2]];
                            if(typeof(neighborTile)==='undefined') {
                                console.log('Error in DirtManager->doWork(): Could not find neighbor tile at x-1 from worker');
                                return;
                            }
                            if(typeof(neighborTile.slope)==='undefined') neighborTile.slope = 0;
                            if(neighborTile.slope!==1) {
                                GameHelper.removeItems(mytile, 'Dirt Ball', 5);
                                neighborTile.slope = neighborTile.slope + 1;
                                return;
                            }

                            neighborTile = game.tiles[b.workerAssigned.spot[0]][b.workerAssigned.spot[1]][b.workerAssigned.spot[2]+1];
                            if(typeof(neighborTile)==='undefined') {
                                console.log('Error in DirtManager->doWork(): Could not find neighbor tile at z+1 from worker');
                                return;
                            }
                            if(typeof(neighborTile.slope)==='undefined') neighborTile.slope = 0;
                            if(neighborTile.slope!==1) {
                                GameHelper.removeItems(mytile, 'Dirt Ball', 5);
                                neighborTile.slope = neighborTile.slope + 1;
                                return;
                            }

                            neighborTile = game.tiles[b.workerAssigned.spot[0]][b.workerAssigned.spot[1]][b.workerAssigned.spot[2]-1];
                            if(typeof(neighborTile)==='undefined') {
                                console.log('Error in DirtManager->doWork(): Could not find neighbor tile at z-1 from worker');
                                return;
                            }
                            if(typeof(neighborTile.slope)==='undefined') neighborTile.slope = 0;
                            if(neighborTile.slope!==1) {
                                GameHelper.removeItems(mytile, 'Dirt Ball', 5);
                                neighborTile.slope = neighborTile.slope + 1;
                                return;
                            }

                            // If we've made it this far, there are no neighbors that we can remove dirt from. So we will finish off dirt removal from this tile
                            // We also need to get the tile under this, so it can be modified.
                            neighborTile = game.tiles[b.workerAssigned.spot[0]][b.workerAssigned.spot[1]+1][b.workerAssigned.spot[2]];
                            if(typeof(neighborTile)==='undefined') {
                                console.log('Error in DirtManager->doWork(): Could not find tile below worker location');
                                return;
                            }
                            if(typeof(neighborTile.slope)==='undefined') neighborTile.slope = 0;
                            
                            mytile.show = 1; // for dirt
                            mytile.slope = 0;
                            neighborTile.floor = 1; // also dirt

                            // Now, remove this tile from this structure's target list
                            if(location==='dump') {
                                let slot = b.dumpList.findIndex(spot=>spot[0]===b.workerAssigned.spot[0] && spot[1]===b.workerAssigned.spot[1] && spot[2]===b.workerAssigned.spot[2]);
                                b.dumpList.splice(slot,1);
                            }else if(location==='build') {
                                let slot = b.buildList.findIndex(spot=>spot[0]===b.workerAssigned.spot[0] && spot[1]===b.workerAssigned.spot[1] && spot[2]===b.workerAssigned.spot[2]);
                                b.buildList.splice(slot,1);
                            }
                            return;
                        }
                    }
                ],
                Render: ()=>{
                    const texture = useLoader(TextureLoader, textureURL +"structures/dirtmanager.png");
                    return (
                        <mesh position={[b.position[0], .1, b.position[2]]} rotation={[-Math.PI/2,0,0]}>
                            <planeGeometry args={[1,1]} />
                            <React.Suspense fallback={<meshPhongMaterial color={"brown"} />}>
                                <meshStandardMaterial map={texture} />
                            </React.Suspense>
                        </mesh>
                    );
                },
                RightPanel: ()=> {
                    const [interactionState, setInteractionState] = React.useState('none');
                    switch(interactionState) {
                        case 'none': return (
                            <div>
                                Source tiles: {b.sourceList.length} unfinished
                                <span className="fakelink" style={{marginBottom:10, marginLeft:5}}
                                    onClick={()=>{
                                        setInteractionState('source');
                                        game.mapInteracter = (event, tile) => {
                                            b.sourceList.push([tile.x,tile.y,tile.z]);
                                        };
                                    }}
                                >
                                    Select Source Tiles
                                </span><br />
                                Dump tiles: {b.dumpList.length} unfinished
                                <span className="fakelink" style={{marginBottom:10, marginLeft:5}}
                                    onClick={()=>{
                                        setInteractionState('dump');
                                        game.mapInteracter = (event,tile) => {
                                            b.dumpList.push([tile.x,tile.y,tile.z]);
                                        };
                                        //game.tileRenderAddon = (tile) => {
//
  //                                      }
                                    }}
                                >
                                    Select Dump Tiles
                                </span><br />
                                Remove tiles: {b.removeList.length} unfinished
                                <span className="fakelink" style={{marginBottom:10, marginLeft:5}}
                                    onClick={()=>{
                                        setInteractionState('remove');
                                        game.mapInteracter = (event,tile) => {
                                            b.removeList.push([tile.x,tile.y,tile.z]);
                                        };
                                    }}
                                >
                                    Select Remove Tiles
                                </span><br />
                                Build tiles: {b.buildList.length} unfinished
                                <span className="fakelink" style={{marginBottom:10, marginLeft:5}}
                                    onClick={()=>{
                                        setInteractionState('build');
                                        game.mapInteracter = (event,tile) => {
                                            b.buildList.push([tile.x, tile.y, tile.z]);
                                        };
                                    }}
                                >
                                    Select Build Tiles
                                </span>
                            </div>
                        );
                        case 'source': return (
                            <div>
                                Select map tiles for providing dirt from (only when needed), then click
                                <span className="fakelink" style={{marginLeft:5}}
                                    onClick={()=> {
                                        setInteractionState('none');
                                        game.mapInteracter = null;
                                    }}
                                >
                                    Done
                                </span><br />
                                Count: {b.sourceList.length} tiles
                            </div>
                        );
                        case 'dump': return (
                            <div>
                                Select map tiles to dump extra dirt to (only when needed), then click
                                <span className="fakelink" style={{marginLeft:5}}
                                    onClick={()=>{
                                        setInteractionState('none');
                                        game.mapInteracter = null;
                                    }}
                                >Done</span><br />
                                Count: {b.dropoffList.length} tiles
                            </div>
                        );
                        case 'remove': return (
                            <div>
                                Select map tiles to remove dirt from, then click
                                <span className="fakelink" style={{marginLeft:5}}
                                    onClick={()=> {
                                        setInteractionState('none');
                                        game.mapInteracter = null;
                                    }}
                                >Done</span><br />
                                Count: {b.removeList.length} tiles
                            </div>
                        );
                        case 'build': return (
                            <div>
                                Select map tiles to add dirt to, then click
                                <span className="fakelink" style={{marginLeft:5}}
                                    onClick={()=>{
                                        setInteractionState('none');
                                        game.mapInteracter = null;
                                    }}
                                >Done</span><br />
                                Count: {b.buildList.length} tiles
                            </div>
                        )
                        default: return <div>Error: interactionState of {interactionState} is not valid.</div>
                    }
                },
                save: ()=> {
                    // Saves content relavent to this structure to the database
                    console.log('Dont forget the save method for Dirt Manager!');
                }
            };
            b.recipe = b.recipes[0];
            tile.structure = b.id;
            tile.modified = 1;
            return b;
        }
    }
}


