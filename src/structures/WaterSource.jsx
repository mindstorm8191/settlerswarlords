/*  WaterSource.jsx
    Allows water to be provided, for multiple purposes
    For the game Settlers & Warlords
*/

import React from "react";
import { game } from "../game.jsx";

export function WaterSource() {
    return {
        name: 'Water Source',
        image: 'watersource.png',
        prereq: [['Wooden Bucket']],
        locked: 1,
        featuresUnlocked: false,
        newFeatures: [], // we might use this later... dunno
        primary: false,
        create: tile => {
            // Water tiles are #23 & #27
            if(parseInt(tile.newLandType)===-1) {
                if(tile.landType!==23 && tile.landType!==27) {
                    return 'wrong land type';
                }
            }else{
                if(tile.newLandType!==23 && tile.newLandType!==27) {
                    return 'wrong land type';
                }
            }

            let b = {
                id: game.getNextBlockId(),
                x: tile.x,
                y: tile.y,
                name: 'Water Source',
                descr: `Water has a great many uses, even in early tech.`,
                usage: 'Provide liquid storage items to fill with water.',
                image: 'watersource.png',
                blinkState: 0,
                blinker: null,
                activeTasks: [],
                tasks: [
                    {
                        name: 'Fill Wooden Bucket',
                        canAssign: ()=>true,
                        canAssist: true,
                        hasQuantity: true,
                        userPicksLocation: false,
                        itemsNeeded: ['Wooden Bucket'],
                        buildTime: 5, // 1/4 second
                        outputItems: ['Water Wooden Bucket'],
                        create: ()=>{
                            let task = game.createTask({
                                building: b,
                                task: b.tasks.find(t=>t.name==='Fill Wooden Bucket'),
                                taskType: 'workAtBuilding',
                                itemsNeeded: [{name: 'Wooden Bucket', qty:1, hasItem:false}],
                                ticksToComplete: 5
                            });
                            b.activeTasks.push(task);
                            return task;
                        },
                        onProgress: ()=>{
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        },
                        onComplete: worker=>{
                            // Replace the bucket with a water-filled bucket
                            let tile = game.tiles.find(t=>t.x===worker.x && t.y===worker.y);
                            let slot = tile.items.findIndex(i=>i.name==='Wooden Bucket');
                            if(slot===-1) {
                                console.log('Error in WaterSource: could not find wooden bucket');
                                return;
                            }
                            tile.items.splice(slot,1);
                            tile.items.push(game.createItem('Water Wooden Bowl', 'item', {}));
                            tile.modified = true;
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
                },
                onSave: ()=> {
                    return {
                        id: b.id,
                        name: "Water Source",
                        x: b.x,
                        y: b.y,
                        activeTasks: b.activeTasks.map(t=>t.id)
                    };
                }
            }
        }
    };
}