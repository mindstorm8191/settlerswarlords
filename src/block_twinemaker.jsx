/*  block_twinemaker.jsx
    Collects bark from select trees, turning it into twine, to be used as an early rope
    For the game Settlers & Warlords
*/

import React from "react";
import {imageURL } from "./App.js";
import {game} from "./game.jsx";
import {blockHasWorkerPriority} from "./blockHasWorkerPriority.jsx";
import {blockRequiresTools} from "./blockRequiresTools.jsx";

export function TwineMaker(mapTile) {
    if(mapTile.landtype!==1) return 'wronglandtype';

    let b = {
        id: game.getNextBlockId(),
        name: "Twine Maker",
        descr: `Rope is an essential tool for survival, providing hundreds of potential uses to get things done. Twine isn't a very
                effective rope, but it is available, and will do for now.`,
        usage: `Produces twine from bark and vines in the forest`,
        image: imageURL +'twinemaker.png',
        progressBar: 0,
        progressBarColor: 'blue',
        progressBarMax: 20,
        tileX: mapTile.x,
        tileY: mapTile.y,
        onhand: [],
        toolGroups: [
            {group:'knife', options: ['Flint Knife'], required:true, selected:'', loaded:null}
        ],
        
        hasItem: nameList => {
            // Returns true if this block can output an item in the names list
            return nameList.some(name => b.onhand.some(item=>item.name===name));
        },
        getItem: name => {
            // Returns an item, removing it from this inventory. If the item is not found, this returns null
            let slot = b.onhand.findIndex(item => item.name===name);
            if(slot===-1) return null;
            return b.onhand.splice(slot, 1)[0]; // splice provides an array of the extracted elements; we only need the one
        },
        getItemFrom: namesList => {
            // Returns any item in the names list, if it is here
            let slot = b.onhand.find(item => namesList.includes(item.name));
            if(slot===-1) return null;
            return b.onhand.splice(slot, 1)[0];
        },
        update: ()=>{
            if(!b.checkTools()) return; // No tool loaded here (yet)
            if(b.onhand.length>=5) return; // We can only hold 5 finished items
            if(game.workPoints<=0) return; // Nobody available to do work here
            game.workPoints--;
            b.useTools();
            b.progressBar++;
            if(b.progressBar>=20) {
                b.onhand.push(game.createItem(b, 'Twine', 'item', {}));
                b.progressBar = 0;
            }
        },
        SidePanel: ()=>{
            const Priority = b.ShowPriority;
            const Tools = b.ShowTools;
            return (
                <>
                    <Priority />
                    <p className="singleline">Items on hand: {b.onhand.length===0?'nothing':'Twine x'+ b.onhand.length}</p>
                    <Tools />
                </>
            );
        }
    };
    return Object.assign(b, blockHasWorkerPriority(b), blockRequiresTools(b));
}