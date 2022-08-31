/*  ForagePost.jsx
    Code for the Forage Post, the first food source for a new colony
    For the game Settlers & Warlords
*/

import React from "react";
import {game} from "../game.jsx";


export function ForagePost(tile) {
    // Creates & returns a Forage Post block instance. This is the first source of food for new encampments.

    let b = {
        id: game.getNextBlockId(),
        x: tile.x,
        y: tile.y,
        name: 'Forage Post',
        descr: `All around you is a world teeming with life - and food. It is there for the taking, you just have to find it.`,
        usage: `Collects edible foods from the surrounding environment.  Local supplies can only support up to 4 workers. Cannot place
                another one in this area`,
        image: "foragepost.png",
        progressBar: 0, // I think we'll use this to show the amount of food available
        progressBarMax: 8,
        progressBarColor: 'green',
        blinkState:0,
        blinker:null,
        activeTasks: [],

        tasks: [
            {
                name:'Forage for Food',
                taskType: 'fetch item',  // fetching items only will become more prevalent when we have machines to process things
                canAssign:()=>{
                    // This can only be assigned to one person. See if we have an active task of the same type
                    return (b.activeTasks.findIndex(b=>b.task.name==='Forage for Food')===-1);
                },
                canAssist:false,
                hasQuantity:false,
                itemsNeeded:[],
                buildTime:0,
                getTask: (workerx, workery)=>{
                    // Here, we need to define a location for the worker to go. We want to find a block that is somewhere near the
                    // worker, so that they can check there.
                    let searchminx = Math.max(workerx-5, 0);
                    let searchmaxx = Math.min(workerx+5, 40);
                    let searchminy = Math.max(workery-5, 0);
                    let searchmaxy = Math.min(workery+5, 40);
                    let searchsizex = searchmaxx-searchminx;
                    let searchsizey = searchmaxy-searchminy;
                    let targetx = Math.floor(Math.random()*searchsizex) +searchminx;
                    let targety = Math.floor(Math.random()*searchsizey) +searchminy;
                    // There is a 1 in 5 chance that this venture will be successful
                    if(Math.floor(Math.random()*5)===0) {
                        // This trip will be successful. Go ahead and find the tile, and place a food item there for them to pick up
                        let tile = game.tiles.find(e=>e.x===targetx && e.y===targety);
                        if(typeof(tile)==='undefined') {
                            console.log('Error - tile not found at ['+ targetx +','+ targety +']');
                            return '';
                        }
                        tile.items.push({name:'Apple', amount:1});
                    }
                    // Now, return the object that gets applied to the worker
                    return {task:'fetchitem', targetx:targetx, targety:targety, targetitem:'Apple'};
                },
                onComplete: (worker)=>{
                    // Workers need to drop the item they're carrying at this block.
                    // Start by fetching the tile this structure is on
                    let tile = game.tiles.find(e=>e.x===b.x && e.y===b.y);
                    if(typeof(tile)==='undefined') {
                        console.log('Error: tile not found at ['+ b.x +','+ b.y +']');
                        return;
                    }
                    let slot = wo.carrying.findIndex(e=>e.name===wo.targetitem);
                    if(slot===-1) {
                        console.log(`Error: ${wo.name} tried to place an item, but not carrying it now. Item=${wo.targetitem}, carrying size=${wo.carrying.length}. Worker task cancelled`);
                        wo.assignedBlock = 0;
                        wo.task = '';
                        return wo;
                    }
                }
            }
        ],

        //update:()=>{}, ...I don't know of anything we need to do here with this just yet

        SidePanel: ()=> {
            // To see our inventory, we first need to grab the tile
            let tile = game.tiles.find(e=>e.x===b.x && e.y===b.y);
            if(typeof(tile)==='undefined') {
                return <>Error: Block's tile not found. Cannot access items</>;
            }
            return <>Food on hand: {tile.items.length}</>;
        }
    };
    return b;
}