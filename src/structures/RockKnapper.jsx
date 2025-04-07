/*  RockKnapper.jsx
    Provides a structure to let players create their first tools. Rock Knapping is the art of hammering rocks together to shape rocks into tools. Many bloody fingers has become
    the byproduct of this field
    For the game Settlers & Warlords
*/

import React from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import { textureURL } from "../App.js";
import {game} from "../game.jsx";

export default function RockKnapper() {
    // Returns an object that can generate new Rock Knapper structures. The structure itself will require no assembly, but must be built on rocky surfaces, where rocks can
    // be found & used

    return {
        name: 'Rock Knapper',
        image: 'rockknapper.png',
        tooltip: 'Create your first tools',
        locked: 0,
        prereq: [],
        canBuild: (tile) => {
            // Returns an empty string if this structure can be built on the selected tile. Otherwise, it will return an error string to show to the user
            // To do: Determine all rock based tiles and update this function to only allow building on those tiles. We will also need to update GameDisplay()
            // to provide the error to the user
            return '';
        },
        create: (tile) => {
            let b = {
                name: 'Rock Knapper',
                desc: `Tools are critical to survival, and rocks are your first craftable tools. Rock knapping is the art of smashing rocks into the shapes you need.`,
                image: 'rockknapper.png',
                position: [tile.x, tile.y, tile.z],  // remember kids, this is an array, not an object. X is at position[0], not position.x
                size: [1,1,1],
                id: game.getNextStructureId(),
                workProgress: 0,
                workerAssigned: null,
                recipe: null,
                recipes: [
                    {
                        name: 'Craft Flint Knife',
                        workerTime: 20*8, // 8 seconds
                        toolsNeeded: [],
                        canAssign: ()=>true,
                        canWork: ()=> {
                            // Returns true if this task can currently be worked by a worker. This will determine when workers stop working here to find new work
                            let mytile = game.tiles[b.position[0]][b.position[1]][b.position[2]];
                            if(typeof(mytile)==='undefined') return false;
                            if(typeof(mytile.items)==='undefined') mytile.items = [];
                            return (mytile.items.reduce((carry,item)=>{
                                if(item.name==='Flint Knife') {
                                    carry++;
                                }
                                return carry;
                            }, 0)<5);
                        },
                        workLocation: (tile,position) => {
                            // Returns true if this location is suitable for completing this job

                            // The only valid location for this task is at the site
                            return (position[0]===b.position[0] && position[1]===b.position[1] && position[2]===b.position[2]);
                        },
                        doWork: () => {
                            // Returns true if the work here is complete
                            b.workProgress++;
                            if(b.workProgress<b.recipe.workerTime) return false;

                            // Get the tile so we can add an item here
                            let mytile = game.tiles[b.position[0]][b.position[1]][b.position[2]];
                            if(typeof(mytile)==='undefined') return;
                            if(typeof(mytile.items)==='undefined') mytile.items = [];
                            mytile.items.push(game.createItem('Flint Knife', {endurance:20*60, efficiency:1})); // 1 minute of usage
                            mytile.modified = 1;
                            b.workProgress = 0;

                            if(b.recipe.canWork()) return; // We can build another here
                            // If we can't, unassign the worker
                            b.workerAssigned.job = null;
                            b.workerAssigned = null;
                            // b.recipe is left alone here; we will run it some more later
                        },
                    },{
                        name: 'Craft Flint Stabber',
                        workerTime: 20*8, // 8 seconds
                        toolsNeeded: [],
                        canAssign: ()=>true,
                        canWork: ()=>{
                            // Returns true if this task can currently be worked by a worker.
                            let mytile = game.tiles[b.position[0]][b.position[1]][b.position[2]];
                            if(typeof(mytile)==='undefined') return false;
                            if(typeof(mytile.items)==='undefined') mytile.items = [];
                            return (mytile.items.reduce((carry,item)=>{
                                if(item.name==='Flint Stabber') {
                                    carry++;
                                }
                                return carry;
                            }, 0)<5);
                        },
                        workLocation: (tile,position) => {
                            // Returns true if this location is suitable for completing this job

                            // The only valid location for this task is at the site
                            return (position[0]===b.position[0] && position[1]===b.position[1] && position[2]===b.position[2]);
                        },
                        doWork: () => {
                            // Returns true if the work here is complete
                            b.workProgress++;
                            if(b.workProgress<b.recipe.workerTime) return false;

                            let mytile = game.tiles[b.position[0]][b.position[1]][b.position[2]];
                            if(typeof(mytile)==='undefined') return;
                            if(typeof(mytile.items)==='undefined') mytile.items = [];
                            mytile.items.push(game.createItem('Flint Stabber', {endurance:20*60, efficiency:1})); // 1 minute of usage
                            mytile.modified = 1;
                            b.workProgress = 0;

                            if(b.recipe.canWork()) return;
                            // Can't keep working here...
                            b.workerAssigned.job = null;
                            b.workerAssigned = null;
                        },
                    },{
                        name: 'Craft Flint Shovel',
                        workerTime: 20*20, // 20 seconds
                        toolsNeeded: [],
                        itemsNeeded: [
                            {name: 'Small Rope', qty: 1},
                            {name: 'Long Stick', qty: 1}
                        ],
                        canAssign: ()=>(game.unlockedItems.findIndex(i=>i==='Small Rope')!==-1),
                        canWork: ()=>{
                            // Returns true if a worker can do work here
                            let mytile = game.tiles[b.position[0]][b.position[1]][b.position[2]];
                            if(typeof(mytile.items)==='undefined') mytile.items=[];
                            // See if we have made more than enough items here
                            if(mytile.items.filter(i=>i.name==='Flint Shovel').length >= 5) return false;
                            // See that we have the ingredients needed
                            return b.recipe.itemsNeeded.every(l=>mytile.items.filter(i=>i.name===l.name).length>=l.qty);
                        },
                        workLocation: (tile,position)=>{
                            return (position[0]===b.position[0] && position[1]===b.position[1] && position[2]===b.position[2]);
                        },
                        doWork: ()=>{
                            b.workProgress++;
                            if(b.workProgress<b.recipe.workerTime) return false;

                            b.workProgress = 0;
                            let mytile = game.tiles[b.position[0]][b.position[1]][b.position[2]];

                            // Find and remove the items used here
                            let slot = mytile.items.findIndex(i=>i.name==='Small Rope');
                            if(slot===-1) {
                                console.log('Error: finished Flint Shovel but Small Rope is missing');
                                return;
                            }
                            mytile.items.splice(slot,1);
                            slot = mytile.items.findIndex(i=>i.name==='Long Stick');
                            if(slot===-1) {
                                console.log('Error: Finished Flint Shovel but Long Stick is missing');
                                return;
                            }
                            mytile.items.splice(slot,1);
                            mytile.items.push(game.createItem('Flint Shovel', {endurance:20*60*2, efficiency:1})); // 2 minutes of usage
                            mytile.modified = 1;

                            if(b.recipe.canWork()) return;
                            // Can't keep working here...
                            b.workerAssigned.job = null;
                            b.workerAssigned = null;
                        }
                    },{
                        name: 'Craft Flint Hatchet',
                        workerTime: 20*20, // 20 seconds
                        toolsNeeded: [],
                        itemsNeeded: [
                            {name: 'Small Rope', qty: 1},
                            {name: 'Short Stick', qty: 1}
                        ],
                        canAssign: ()=>(game.unlockedItems.findIndex(i=>i==='Small Rope')!==-1),
                        canWork: ()=>{
                            // Returns true if a worker can do work here
                            let mytile = game.tiles[b.position[0]][b.position[1]][b.position[2]];
                            if(typeof(mytile.items)==='undefined') mytile.items = [];
                            if(mytile.items.filter(i=>i.name==='Flint Hatchet').length>=5) return false;
                            return b.recipe.itemsNeeded.every(l=>mytile.items.filter(i=>i.name===l.name).length>=l.qty);
                        },
                        workLocation: (tile,position) => (b.position[0]===position[0] && b.position[1]===position[1] && b.position[2]===position[2]),
                        doWork: ()=>{
                            b.workProgress++;
                            if(b.workProgress<b.recipe.workerTime) return;
                            b.workProgress = 0;
                            let mytile = game.tiles[b.position[0]][b.position[1]][b.position[2]];
                            let slot = mytile.items.findIndex(i=>i.name==='Small Rope');
                            if(slot===-1) {
                                console.log('Error: finished Flint Hatchet but Small Rope is missing');
                                return;
                            }
                            mytile.items.splice(slot,1);
                            slot = mytile.items.findIndex(i=>i.name==='Short Stick');
                            if(slot===-1) {
                                console.log('Error: finished Flint Hatchet but Short Stick is missing');
                                return;
                            }
                            mytile.items.splice(slot,1);
                            mytile.items.push(game.createItem('Flint Hatchet', {endurance:20*60*2, efficiency:1.5})); // 2 minutes of usage
                            mytile.modified = 1;
                            if(b.recipe.canWork()) return;
                            b.workerAssigned.job = null;
                            b.workerAssigned = null;
                        }
                    },{
                        name: 'Craft Flint Spear',
                        workerTime: 20*20, // 20 seconds
                        toolsNeeded: [],
                        itemsNeeded: [{name: 'Small Rope', qty:1}, {name:'Long Stick', qty:1}],
                        canAssign: ()=>(game.unlockedItems.findIndex(i=>i==='Small Rope')!==-1),
                        canWork: ()=>{
                            let mytile = game.tiles[b.position[0]][b.position[1]][b.position[2]];
                            if(typeof(mytile.items)==='undefined') mytile.items = [];
                            if(mytile.items.filter(i=>i.name==='Flint Spear').length>=5) return false;
                            return b.recipe.itemsNeeded.every(l=>mytile.items.filter(i=>i.name===l.name).length>=l.qty);
                        },
                        workLocation: (tile,position) => (b.position[0]===position[0] && b.position[1]===position[1] && b.position[2]===position[2]),
                        doWork: ()=>{
                            b.workProgress++;
                            if(b.workProgress<b.recipe.workerTime) return;
                            b.workProgress = 0;
                            let mytile = game.tiles[b.position[0]][b.position[1]][b.position[2]];
                            let slot = mytile.items.findIndex(i=>i.name==='Small Rope');
                            if(slot===-1) {
                                console.log('Error: finished Flint Spear but Small Rope is missing');
                                return;
                            }
                            mytile.items.splice(slot,1);
                            slot = mytile.items.findIndex(i=>i.name==='Long Stick');
                            if(slot===-1) {
                                console.log('Error: finished Flint Spear but Long Stick is missing');
                                return;
                            }
                            mytile.item.splice(slot,1);
                            mytile.items.push(game.createItem('Flint Spear', {endurance:20*60, efficiency:1})); // 1 minute of usage
                            mytile.modified = 1;
                            if(b.recipe.canWork()) return;
                            b.workerAssigned.job = null;
                            b.workerAssigned = null;
                        }
                    },{
                        name: 'Craft Flint Scythe',
                        workerTime: 20*40, // 40 seconds
                        toolsNeeded: [],
                        itemsNeeded: [{name: 'Small Rope', qty:2}, {name:'Long Stick', qty:1}, {name:'Short Stick', qty:1}],
                        canAssign: ()=>(game.unlockedItems.findIndex(i=>i==='Small Rope')!==-1),
                        canWork: ()=>{
                            let mytile = game.tiles[b.position[0]][b.position[1]][b.position[2]];
                            if(typeof(mytile.items)==='undefined') mytile.items = [];
                            if(mytile.items.filter(i=>i.name==='Flint Scythe').length>=5) return false;
                            return b.recipe.itemsNeeded.every(l=>mytile.items.filter(i=>i.name===l.name).length>=l.qty);
                        },
                        workLocation: (tile,position) => (b.position[0]===position[0] && b.position[1]===position[1] && b.position[2]===position[2]),
                        doWork: ()=>{
                            b.workProgress++;
                            if(b.workProgress<b.recipe.workerTime) return;
                            b.workProgress=0;
                            let mytile = game.tiles[b.position[0]][b.position[1]][b.position[2]];
                            let slot = mytile.items.findIndex(i=>i.name==='Small Rope');
                            if(slot===-1) {
                                console.log('Error: finished Flint Scythe but Small Rope is missing');
                                return;
                            }
                            mytile.items.splice(slot,1);
                            slot = mytile.items.findIndex(i=>i.name==='Small Rope');
                            if(slot===-1) {
                                console.log('Error: finished Flint Scythe but second Small Rope is missing');
                                return;
                            }
                            mytile.items.splice(slot,1);
                            slot = mytile.items.findIndex(i=>i.name==='Long Stick');
                            if(slot===-1) {
                                console.log('Error: finished Flint Scythe but Long Stick is missing');
                                return;
                            }
                            mytile.items.splice(slot,1);
                            slot = mytile.items.findIndex(i=>i.name==='Short Stick');
                            if(slot===-1) {
                                console.log('Error: finished Flint Scythe but Short Stick is missing');
                                return;
                            }
                            mytile.items.splice(slot,1);
                            mytile.items.push(game.createItem('Flint Scythe', {endurance:20*60, efficiency:1})); // 1 minute of usage
                            mytile.modified = 1;
                            if(b.recipe.canWork()) return;
                            b.workerAssigned.job = null;
                            b.workerAssigned = null;
                        }
                    }
                ],
                Render: () => {
                    const texture = useLoader(TextureLoader, textureURL +"structures/rockknapper.png");
                    return (
                        <mesh position={[b.position[0], .1, b.position[2]]} rotation={[-Math.PI/2,0,0]}>
                            <planeGeometry args={[1,1]} />
                            <React.Suspense fallback={<meshPhongMaterial color={"orange"} />}>
                                <meshStandardMaterial map={texture} />
                            </React.Suspense>
                        </mesh>
                    );
                },
                // We don't need to show RightPanel here, since we are using the default right panel display
                // We also don't need a save function here either. Both workerProgress & recipe selected will already be saved with each structure
            };
            console.log('New structure id='+ b.id);
            //tile.structure = b.id;
            //tile.modified = 1; // We were originally going to apply 
            return b;
        }
    }
}
