/*  DirtSource.jsx
    Provides a source of dirt from the ground, for a time
    For the game Settlers & Warlords
*/

import React from "react";
import { game } from "../game.jsx";

export function DirtSource() {
    return {
        name: 'Dirt Source',
        image: 'dirtsource.png',
        prereq: [['Flint Shovel']],
        locked: 1,
        featuresUnlocked: false,
        newFeatures: [],
        primary: false,
        create: (tile) => {
            // Create & return a Dirt Source structure instance

            if((parseInt(tile.newLandType)===-1 && tile.landType>4) || tile.newLandType>4) return 'wrong land type';

            let b = {
                id: game.getNextBlockId(),
                x: tile.x,
                y: tile.y,
                name: 'Dirt Source',
                descr: `Even the dirt you stand on has value to it. The first of its usefulness is acquiring clay`,
                usage: 'Once vegetation is cleared, dirt can be collected with ease',
                image: 'dirtsource.png',
                areaCleared: false,
                blinkState: 0,
                blinker: null,
                activeTasks: [],
                tasks: [
                    {
                        name: 'Clear Vegetation',
                        canAssign: ()=>!b.areaCleared,
                        canAssist: true,
                        hasQuantity: false,
                        userPicksLocation: false,
                        itemsNeeded: [],
                        toolsNeeded: ['Flint Shovel'],
                        buildTime: 20*60, // 1 minute
                        outputItems: [],
                        //getTask: (worker) => ({subtask:'workonsite', targetx:b.x, targety:b.y}),
                        create: ()=>{
                            let task = game.createTask({
                                building: b,
                                taskType: 'workAtBuilding',
                                targetx: b.x,
                                targety: b.y,
                                toolsNeeded: [{hasTool: false, tools: ['Flint Shovel']}],
                                ticksToComplete: 20*60
                            });
                            b.activeTasks.push(task);
                            return task;
                        },
                        onProgress: ()=>{
                            if(typeof(b.blinker)==='function') {
                                b.blinker(++b.blinkState);
                            }else{
                                console.log("b.blinker is not a function in DirtSource");
                            }
                        },
                        onComplete: ()=>{
                            b.areaCleared = true;
                            // Also clear out the items currently here
                            // ...actually, we only want to clear out vegetation items, everything else can stay
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                                tile.items = tile.items.filter(i=>{
                                    return !['Wheat', 'Wheat Seeds', 'Oat', 'Oat Seeds', 'Rye', 'Rye Seeds', 'Barley', 'Barley Seeds', 'Millet', 'Millet Seeds'].includes(i.name);
                                    // Not sure if this is the smartest way to clear vegetation, but don't know of a cleaner way
                                });
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        }
                    },{
                        name: 'Collect Dirt',
                        canAssign: ()=>b.areaCleared,
                        canAssist: false,
                        hasQuantity: false,
                        userPicksLocation: false,
                        itemsNeeded: [],
                        toolsNeeded: ['Flint Shovel'],
                        buildTime: 20*5, // 5 seconds
                        outputItems: ['Dirt Pile'],
                        //getTask: (worker) => ({subtask: 'workonsite', targetx:b.x, targety:b.y}),
                        create: ()=>{
                            let task = game.createTask({
                                building: b,
                                taskType: 'workAtBuilding',
                                targetx: b.x,
                                targety: b.y,
                                toolsNeeded: [{hasTool: false, tools: ['Flint Shovel']}],
                                ticksToComplete: 20*5
                            });
                            b.activeTasks.push(task);
                            return task;
                        },
                        onProgress: ()=>{
                            if(typeof(b.blinker)==='function') {
                                b.blinker(++b.blinkState);
                            }else{
                                console.log("b.blinker is not a function in DirtSource");
                            }
                        },
                        onComplete: ()=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            tile.items.push(game.createItem('Dirt Ball', 'item', {})); // about a pound of dirt
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
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
                            {game.groupItems(tile.items).map((item,key)=>(
                                <p className="singleline" key={key} style={{marginLeft:5}}>{item.name} x{item.qty}</p>
                            ))}
                        </>
                    );
                }
            };
            return b;
        }
    }
}