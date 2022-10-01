/*  RockKnapper.jsx
    Code for the Rock Knapper, a way to create the firs tools
    For the game Settlers & Warlords
*/

import React from "react";
import {game} from "../game.jsx";

export function RockKnapper() {
    
    return {
        name: 'Rock Knapper',
        image: 'rockknapper.png',
        prereq: [],
        locked: 0,
        featuresUnlocked: false,
        newFeatures: ['Small Rope'],
        primary: true,
        create: (tile) => {
            
            // First, check the land type. This can only be built on barren rock
            if(tile.newlandtype===-1) {
                if(tile.landtype!==21) {
                    return 'wrong land type';
                }
            }else{
                if(tile.newlandtype!==21) {
                    // Both must be 21 or this won't work
                    return 'wrong land type';
                }
            }

            let b = {
                id: game.getNextBlockId(),
                x: tile.x,
                y: tile.y,
                name: 'Rock Knapper',
                descr: `Tools are critical to survival, and rocks are your first tool. Knapping is the art of smashing rocks into the shapes you need.`,
                usage: `Knapps rocks to craft tools. Knives or stabbers can be made without any parts. Other tools can be made using wood & twine`,
                image: "rockknapper.png",
                progressBar: 0,
                progressBarMax: 8,
                progressBarColor: 'green',
                blinkState:0,
                blinker:null,
                hasNewTasks: ['Small Rope'], // This determines when the block will highlight green when new features become available
                activeTasks: [],
                tasks: [
                    {
                        name: 'Craft Flint Knife',
                        taskType: 'craft on site',
                        canAssign: ()=>true,
                        canAssist: true,
                        hasQuantity: true,
                        itemsNeeded: [],
                        toolsNeeded: [],
                        buildTime: 20*20,
                        outputItems: ['Flint Knife'],
                        getTask: (worker) =>{
                            return {subtask:'workonsite', targetx:b.x, targety:b.y};
                        },
                        onProgress: ()=>{
                            // Allows context updates whenever progress is made on this task
                            if(typeof(b.blinker)==='function') {
                                b.blinkState++;
                                b.blinker(b.blinkState);
                            }
                        },
                        onComplete: (worker)=>{
                            // Add an item to this block's inventory
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            if(typeof(tile)==='undefined') {
                                console.log('Error in RockKnapper->tasks->Flint Knife->onComplete(): tile not found at '+ b.x +','+ b.y);
                                return;
                            }
                            if(typeof(tile.items)==='undefined') {
                                // This tile is missing an inventory... why not just add it now?
                                tile.items = [];
                            }
                            // Well, I was going to put all similar items together, but each one can have different endurance values & efficiency
                            // rates... it'll be better to keep each one separate
                            tile.items.push(game.createItem('Flint Knife', 'tool', {efficiency:1, endurance:100}));
                            // at 1 use per tick... that's about 5 seconds of use

                            if(typeof(b.blinker)==='function') {
                                b.blinkState++;
                                b.blinker(b.blinkState);
                            }
                        }
                    },{
                        name:'Craft Flint Stabber',
                        taskType: 'craft on site',
                        canAssign: ()=>true,
                        canAssist: true,
                        hasQuantity: true,
                        itemsNeeded: [],
                        toolsNeeded: [],
                        buildTime: 20*20,
                        outputItems: ['Flint Stabber'],
                        getTask: (worker) => {
                            return {subtask:'workonsite', targetx:b.x, targety:b.y};
                        },
                        onProgress: ()=>{
                            // Allows context updates whenever progress is made on this task
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        },
                        onComplete: ()=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            if(typeof(tile.items)==='undefined') tile.items = [];
                            tile.items.push(game.createItem('Flint Stabber', 'tool', {efficiency:1, endurance:20*60*3}));
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        }
                    }
                ],

                SidePanel: ()=> {
                    let tile = game.tiles.find(e=>e.x===b.x && e.y===b.y);
                    if(typeof(tile)==='undefined') {
                        return <>Error: Block's tile not found. Cannot access items</>;
                    }
                    return (
                        <>
                            <p className="singleline">Food on hand:</p>
                            {game.groupItems(tile.items).map((item,key)=>(
                                <p className="singleline" key={key} style={{marginLeft:5}}>{item.name} x{item.qty}</p>
                            ))}
                        </>
                    );
                }
            }
            return b;
        }
    }
}
