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
                outputItems: ['Apple'],
                getTask: (worker)=>{
                    // Here, we need to define a location for the worker to go. We want to find a block that is somewhere near the
                    // worker, so that they can check there.
                    let targetx=b.x;
                    let targety=b.y;
                    while(targetx===b.x && targety===b.y) {
                        let searchminx = Math.max(worker.x-5, 0);
                        let searchmaxx = Math.min(worker.x+5, 40);
                        let searchminy = Math.max(worker.y-5, 0);
                        let searchmaxy = Math.min(worker.y+5, 40);
                        //console.log(`Search zone: [${searchminx}-${searchmaxx},${searchminy}-${searchmaxy}]`);
                        let searchsizex = searchmaxx-searchminx;
                        let searchsizey = searchmaxy-searchminy;
                        targetx = Math.floor(Math.random()*searchsizex) +searchminx;
                        targety = Math.floor(Math.random()*searchsizey) +searchminy;
                    }
                    // There is a 1 in 5 chance that this venture will be successful
                    if(Math.floor(Math.random()*5)===0) {
                        // This trip will be successful. Go ahead and find the tile, and place a food item there for them to pick up
                        let tile = game.tiles.find(e=>e.x===targetx && e.y===targety);
                        if(typeof(tile)==='undefined') {
                            console.log('Error - tile not found at ['+ targetx +','+ targety +']');
                            return '';
                        }
                        tile.items.push(game.createItem('Apple', 'food', {}));
                    }
                    // Now, return the object that gets applied to the worker
                    return {subtask:'fetchitem', targetx:targetx, targety:targety, targetitem:'Apple'};
                },
                onProgress: ()=>{
                    // Allows context updates whenever progress is made on this task
                    if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                },
                onComplete: (worker)=>{
                    // Workers need to drop the item they're carrying at this block.
                    // Start by fetching the tile this structure is on
                    let tile = game.tiles.find(e=>e.x===b.x && e.y===b.y);
                    if(typeof(tile)==='undefined') {
                        console.log('Error: tile not found at ['+ b.x +','+ b.y +']. This should be the Forage Post tile.');
                        return;
                    }
                    let slot = worker.carrying.findIndex(e=>e.name===worker.targetitem);
                    if(slot===-1) {
                        console.log(`Error: ${worker.name} tried to place an item, but not carrying it now. Item=${worker.targetitem}, carrying size=${worker.carrying.length}. Worker task cancelled`);
                        worker.clearTask()
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
            return (
                <>
                    <p className="singleline">Food on hand:</p>
                    {game.groupItems(tile.items).map((item,key)=>(
                        <p className="singleline" key={key} style={{marginLeft:5}}>{item.name} x{item.qty}</p>
                    ))}
                </>
            );
        },

        groupItems: ()=>{
            // takes the block's items list, and groups all items by type
            // Returns the completed groupings as an array

            let tile = game.tiles.find(e=>e.x===b.x && e.y===b.y);
            let list = [];
            for(let i=0; i<tile.items.length; i++) {
                let slot = list.findIndex(l=>l.name===tile.items[i].name);
                if(slot===-1) {
                    list.push({name:tile.items[i].name, qty:tile.items[i].amount || 1});
                }else{
                    list[slot].qty += tile.items[i].amount || 1;
                }
            }
            return list;
        }
    };
    return b;
}


