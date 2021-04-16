/*  blockSharesOutputs.jsx
    Add-on component for any block that shares all outputs with any neighbors requesting it
    For the game Settlers & Warlords
*/

import {game} from "./game.jsx";

export const blockSharesOutputs = state => ({
    // An Add-on component for any block that shares its output items with any neighboring blocks. Many blocks have an item output
    // and are willing to provide that output to any nearby blocks needing such items. This will be the default behavior for
    // those blocks

    willOutput: iName => {
        // Returns true if this block will output the item specified
        // For blocks using blockSharesOutputs, any output item may be output
        return state.onhand.some(i=>i.name===iName);
    },
    hasItem: namesList => {
        // Returns true or false if this block has any items in the names list (just pass an array of item names)
        return namesList.some(n => {
            return state.onhand.some(i=>i.name===n);
        });
    },
    getItem: name=>{
        // Returns an item in this block's inventory, when given the item's name
        let slot = state.onhand.findIndex(i=>i.name===name);
        if(slot===-1) return null;
        return state.onhand.splice(slot, 1)[0];
    },
    getItemFrom: namesList =>{
        // Returns any one item in this block's inventory that matches a name in the names list
        let slot = state.onhand.findIndex(i => namesList.includes(i.name));
        if(slot===-1) return null;
        return state.onhand.splice(slot, 1)[0];
    },
    findItems: namesList =>{
        // Collects any items from a nearby neighbor, from the provided list
        let neighbors = game.getNeighbors(state.tileX, state.tileY);
        for(let i=0;i<neighbors.length;i++) {
            if(typeof(neighbors[i].getItemFrom)!=='undefined') {
                let pickup = neighbors[i].getItemFrom(namesList);
                if(pickup!==null) return pickup;
            }
        }
        return null;
    }
});