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
*/

import React from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import { textureURL } from "../App.js";

import { game } from "../game.jsx";

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
                pickupList: [],  // list of tile locations where dirt will be picked up from. Once these tiles are completed, they will be removed from the list
                dropoffList: [], // list of tile locations where dirt will be placed down at. Will be emptied as they get completed
                recipes: [
                    {
                        name: 'Move Dirt',
                        workerTime: 20, // 1 second to pick up dirt, 1 second to pack it down where it goes
                        toolsNeeded: ['Flint Shovel'],
                        canAssign: ()=>true, // This can be assigned at any time
                        canWork: ()=> {
                            // Returns true if there is work that workers can do

                            return (b.pickupList.length>0 && b.dropoffList.length>0);
                        },
                        workLocation: (tile,position) => {
                            // returns true if the given tile is suitable for work.

                            // We have a single worker assigned to this structure, and they can be reached by b.workerAssigned. We only need to determine if they are already carrying
                            // a unit of dirt.
                            if(typeof(b.workerAssigned)==='undefined') return false;
                            if(b.workerAssigned.carrying.some(i=>i.name==='Dirt Ball')) {
                                // This worker already has dirt. So, we need a drop-off location
                                return b.dropoffList.some(spot=>position[0]===spot[0] && position[1]===spot[1] && position[2]===spot[2]);
                            }else{
                                // This worker has no dirt. Find a tile to collect dirt from
                                return b.pickupList.some(spot=>position[0]===spot[0] && position[1]===spot[1] && position[2]===spot[2]);
                            }
                        },
                        doWork: ()=>{
                            // Lets workers perform actions at the given tile
                            
                            // Determine if this worker is at a pickup location or dropoff location
                            if(b.workerAssigned.carrying.some(i=>i.name==='Dirt Ball')) {
                                // Verify this is a drop-off location
                                if(!b.dropoffList.some(spot=>spot[0]===b.workerAssigned.spot[0] && spot[1]===b.workerAssigned.spot[1] && spot[2]===b.workerAssigned.spot[2])) {
                                    console.log('Error in DirtManager->doWork(): Worker location for dropoff doesnt match dropoffList');
                                    return;
                                }

                                b.workProgress++;
                                if(b.workProgress<b.recipe.workerTime) return;

                                b.workProgress = 0;
                                let mytile = game.tiles[b.workerAssigned.spot[0]][b.workerAssigned.spot[1]][b.workerAssigned.spot[2]];
                                if(typeof(mytile)==='undefined') {
                                    console.log('Error in DirtManager->doWork: Did not find tile where player is at (for dropoff)');
                                    return;
                                }
                                if(typeof(mytile.items)==='undefined') mytile.items = [];
                                let slot = b.workerAssigned.carrying.findIndex(i=>i.name==='Dirt Ball');
                                mytile.items.push(b.workerAssigned.carrying.splice(slot,1)[0]);
                                if(mytile.items.filter(i=>i.name==='Dirt Ball').length<5) {
                                    // We don't need to continue below. But we do need to determine if this worker can continue working here
                                    if(!b.recipe.canWork()) {
                                        b.workerAssigned.job = null;
                                        b.workerAssigned = null;
                                    }
                                    return;
                                }

                                // We are ready to convert this tile to an up-slope.
                                // Under normal circumstances, this will become a bump-up tile
                                // Remove the 5 dirt balls from this tile
                                let toRemove = 5;
                                mytile.items = mytile.items.filter(i=>{
                                    if(i.name==='Dirt Ball' && toRemove>0) {
                                        toRemove--;
                                        return false;
                                    }
                                    return true;
                                });
                                // Add the slope to the tile here
                                mytile.slope = 1;

                                // We also need to add a slope value to the tile above this one

                                // Remove this tile from the DropOff List
                                let targetSlot = b.dropoffList.findIndex(spot=>spot[0]===b.workerAssigned.spot[0] && spot[1]===b.workerAssigned.spot[1] && spot[2]===b.workerAssigned.spot[2]);
                                b.dropoffList.splice(targetSlot,1);

                                // With that done, determine if we can stop working here
                                if(!b.recipe.canWork()) {
                                    b.workerAssigned.job = null;
                                    b.workerAssigned = null;
                                }
                            }else{
                                // Verify this pickup location
                                if(!b.pickupList.some(spot=>spot[0]===b.workerAssigned.spot[0] && spot[1]===b.workerAssigned.spot[1] && spot[2]===b.workerAssigned.spot[2])) {
                                    console.log('Error in DirtManager->doWork(): Worker location for pickup doesnt match pickupList');
                                    return;
                                }

                                b.workProgress++;
                                if(b.workProgress<b.recipe.workerTime) return;
                                b.workProgress = 0;

                                let mytile = game.tiles[b.workerAssigned.spot[0]][b.workerAssigned.spot[1]][b.workerAssigned.spot[2]];
                                if(typeof(mytile)==='undefined') {
                                    console.log('Error in DirtManager->doWork(): Did not find tile where player is at (for pickup)');
                                    return;
                                }
                                if(typeof(mytile.items)==='undefined') mytile.items = [];
                                mytile.items.push({name:'Removed Dirt'}); // We don't need to include Removed Dirt in the Unlocked Items list
                                b.workerAssigned.carrying.push(game.createItem('Dirt Ball', {}));

                                // If there are 5 Removed Dirts here, we can turn it into a down-slope
                                if(mytile.items.filter(i=>i.name==='Removed Dirt').length<5) return;

                                // We are ready to convert this to a down-slope
                                let toRemove = 5;
                                mytile.items = mytile.items.filter(i=>{
                                    if(i.name==='Removed Dirt') {
                                        toRemove--;
                                        return false;
                                    }
                                    return true;
                                });
                                mytile.slope = -1;
                                // Remove this tile from the PickUp List
                                let targetSlot = b.pickupList.findIndex(spot=>spot[0]===b.workerAssigned.spot[0] && spot[1]===b.workerAssigned.spot[1] && spot[2]===b.workerAssigned.spot[2]);
                                b.pickupList.splice(targetSlot, 1);
                            }
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
                                Pickup: {b.pickupList.length} unfilled
                                <span className="fakelink" style={{marginBottom:10, marginLeft:5}}
                                    onClick={()=>{
                                        setInteractionState('pickup');
                                        game.mapInteracter = (event, tile) => {
                                            //console.log(tile);
                                            b.pickupList.push([tile.x,tile.y,tile.z]);
                                            //game.mapInteracter = null;
                                            //setInteractionState('none')
                                        };
                                    }}
                                >
                                    Pick Dig Sites
                                </span><br />
                                Dropoff: {b.dropoffList.length} unfilled
                                <span className="fakelink" style={{marginBottom:10, marginLeft:5}}
                                    onClick={()=>{
                                        setInteractionState('dropoff');
                                        game.mapInteracter = (event,tile) => {
                                            b.dropoffList.push([tile.x,tile.y,tile.z]);
                                        };
                                    }}
                                >
                                    Pick Dump Sites
                                </span>
                            </div>
                        );
                        case 'pickup': return (
                            <div>
                                Select map tiles to remove dirt from, then click
                                <span className="fakelink" style={{marginLeft:5}}
                                    onClick={()=> {
                                        setInteractionState('none');
                                        game.mapInteracter = null;
                                    }}
                                >
                                    Done
                                </span><br />
                                Count: {b.pickupList.length} tiles
                            </div>
                        );
                        case 'dropoff': return (
                            <div>
                                Select map tiles to add dirt to, then click
                                <span className="fakelink" style={{marginLeft:5}}
                                    onClick={()=>{
                                        setInteractionState('none');
                                        game.mapInteracter = null;
                                    }}
                                >Done</span><br />
                                Count: {b.dropoffList.length} tiles
                            </div>
                        );
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

