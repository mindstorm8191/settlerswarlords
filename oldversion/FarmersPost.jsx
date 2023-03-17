/*  Farmers Post
    Code for the Farmers Post, a workshop to manage farms and plains lands
    For the game Settlers & Warlords
*/

import React from "react";
import {game} from "../game.jsx";
import { minimapTiles } from "../minimapTiles.js";

const wildGrasses = ["Wheat Grass", "Oat Grass", "Rye Grass", "Barley Grass", "Millet Grass"];

export function FarmersPost() {
    return {
        name: 'Farmers Post',
        image: 'farmerspost.png',
        prereq: [['Flint Scythe']],
        locked: 1,
        featuresUnlocked: false,
        newFeatures: [],
        primary: false,
        create: (tile) => {
            // Create & return a structure instance
            let b = {
                id: game.getNextBlockId(),
                x: tile.x,
                y: tile.y,
                name: 'Farmers Post',
                descr: `Edible plants are everywhere, but in the wild, they don't grow in enough places to be a reliable food supply. Farming
                allows humans to cultivate crops on a larger scale, supporting more people.`,
                usage: 'Clear & plow some land, then plant seeds and wait for them to grow',
                image: 'farmerspost.png',
                blinkState: 0,
                blinker: null,
                activeTasks: [],
                tasks: [
                    {
                        name: 'Harvest Grasses',
                        canAssign: ()=>true,
                        canAssist: true,
                        hasQuantity: false,
                        userPicksLocation: true,
                        validLocations: tile=>{
                            // returns true of the work can be done on this tile
                            // Basically any tile with wild grasses is suitable
                            return tile.items.some(i=>wildGrasses.includes(i.name));
                        },
                        itemsNeeded: [],
                        toolsNeeded: ['Flint Scythe'],
                        buildTime: 20*60,
                        outputItems: wildGrasses, // We need a list of names, and this does it (for now)
                        create: ()=>{
                            let task = game.createTask({
                                building: b,
                                task: b.tasks.find(t=>t.name==='Harvest Grasses'),
                                taskType: 'workAtLocation',
                                toolsNeeded: [{hasTool: false, tools: ['Flint Scythe'], selected:null}],
                                ticksToComplete: 20*60*2 // 2 minutes to clear the whole tile
                            });
                            b.activeTasks.push(task);
                            return task;
                        },
                        findLocation: (worker) => {
                            // any tile with wild grasses growing will do for this
                            const [x,y,item] = game.findItemFromList(worker.x, worker.y, wildGrasses, true, worker.tasks[0]);
                            if(x===-1) {
                                return {result: 'fail', message: 'There is no grasses left to harvest'};
                            }
                            return {result:'pass', x:x, y:y, item:item};
                        },
                        onProgress: ()=>{
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        },
                        onComplete: worker => {
                            let tile = game.tiles.find(t=>t.x===worker.x && t.y===worker.y);
                            let slot = tile.items.findIndex(i=>wildGrasses.includes(i.name));
                            if(slot===-1) {
                                console.log('Couldnt find grasses to remove here. Task cancelled');
                                return;
                            }
                            // The output is dependent on the type of grass we have
                            let inName = tile.items[slot].name;
                            let outName = '';
                            switch(inName) {
                                case 'Wheat Grass':  outName = 'Cut Wheat';  break;
                                case 'Oat Grass':    outName = 'Cut Oat';    break;
                                case 'Rye Grass':    outName = 'Cut Rye';    break;
                                case 'Barley Grass': outName = 'Cut Barley'; break;
                                case 'Millet Grass': outName = 'Cut Millet'; break;
                                default:
                                    console.log('Grass type of '+ tile.items[slot].name +' not handled. Task cancelled');
                                    return;
                            }
                            // Now we can delete the existing grass item. We need to find & remove all entries of this crop, while also
                            // tracking how many we removed.
                            let removedCount = 0;
                            tile.items = tile.items.filter(i=>{
                                if(i.name===inName) {
                                    removedCount++;
                                    return false;
                                }
                                return true;
                            });
                            for(let i=0;i<removedCount; i++) {
                                tile.items.push(game.createItem(outName, 'item', {}));
                            }
                            // With the tile cleared of grass (except for what's loose now), we can change the tile type for this
                            tile.newlandtype = minimapTiles.find(m=>m.name==='Grass').id;
                            tile.modified = true;
                        }
                    },{
                        name: 'Separate Grain From Grass',
                        canAssign: ()=>game.unlockedItems.some(i=>['Cut Wheat', 'Cut Oat', 'Cut Rye', 'Cut Barley', 'Cut Millet'].includes(i)),
                        canAssist: true,
                        hasQuantity: true,
                        userPicksLocation: false,
                        itemsNeeded: [], // umm, not sure how to fill this column out. It can use any of 5 options - but only needs one, not all
                        toolsNeeded: ['Flint Knife'],
                        buildTime: 20*20,
                        outputItems: ['Straw', 'Grain'], // this is also hard to quanity, since there will be 5 grain types
                        create: ()=>{
                            let task = game.createTask({
                                building: b,
                                task: b.tasks.find(t=>t.name==='Separate Grain From Grass'),
                                taskType: 'workAtBuilding',
                                toolsNeeded: [{hasTool: false, tools: ['Flint Knife'], selected:null}],
                                ticksToComplete: 20*20
                            });
                            b.activeTasks.push(task);
                            return task;
                        },
                        onProgress: ()=>{
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        },
                        onComplete: worker => {
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            // find a suitable grass type to cut
                            let slot = tile.items.findIndex(i=>['Cut Wheat', 'Cut Oat', 'Cut Rye', 'Cut Barley', 'Cut Millet'].includes(i.name));
                            // ... this isn't going to work, because we never know what item to bring to the building
                        }
                    }
                ],
                SidePanel: ()=>{
                    let tile = game.tiles.find(e=>e.x===b.x && e.y===b.y);
                    if(typeof(tile)==='undefined') {
                        return <>Error: Block's tile not found. Cannot access items</>;
                    }
                    return (
                        <>
                            <p className="singleline">Items on hand:</p>
                            {game.groupItems(tile.items).map((item, key)=>{
                                <p className="singleline" key={key} style={{marginLeft:5}}>{item.name} x{item.qty}</p>
                            })}
                        </>
                    );
                },
                onSave: ()=>{
                    return {
                        id: b.id,
                        name: 'Farmers Post',
                        x: b.x,
                        y: b.y,
                        activeTasks: b.activeTasks.map(t=>t.id)
                    };
                },
                onLoad: pack =>{
                    b.id = pack.id;
                    b.activeTasks = pack.activeTasks;
                }
            };
            return b;
        }
    }
}
