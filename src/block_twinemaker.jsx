/*  block_twinemaker.jsx
    Collects bark from select trees, turning it into twine, to be used as an early rope
    For the game Settlers & Warlords
*/

import React from "react";
import {imageURL } from "./App.js";
import {ClickableLabel} from "./comp_localMap.jsx";
import {game} from "./game.jsx";
import {blockHasWorkerPriority} from "./blockHasWorkerPriority.jsx";

export function TwineMaker(mapTile) {
    let b = {
        id: game.getNextBlockId(),
        name: "Twine Maker",
        descr: `Rope is an essential tool for survival, providing hundreds of potential uses to get things done. Twine isn't a very
                effective rope, but it is available, and will do for now.`,
        usage: `Produces twine from bark and vines in the forest`,
        image: imageURL +'stickmaker.png',
        progressBar: 0,
        progressBarColor: 'blue',
        progressBarMax: 20,
        tileX: mapTile.x,
        tileY: mapTile.y,
        onhand: [],
        tool: null,
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
        update: ()=>{
            if(b.tool===null) return; // No tool selected (or loaded)
            if(b.onhand.length>=5) return; // We can only hold 5 finished items
            if(game.workPoints<=0) return; // Nobody available to do work here
            game.workPoints--;
            b.progressBar++;
            if(b.progressBar>=20) {
                b.onhand.push(game.createItem(b, 'Twine', 'item', {}));
                b.progressBar = 0;
            }
        }
    }
}