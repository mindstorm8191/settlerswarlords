/*  block_recycler.jsx
    Allows items to be moved out of blocks when deleted, or destroyed by player selection. Note this block is NOT created by the player,
    but generated when blocks are deleted while still having items
    For the game Settlers & Warlords
*/

import React from "react";
import { imageURL } from "./App.js";
import { game } from "./game.jsx";
import { blockHasWorkerPriority } from "./blockHasWorkerPriority.jsx";
import { blockHasMultipleOutputs } from "./blockHasMultipleOutputs.jsx";
import { blockSharesOutputs } from "./blockSharesOutputs.jsx"; // because why not allow neighboring blocks to collect items from here too?
import { blockMovesWorkers } from "./blockMovesWorkers.jsx";

export function Recycler(mapTile, allItems, priority) {
    let b = {
        id: game.getNextBlockId(),
        name: 'Recycler',
        descr: `Items are currency, right? Do you need any of these?`,
        usage: `If these items aren't needed, click Drop. Otherwise, select a target block to send these items to. Once this block is
                empty, it will be removed.`,
        image: imageURL+'recycler.png',
        progressBar: 0,
        progressBarColor: 'black',
        progressBarMax: 1,
        tileX: mapTile.x,
        tileY: mapTile.y,
        onhand: allItems,
        tileClearer: null,
        possibleOutputs: ()=>{
            // Returns a list of item names that this block is able to output
            // This will be just a list of all item names, with duplicates removed
            let list = [];
            for(let i=0; i<b.onhand; i++) {
                if(list.includes(b.onhand[i].name)) {
                    list.push(b.onhand[i].name);
                }
            }
            return list;
        },
        // willOutput is handled by blockSharesOutputs
        // hasItem is handled by blockSharesOutputs
        // getItem is handled by blockSharesOutputs
        // getItemFrom is handled by blockSharesOutputs
        // findItems is handled by blockSharesOutputs
        willAccept: item => false, // This block doesn't accept any items as input
        takeItem: item => false,
        fetchItem: itemId => {
            let item = b.onhand.find(e=>e.id===itemId);
            if(typeof(item)!=='undefined') return item;
            return null;
        },
        destroyItem: itemId => {
            // Removes an item from this inventory, deleting it. Returns true if successful, or false if not.
            let slot = b.onhand.findIndex(e=>e.id===itemId);
            if(slot!==-1) {
                b.onhand.splice(slot,1);    // We can leave Game to delete the item, since all they need is the id
                return true;
            }
            return false;
        },
        update: ()=>{
            // Here, our main objective is to check if this is empty. If so, delete the block
            if(b.onhand.length===0) {
                // Umm... I don't actually know what it'll take to delete a block, yet!
                console.log('Time for the Recycler to vanish!');
                //*
                // Remove this block from the global blocks list
                game.blocks.splice(game.blocks.findIndex(e=>e.id===b.id), 1);
                
                // Remove the building ID from the tile that this building is on
                let tile = game.tiles.find(e=>e.x===b.tileX && e.y===b.tileY);
                tile.buildid = 0;

                // If this building is currently selected, we need to update the side panel content. If not, it can be ignored
                b.tileClearer(b.id);
                
                game.updateReact([...game.tiles]);
                //*/
            }
            // Check if any of our blocks has been set to be dropped. Any dropped items are immediately 'forgotten'; we're just
            // leaving them behind
            while(b.dropList.length>0) {
                let slot = b.onhand.findIndex(e=>e.name===b.dropList[0]);
                while(slot!==-1) {
                    game.deleteItem(b.onhand[slot].id);
                    b.onhand.splice(slot,1);
                    slot = b.onhand.findIndex(e=>e.name===b.dropList[0]);
                }
                b.dropList.splice(0,1);
            }
        },
        SidePanel: props => {
            // Here, show a list of all the items we need to output
            const Priority = b.ShowPriority;
            const Outputs = b.ShowOutputs;

            // We're collecting this prop for later use. We want to be able to delete the building during update(), but we have no
            // standard way to drill this through. So we'll attach it to the block, in case we need it later
            b.tileClearer = props.clearIfSelected;

            return <>
                <Priority />
                <Outputs canDrop={true} />
            </>;
        },
        save: ()=> {
            // We only really have one object to output here
            return {
                priority: b.priority,
                items: b.onhand
            };
        },
        load: content => {
            b.priority = content.priority;
            b.onhand = content.items;
        }
    }

    return Object.assign(b, blockHasWorkerPriority(b), blockHasMultipleOutputs(b), blockSharesOutputs(b), blockMovesWorkers(b));
}