/*  RopeMaker.jsx
    Handles the Rope Maker structure, that creates & melds ropes
    For the game Settlers & Warlords
*/

import React from "react";
import { game } from "../game.jsx";

export function RopeMaker() {
    return {
        name: 'Rope Maker',
        image: 'ropemaker.png',
        prereq: [['Twine Strips']],
        locked: 1,
        featuresUnlocked: false,
        newFeatures: [],
        primary: true,
        create: (tile) => {
            // Create & return a Rope Maker structure instance
            let b = {
                id:game.getNextBlockId(),
                x: tile.x,
                y: tile.y,
                name: 'Rope Maker',
                descr: `Rope is an essential tool, providing hundreds of potential uses to get things done. It has been used for thousands of years,
                        and is still in use today. Your early rope sources will be limited, and large ropes will be costly, but some tasks cannot be done
                        without it. Crafting rope does not require tools, but can go much faster with them.`,
                usage: `Collect twine from fallen trees, then turn it into a length of rope. Rope strength can be doubled by halving its length`,
                image: 'ropemaker.png',
                progressBar: 0,
                progressBarMax: 20,
                progressBarColor: 'green',
                blinkState: 0,
                blinker:null,
                activeTasks: [],
                tasks: [
                    {
                        name: 'Craft Rope from Raw Twine',
                        taskType: 'workAtBuilding',
                        canAssign: ()=>true, // this building doesn't unlock until we have raw twine anyway
                        canAssist: true,
                        hasQuantity: true,
                        userPicksLocation: false,
                        itemsNeeded: [
                            {name: 'Twine Strips', qty: 1, hasItem:false}
                        ],
                        toolsNeeded: [],
                        buildTime: 20*60*1, // 1 minute
                        outputItems: ['Small Rope'],  // about 1 foot of 5 pound rope
                        create: ()=>{
                            let task = game.createTask({
                                building: b,
                                task: b.tasks.find(t=>t.name==='Craft Rope from Raw Twine'),
                                taskType: 'workAtBuilding',
                                targetx: b.x,
                                targety: b.y,
                                itemsNeeded: [{name: 'Twine Strips', qty: 1, hasItem:false}],
                                ticksToComplete: 20*60 // 1 minute
                            });
                            /*let task = {
                                building: b,
                                task: b.tasks.find(t=>t.name==='Craft Rope from Raw Twine'),
                                taskType: 'workAtBuilding',
                                worker: null,
                                status: 'unassigned',
                                targetx: b.x,
                                targety: b.y,
                                itemsNeeded: [{name: 'Twine Strips', qty: 1, hasItem:false}],
                                toolsNeeded: [],
                                progress: 0,
                                ticksToComplete: 20*61*1,
                                skillsNeeded: []
                            };*/
                            b.activeTasks.push(task);
                            //game.tasks.push(task);
                            return task;
                        },
                        /*getTask: worker => {
                            // Locate some twine strips
                            const [targetx, targety] = game.findItem(worker.x, worker.y, 'Twine Strips', true);
                            if(targetx===-1 && targety===-1) return {subtask: 'workonsite'};
                            return {subtask: 'workonsite', targetx:b.x, targety:b.y};
                        },*/
                        onProgress: ()=>{
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        },
                        onComplete: worker=>{
                            if(game.tutorialModes[game.tutorialState].name==='rope2') game.advanceTutorial();
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            // delete the twine strips
                            let slot = tile.items.findIndex(i=>i.name==='Twine Strips');
                            if(slot===-1) {
                                console.log('Created Small Rope, but couldnt delete Twine Strips');
                            }else{
                                tile.items.splice(slot, 1);
                            }
                            // create the rope!
                            tile.items.push(game.createItem("Small Rope", 'item', {}));
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
    };
}


