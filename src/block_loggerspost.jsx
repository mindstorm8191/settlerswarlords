/*  block_loggerspost.jsx
    Handles chopping wood in forests, cutting it down to a moveable size, suitable for the desired task
    For the game Settlers & Warlords
*/

import React from "react";
import {imageURL} from "./App.js";
import {game} from "./game.jsx";
import {blockHasWorkerPriority} from "./blockHasWorkerPriority.jsx";
import {blockHasSelectableCrafting} from "./blockHasSelectableCrafting.jsx";
import {blockHasMultipleOutputs} from "./blockHasMultipleOutputs.jsx";
import {blockRequiresTools} from "./blockRequiresTools.jsx";
import {blockSharesOutputs} from "./blockSharesOutputs.jsx";

export function LoggersPost(mapTile) {
    let b = {
        id: game.getNextBlockId(),
        name: "Loggers Post",
        descr: `Crafting things out of fallen sticks can only get you so far. The tools you have now give you access to larger portions of wood.
                You are unable to move fallen trees yet, but that doesn't stop you from crafting things on the spot to haul out.`,
        usage: `Fell trees in nearby forest areas to produce a multitude of additional wood products`,
        image: imageURL +'loggerspost.png',
        progressBar: 0,
        progressBarColor: 'blue',
        progressBarMax: 50,
        tileX: mapTile.x,
        tileY: mapTile.y,
        onhand: [],
        craftOptions: [
            {
                name:'Wood Pole',
                craftTime:50,
                qty: 1,
                itemType: 'item',
                itemExtras: {},
                img: imageURL +'item_woodPole.png',
            } // We'll figure out what else to add later
        ],
        toolGroups: [
            {group:'axe', options: ['Flint Hatchet'], required:true, selected:'', loaded:null}
        ],
        possibleOutputs: ()=>{
            // Returns an array of possible outputs of this block
            // We don't really have anything locked from this block; just return the whole list
            return b.craftOptions.map(e=>e.name);
        },
        //willOutput is handled by blockSharesOutputs
        //hasItem ''  ''  ''
        //getItem ''  ''  ''
        //getItemFrom ''  ''  ''
        //findItems ''  ''  ''
        willAccept: item=>false, // This block doesn't accept any inputs
        takeItem: item=>false,   // ''  ''  ''
        fetchItem: itemId => {
            // Returns an item, if found, when provided the item's ID
            // Since this only has outputs, we can locate the item in our onhand list
            let item = b.onhand.find(e=>e.id===itemId);
            if(typeof(item)!=='undefined') return item;

            // Well, we didn't find the item in our onhand list. We might still find it in the tools list
            for(let i=0;i<b.toolGroups.length;i++) {
                if(b.toolGroups[i].loaded!==null) {
                    if(b.toolGroups[i].loaded.id===itemId) return b.toolGroups[i].loaded;
                }
            }
            return null;
        },
        destroyItem: itemId=>{
            let slot = b.onhand.findIndex(e=>e.id===itemId);
            if(slot!==-1) {
                b.onhand.splice(slot,1);    // We can leave Game to delete the item, since all they need is the id
                return true;
            }
            // Now check the tools structure
            return b.toolGroups.some(ele=>{
                if(ele.loaded===null) return false;
                if(ele.loaded.id!==itemId) return false;
                ele.loaded = null;
                return true;
            });
        },
        update: ()=>{
            if(!b.checkTools()) return; // No tool selected
            if(b.currentCraft==='') return; // No item selected to craft
            if(b.onhand.length>=5) return; // No room for more items
            if(game.workPoints<=0) return; // Nobody available to work here
            game.workPoints--;
            b.useTools();
            b.progressCraft(1);
        },
        SidePanel: ()=>{
            const Priority = b.ShowPriority;
            const ItemOutputs = b.ShowOutputs;
            const CraftOptions = b.ShowCraftOptions;
            const Tools = b.ShowTools;
            return (
                <>
                    <Priority />
                    <ItemOutputs />
                    <CraftOptions />
                    <Tools />
                </>
            );
        },
        save: ()=>{
            return {
                priority: b.priority,
                progress: b.progressBar,
                items: b.onhand,
                currentCraft: b.currentCraft,
                nextCraft: b.nextCraft,
                tools: b.saveTools()
            };
        },
        load: content=>{
            b.priority    = content.priority;
            b.progressBar = content.progress;
            b.onhand       = content.items;
            b.currentCraft = content.currentCraft;
            b.nextCraft    = content.nextCraft;
            b.loadTools();
        }
    };
    return Object.assign(
        b,
        blockHasWorkerPriority(b),
        blockHasSelectableCrafting(b),
        blockHasMultipleOutputs(b),
        blockRequiresTools(b),
        blockSharesOutputs(b)
    );
}