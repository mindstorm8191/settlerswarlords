/*  block_toolbox.jsx
    Stores tools that can be shared with neighboring blocks
    For the game Settlers & Warlords
*/

/*
I feel like I'm doing this wrong (not the React way), but I don't know what other way to do it. My game uses `setInterval()` to update all
the buildings of the game, where workers produce items or any other work. I had originally placed this inside `useEffect()` of my app's
component, but from there, I was unable to access the (local) React states. To fix this, I moved all the game-centric objects outside
the React structure, and after things are updated, I pass a new copy of these objects into React. I feel like this isn't the correct way
to do things in React, but I'm not sure how to make it work properly
*/

import React from "react";
import {imageURL} from "./App.js";
import {game} from "./game.jsx";

export function Toolbox(mapTile) {
    let b = {
        id: game.getNextBlockId(),
        name: "Toolbox",
        descr: `Lots of tasks require tools, and you'll need to produce tools of all shapes & sizes`,
        usage: `Holds one type of tool, with a max amount you can decide. Move your tools here to make them accessible to all nearby blocks`,
        image: imageURL +'toolbox.png',
        priority: (game.blocks.length===0)?1:game.blocks[game.blocks.length-1].priority+1,
        progressBar: 0,
        progressBarColor: 'orange',
        progressBarMax: 5,
        tileX: mapTile.x,
        tileY: mapTile.y,
        onhand: [],
        hasItem: nameList =>{
            // returns true if this block can output any item in the name list
            return nameList.some(name => {
                return b.onhand.some(item=>item.name===name);
            });
        },
        getItem: name=>{
            // Returns an item, removing it from this inventory
            let slot = b.onhand.find(item => item.name===name);
            if(slot===-1) return null;
            return b.onhand.splice(slot, 1)[0]; // splice returns an array of all deleted items; we only need the one item
        },
        update: ()=>{
            if(game.workPoints<=0) return;
            // Search nearby blocks for any tools nearby to collect from them
            if(b.onhand.length===0) {
                // We haven't collected any tools yet. We can collect anything. Try to pick up something from a neighboring block
                let neighbors = game.getNeighbors(b.tileX,b.tileY);
                neighbors.some(edge => {
                    if(edge.hasItem(['Flint Knife', 'Flint Stabber'])) {
                        b.onhand.push(edge.getItem(['Flint Knife', 'Flint Stabber']));
                        game.workPoints--;
                        return true;
                    }
                    return false;
                });
            }else{
                if(b.onhand.length>=5) return; // We dont' need to store too many tools...
                // We already have one item, we can only collect that type again.
                let neighbors = game.getNeighbors(b.tileX,b.tileY);
                neighbors.some(edge => {
                    if(edge.hasItem([b.onhand[0].name])) {
                        b.onhand.push(edge.getItem([b.onhand[0].name]));
                        game.workPoints--;
                        return true;
                    }
                    return false;
                });
            }
        },
        SidePanel: hooks => {
            return (
                <>
                    Current holding: {(b.onhand.length===0)?'nothing':b.onhand[0].name +' x'+ b.onhand.length}
                </>
            );
        }
    }
    return b;
}



