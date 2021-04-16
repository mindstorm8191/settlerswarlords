/*  block_foragepost.jsx
    For the Forage Post, the first food source for the colonists
    for the game Settlers & Warlords
*/

import React from "react";
import {imageURL } from "./App.js";
import { DanCommon } from "./DanCommon.js";
import {game} from "./game.jsx";
import {blockHasWorkerPriority} from "./blockHasWorkerPriority.jsx";

export function ForagePost(mapTile) {
    // Check that there are no other forage posts in this area
    if(game.blocks.some(e=>e.name==="Forage Post")) {
        console.log('There is already a forage post in this area');
        return 'cannotbuildmore';
    }
    let b = {
        //...blockHasWorkerPriority(),
        id: game.getNextBlockId(),
        name: "Forage Post",
        descr: `All around you is a world teeming with life - and food. It is there for the taking, you just have to find it.`,
        usage: `Collects edible foods from the surrounding environment.  Local supplies can only support up to 4 workers. Cannot place
                another one in this area`,
        image: imageURL+'foragepost.png',
        progressBar: 0,
        progressBarColor: 'orange',
        progressBarMax: 30,
        tileX: mapTile.x,
        tileY: mapTile.y,
        onhand: [],
        possibleOutputs: ()=>[], // This block has no inputs or outputs (at this time)
        willOutput: n=> false,
        hasItem: name => false,
        getItem: name => null,
        getItemFrom: list => null,
        willAccept: item=> false,
        takeItem: o=>false,
        update: ()=>{
            if(game.workPoints<=0) return;
            game.workPoints--;
            b.progressBar++;
            if(b.progressBar>=30) {
                b.onhand.push(game.createItem(
                    b.id,
                    DanCommon.getRandomFrom(['Apple', 'Berries', 'Tree Nuts', 'Mushrooms']),
                    'food', {lifetime: 300}
                ));
                b.progressBar = 0;
            }
        },
        SidePanel: props=>{
            const Priorities = b.ShowPriority;
            return <>
                <Priorities />
                <div>Progress: {parseInt((b.progressBar*100)/30)}%</div>
                <div>Food on hand: {b.onhand.length}</div>
            </>;
        },
        save: ()=>{
            // Saves this block's content to the server
            return {
                priority: b.priority,
                progress: b.progressBar,
                items: b.onhand,
            };
        },
        load: content => {
            // Sets this block up from the server's content
            b.priority    = parseInt(content.priority);
            b.progressBar = parseInt(content.progress);
            b.onhand      = content.items.map(ele=>{
                ele.id = parseInt(ele.id);
                return ele;
            });
        }
    }
    return Object.assign(b, blockHasWorkerPriority(b));
}