/*  block_firewoodMaker.jsx
    Collects loose firewood from forest areas, to burn in fires
    For the game Settlers & Warlords
*/

import React from "react";
import {imageURL} from "./App.js";
import {game} from "./game.jsx";
import {DanCommon} from "./DanCommon.js";
import {blockHasWorkerPriority} from "./blockHasWorkerPriority.jsx";
import {blockHasMultipleOutputs} from "./blockHasMultipleOutputs.jsx";
import {blockSharesOutputs} from "./blockSharesOutputs.jsx";

export function FirewoodMaker(mapTile) {
    if(mapTile.landtype!==1) return 'wronglandtype';
    
    let b = {
        id: game.getNextBlockId(),
        name: "Firewood Maker",
        descr: `Freshly cut trees don't burn well, as it's too wet. Forests generate fallen wood, just not a lot of it.`,
        usage: `Collects usable firewood from surrounding forests, for use in campfires and other fire-using blocks. Forest areas may build 5
                of these, non-forest areas only 1. Must be placed in forest areas`,
        image: imageURL +'firewoodMaker.png',
        progressBar: 0,
        progressBarColor: 'orange',
        progressBarMax: 10,
        tileX: parseInt(mapTile.x),
        tileY: parseInt(mapTile.y),
        onhand: [],
        possibleOutputs: ()=>['Small Firewood', 'Medium Firewood', 'Large Firewood'],
        willAccept: item=>false, // this block doesn't have any inputs
        takeItem: item=>false,
        fetchItem: itemId=>{
            let item = b.onhand.find(i=>i.id===itemId);
            if(typeof(item)==='undefined') return null;
            return item;
        },
        destroyItem: itemId=>{
            let slot = b.onhand.findIndex(e=>e.id===itemId);
            if(slot===-1) return false;
            b.onhand.splice(slot,1);    // We can leave Game to delete the item, since all they need is the id
            return true;
        },
        update: ()=>{
            // Handles updating this block
            if(game.workPoints<=0) return; // No workers available for this
            if(b.onhand.length>5) return;  // No space left
            game.workPoints--;
            b.progressBar++;
            if(b.progressBar>=10) {
                b.onhand.push(game.createItem(
                    b.id,
                    DanCommon.getRandomFrom(['Small Firewood', 'Medium Firewood', 'Large Firewood']),
                    'item'
                ));
                b.progressBar = 0;
            }
        },
        SidePanel: ()=>{
            const Priority = b.ShowPriority;
            const Outputs  = b.ShowOutputs;
            return <>
                <Priority/>
                <p className="singleline">Progress: {Math.floor((b.progressBar/25)*100)}%</p>
                <Outputs />
            </>;
        },
        save: ()=>{
            return {
                priority: b.priority,
                progress: b.progressBar,
                items: b.onhand
            };
        },
        load: content => {
            b.priority    = parseInt(content.priority);
            b.progressBar = parseInt(content.progress);
            b.onhand      = content.items.map(e=> {
                e.id = parseInt(e.id);
                return e;
            });
        }
    }
    return Object.assign(b, blockHasWorkerPriority(b), blockHasMultipleOutputs(b), blockSharesOutputs(b));
}