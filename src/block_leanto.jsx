/*  block_leanto.jsx
    Holds all the code related to the lean-to building
    For the game Settlers & Warlords (version 6)
*/

import React from "react";
import {imageURL} from "./App.js";
import {game} from "./game.jsx";
import {blockHasWorkerPriority} from "./blockHasWorkerPriority.jsx";

export function LeanTo(mapTile) {
    // Let's start by creating our object first
    if(mapTile.landtype!==1) return 'wronglandtype';
    let b = {
        //...blockHasWorkerPriority,
        id: game.getNextBlockId(),
            // We can pick a unique ID by looking at the last building, and going +1 of that - as long as the list isn't empty
            // This will only work until we prioritize buildings (to use work points correctly)
        name: 'Lean-To',
        descr: `Before food, even before water, one must find shelter from the elements. It is the first requirement for survival;
                for the elements, at their worst, can defeat you faster than anything else. Consisting of a downed branch with leaves
                on top, this is fast & easy to set up, but wont last long in the elements itself.`,
        usage: `Needs time to set up, then can be used for a time before it must be rebuilt`,
        image: imageURL+'leanto.png',
        mode: 'building',
        progressBar: 0,
        progressBarMax: 120,
        progressBarColor: 'brown',
        tileX: mapTile.x,
        tileY: mapTile.y,
        hasItem: name => false, // This doesn't return any items
        getItem: name => null,  // This doesn't return any items
        update: () => {
            if(b.mode==='building') {
                if(game.workPoints<=0) return;
                b.progressBar++;
                game.workPoints--;
                if(b.progressBar>=120) {
                    b.mode = 'in use';
                    b.progressBar = 300;
                    b.progressBarMax = 300;
                    b.progressBarColor = 'black';
                }
            }else{
                b.progressBar--;
                if(b.progressBar<=0) {
                    b.mode = 'building';
                    b.progressBar = 0;
                    b.progressBarMax = 120;
                    b.progressBarColor = 'brown';
                }
            }
        },
        SidePanel: hooks =>{
            const Priority = b.ShowPriority;
            return (
                <>
                    <Priority />
                    <div>Mode: {b.mode}</div>
                    <div>Counter: {b.progressBar}</div>
                </>
            );
        }
    }
    return Object.assign(b, blockHasWorkerPriority(b));
}