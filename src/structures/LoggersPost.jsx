/*  LoggersPost.jsx
    Allows workers to collect wood items from trees in the surrounding area. This is the first structure that makes use of tools
    For the game Settlers & Warlords
*/

import React from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import { textureURL } from "../App.js";

import { DanCommon } from "../libs/DanCommon.js";
import {game} from "../game.jsx";

export default function LoggersPost() {
    // Returns an object that can generate new Loggers Post structures. The structure itself will require no assembly and can be placed anywhere. However, tools will need to
    // be given to the workers so they can perform their jobs

    return {
        name: 'Loggers Post',
        image: 'loggerspost.png',
        tooltip: 'Use tools to collect fresh wood',
        locked: 1, // Now is when we will need an unlockedItems array
        prereq: [['Flint Knife', 'Flint Stabber']],
        canBuild: (tile) => {
            // Returns an empty string if this structure can be built on the selected tile. Otherwise, it will return an error string to show to the user
            // This structure can be build anywhere (so far)
            return '';
        },
        create: (tile) => {
            let b = {
                name: 'Loggers Post',
                descr: 'Wood is a valuable asset for producing additional tools and many other things',
                image: 'loggerspost.png',
                position: [tile.x, tile.y, tile.z],
                size: [1,1,1],
                id: game.getNextStructureId(),
                workProgress: 0,
                workerAssigned: null,
                recipe: null,
                canGetItems: false,
                recipes: [
                    {
                        name: 'Get Twine from Aged Wood',
                        workerTime: 20*10, // 10 seconds
                        toolsNeeded: ['Flint Knife'], // Each job will need only one tool; we can choose any tool of what is available
                        canAssign: ()=>true,
                        canWork: ()=> {
                            // So long as there's wood to collect twine from, we should be able to continue working this job. However, we don't want workers to
                            // wonder too far away from the base (or this structure) to locate wood to clear
                            //return true;

                            // The problem here is that game.pathTo() is now an async function; I can't expect the calling function to wait for game.pathTo()
                            // to complete before responding.
                            // Instead, we should call this function upon recipe assignment, and then save the result. Then every time it is called, we
                            // will trigger another search, returning the previous result.
                            
                            // Actually, since we don't need to know the path to a valid location, we can use a more basic search.
                            // We will search a 11x3x11 area. If any tiles are missing of this area, they can be ignored... though we might try querying them in anyway
                            let passCount = 0;
                            let foundList = [];
                            for(let z=b.position[0]-10; z<b.position[0]+10; z++) {
                                for(let y=b.position[1]-1; y<b.position[1]+1; y++) {
                                    for(let x=b.position[2]-10; x<b.position[2]+10; x++) {
                                        if(
                                            typeof(game.tiles[z]) === 'undefined' ||
                                            typeof(game.tiles[z][y]) === 'undefined' ||
                                            typeof(game.tiles[z][y][x]) === 'undefined'
                                        ) {
                                            // Skip this for now; we won't worry about loading more tiles
                                            continue;
                                        }
                                        // Now, see if there is an items list here
                                        if(typeof(game.tiles[z][y][x].items)==='undefined') {
                                            continue;
                                        } 
                                        //if(passCount===0) console.log('Sample list: ', )
                                        if(game.tiles[z][y][x].items.some(i=>i.name==='Rotten Log')) {
                                            console.log('Found Rotten Log at ['+ x +','+ y +','+ z +']');
                                            return true;
                                        }
                                    }
                                }
                            }
                            return false;
                        },
                        workLocation: (tile,position)=>{
                            // Returns true if a worker can perform this work at the given location

                            // Unlike other tasks before this, work is not done at the structure's location. Instead, we need to find a place holding a rotten log
                            if(typeof(b.workerAssigned)!=='undefined' && b.workerAssigned.carrying.some(i=>i.name==='Bark Fibers')) {
                                if(b.position[0]===position[0] && b.position[1]===position[1] && b.position[2]===position[2]) return true;
                                return false;
                            }
                            // Unfortunately not all tiles has an items list. We'll check that first
                            if(typeof(tile.items)==='undefined') return false;
                            return tile.items.some(i=>i.name==='Rotten Log');
                        },
                        doWork: () => {
                            if(b.workerAssigned.spot[0]===b.position[0] &&
                               b.workerAssigned.spot[1]===b.position[1] &&
                               b.workerAssigned.spot[2]===b.position[2]
                            ) {
                                // This worker is at the building's site. Have them drop off the Bark Fibers they had collected
                                console.log(b.workerAssigned.carrying);
                                let mytile = game.tiles[b.position[0]][b.position[1]][b.position[2]];
                                for(let i=b.workerAssigned.carrying.length-1; i>=0; i--) {
                                    //console.log(b.workerAssigned.carrying[i].name);
                                    if(b.workerAssigned.carrying[i].name==='Bark Fibers') {
                                        if(typeof(mytile.items)==='undefined') mytile.items = [];
                                        mytile.items.push(b.workerAssigned.carrying[i]);
                                        b.workerAssigned.carrying.splice(i,1);
                                    }
                                }
                                mytile.modified = 1;
                                if(b.recipe.canWork()) return;

                                b.workerAssigned.job = null;
                                b.workerAssigned = null;
                                return;
                            }

                            if(b.workerAssigned.waitingForPath===true) return; // We are still waiting for a valid path
                            b.workProgress++;
                            if(b.workProgress<b.recipe.workerTime) return false;

                            
                            b.workProgress = 0;
                            let mytile = game.tiles[b.workerAssigned.spot[0]][b.workerAssigned.spot[1]][b.workerAssigned.spot[2]];
                            if(typeof(mytile.items)==='undefined') {
                                console.log('Error: Completed Get Twine from Aged Wood at tile without items list; wheres the Rotten Log?');
                                return;
                            }
                            console.log('There are '+ mytile.items.length +' things here [');
                            let slot = mytile.items.findIndex(item => item.name==='Rotten Log');
                            if(slot===-1) {
                                console.log('Error: Completed get Twine from Aged Wood where there is no Rotten Log');
                                return;
                            }
                            mytile.items.splice(slot,1); // delete the Rotten Log from this tile
                            mytile.items.push(game.createItem("Debarked Rotten Log", {}));
                            mytile.modified = 1;

                            // Give the worker the Bark Fibers, directly into their inventory
                            b.workerAssigned.carrying.push(
                                game.createItem('Bark Fibers', {}),
                                game.createItem('Bark Fibers', {}),
                                game.createItem('Bark Fibers', {})
                            );
                            // Have the worker return to the Loggers Post to unload these fibers. For that, we need a new path. Once the worker has a path, they won't do any more work
                            // until they have completed the path.
                            b.workerAssigned.waitingForPath = true;
                            game.pathTo(b.workerAssigned.spot[0], b.workerAssigned.spot[1], b.workerAssigned.spot[2], 100,
                                (tile,position) => {
                                    return (position[0]===b.position[0] && position[1]===b.position[1] && position[2]===b.position[2]);
                                }, (result) => {
                                    // On completion, finish setting up the worker
                                    b.workerAssigned.waitingForPath = false;
                                    if(result.result!=='success') {
                                        console.log('Error in pathfinding:', result);
                                    }else{
                                        b.workerAssigned.path = result.path;
                                    }
                                }
                            );
                        },
                        onComplete: (location)=>{
                            // The location that this job is done at should be at the user's location... so where-ever b.workerAssigned.spot is at
                            console.log('What is calling Get Bark Fibers->onComplete()?');
                            return;
                            if(b.workerAssigned===null) {
                                console.log('Error: Get Twine from Aged Wood completed without a worker assigned. No item added');
                                return;
                            }
                            let tile = game.tiles[b.workerAssigned.spot[0]][b.workerAssigned.spot[1]][b.workerAssigned.spot[2]];
                            if(typeof(tile.items)==='undefined') {
                                console.log("Error: Completed Get Twine from Aged Wood at tile without items list; where's the Rotten Log?");
                                return;
                            }
                            let slot = tile.items.findIndex(item => item.name === "Rotten Log");
                            if(slot===-1) {
                                console.log("Error: Completed Get Twine from Aged Wood where there is no Rotten Log");
                                return;
                            }
                            tile.items.splice(slot,1);
                            tile.items.push(
                                game.createItem("Debarked Rotten Log", {}),
                                game.createItem("Bark Fibers", {}),
                                game.createItem("Bark Fibers", {}),
                                game.createItem("Bark Fibers", {})
                            );
                            
                        }
                    },{
                        name: 'Cut Long Stick',
                        workerTime: 20*10, // 10 seconds
                        toolsNeeded: ['Flint Stabber'],
                        canAssign: ()=>true,
                        canWork: ()=>{
                            // Search around this building for a long stick that can be collected

                            // Our problem now is that any long stick that is already cut will also be found by this search. We need something different.
                            // Instead, all trees will contain 'Attached Long Stick' instead of normal 'Long Stick'.

                            for(let x=b.position[0]-10; x<b.position[0]+10; x++) {
                                for(let y=b.position[1]-1; y<b.position[1]+1; y++) {
                                    for(let z=b.position[2]-10; z<b.position[2]+10; z++) {
                                        if(typeof(game.tiles[x])==='undefined' ||
                                           typeof(game.tiles[x][y])==='undefined' ||
                                           typeof(game.tiles[x][y][z])==='undefined'
                                        ) continue; // Skip for now; don't worry about loading more tiles

                                        if(typeof(game.tiles[x][y][z].items)==='undefined') continue; // Also skip tiles without items
                                        if(game.tiles[x][y][z].items.some(i=>i.name==='Attached Long Stick')) return true;
                                    }
                                }
                            }
                            return false;
                        },
                        workLocation: (tile,position) => {
                            // Returns true if a worker can perform work at this tile location

                            // There are two possible targets for this worker. It will depend on if they are carrying a Long Stick or not
                            if(b.workerAssigned.carrying.some(i=>i.name==='Long Stick')) {
                                return (b.position[0]===position[0] && b.position[1]===position[1] && b.position[2]===position[2])
                            }else{
                                return (typeof(tile.items)!=='undefined' && tile.items.some(i=>i.name==='Attached Long Stick'));
                            }
                        },
                        doWork: () => {
                            if(b.workerAssigned.spot[0]===b.position[0] &&
                               b.workerAssigned.spot[1]===b.position[1] &&
                               b.workerAssigned.spot[2]===b.position[2]
                            ) {
                                // The worker is at the building. Have them drop off the stick here from its inventory
                                let mytile = game.tiles[b.position[0]][b.position[1]][b.position[2]];
                                let pack = DanCommon.arraySplit(b.workerAssigned.carrying, item=>{
                                    if(item.name==='Long Stick') return 'drop';
                                    return 'keep';
                                });
                                console.log(pack);
                                mytile.items.push(...pack.drop);
                                mytile.modified = 1;
                                b.workerAssigned.carrying = pack.keep;

                                // with this done, find more work to do
                                if(b.recipe.canWork()) return;

                                b.workerAssigned.job = null;
                                b.workerAssigned = null;
                                return;
                            }

                            if(b.workerAssigned.waitingForPath===true) return; // we are still waiting for a valid path for this worker
                            b.workProgress++;
                            if(b.workProgress<b.recipe.workerTime) return;

                            b.workProgress = 0;
                            let mytile = game.tiles[b.workerAssigned.spot[0]][b.workerAssigned.spot[1]][b.workerAssigned.spot[2]];
                            if(typeof(mytile.items)==='undefined') {
                                console.log("Error: Completed Cut Long Stick at tile without an items list; where's the Attached Long Stick?");
                                return;
                            }
                            // We only need one attached stick here
                            let slot = mytile.items.findIndex(i=>i.name==='Attached Long Stick');
                            if(slot===-1) {
                                console.log("Error: Completed Cut Long Stick where there is no Attached Long Stick");
                                return;
                            }
                            mytile.items.splice(slot,1);
                            mytile.modified = 1;
                            b.workerAssigned.carrying.push(game.createItem('Long Stick', {}));

                            // Have the worker return to the Loggers Post to unload the stick
                            b.workerAssigned.waitingForPath = true;
                            game.pathTo(b.workerAssigned.spot[0], b.workerAssigned.spot[1], b.workerAssigned.spot[2], 100,
                                (tile,position) => (position[0]===b.position[0] && position[1]===b.position[1] && position[2]===b.position[2]),
                                (result) => {
                                    b.workerAssigned.waitingForPath = false;
                                    if(result.result!=='success') {
                                        console.log('Error in pathfinding: ', result);
                                    }else{
                                        b.workerAssigned.path = result.path;
                                    }
                                }
                            );
                        }
                    },{
                        name: 'Cut Short Stick',
                        workerTime: 20*10, // 10 seconds
                        toolsNeeded: ['Flint Stabber'],
                        itemsNeeded: [{name:'Long Stick', qty:1}],
                        canAssign: ()=>game.unlockedItems.some(i=>i==='Long Stick'),
                        canWork: ()=> {
                            // Returns true if work can be done here.  We only need to determine if there is a Long Stick on this tile
                            let tile=game.tiles[b.position[0]][b.position[1]][b.position[2]];
                            if(typeof(tile.items)==='undefined') tile.items = [];
                            return (tile.items.some(i=>i.name==='Long Stick') &&
                                    tile.items.filter(i=>i.name==='Short Stick').length<5);
                        },
                        workLocation: (tile,position) => (b.position[0]===position[0] && b.position[1]===position[1] && b.position[2]===position[2]),
                        doWork: ()=> {
                            b.workProgress++;
                            if(b.workProgress<b.recipe.workerTime) return false;
                            b.workProgress = 0;
                            let mytile = game.tiles[b.position[0]][b.position[1]][b.position[2]];
                            let slot = mytile.items.findIndex(i=>i.name==='Long Stick');
                            if(slot===-1) {
                                console.log('Error: finished Cut Short Stick, but no Long Stick is here');
                                return;
                            }
                            mytile.items.splice(slot,1);
                            mytile.items.push(
                                game.createItem('Short Stick', {}),
                                game.createItem('Short Stick', {})
                            );
                            mytile.modified = 1;
                            if(b.recipe.canWork()) return;
                            b.workerAssigned.job = null;
                            b.workerAssigned = null;
                        }
                    }
                ],
                Render: () => {
                    const texture = useLoader(TextureLoader, textureURL +"structures/loggerspost.png");
                    return (
                        <mesh position={[b.position[0], .1, b.position[2]]} rotation={[-Math.PI/2,0,0]}>
                            <planeGeometry args={[1,1]} />
                            <React.Suspense fallback={<meshPhongMaterial color={"orange"} />}>
                                <meshStandardMaterial map={texture} />
                            </React.Suspense>
                        </mesh>
                    );
                }
                // This structure doesn't need a save method
            };
            tile.structure = b.id;
            tile.modified = 1;
            return b;
        }
    }
}