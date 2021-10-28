/*  block_stickmaker.jsx
    Produces sticks from existing trees in the area
    For the game Settlers & Warlords
*/

import React from "react";
import { imageURL } from "./App.js";
import {game} from "./game.jsx";
import {blockHasWorkerPriority} from "./blockHasWorkerPriority.jsx";
import {blockHasSelectableCrafting} from "./blockHasSelectableCrafting.jsx";
import {blockHasMultipleOutputs} from "./blockHasMultipleOutputs.jsx";
import {blockRequiresTools} from "./blockRequiresTools.jsx";
import {blockSharesOutputs} from "./blockSharesOutputs.jsx";

export function StickMaker(mapTile) {
    if(mapTile.landtype!==5) return 'wronglandtype';

    let b = {
        id: game.getNextBlockId(),
        name: "Stick Maker",
        descr: `The effective use of wood is crucial for continued expansion of your colony. Durable yet easily workable, the woods here
                provides plenty to be made use of`,
        usage: `Cuts down small trees and branches of larger ones to produce sticks of various sizes. Requires tools`,
        image: imageURL +'stickmaker.png',
        progressBar: 0,
        progressBarColor: 'blue',
        progressBarMax: 30,
        tileX: mapTile.x,
        tileY: mapTile.y,
        onhand: [],
        craftOptions: [
            {name:'Short Stick', craftTime:20, qty:1, itemType: 'item', itemExtras: {}, img:imageURL+"item_ShortStick.png"},
            {name:'Long Stick', craftTime:20, qty:1, itemType: 'item', itemExtras: {}, img:imageURL+"item_LongStick.png"}
        ],
        toolGroups: [
            {group:'axe', options: ['Flint Stabber', 'Flint Hatchet'], required:true, selected:'', loaded:null}
        ],
        possibleOutputs: ()=>{
            // We don't have any items with prerequisites - yet. If we do, we can borrow the same code from the Rock Knapper
            return b.craftOptions.map(e=>e.name);
        },
        willAccept: item=>false,    // This block doesn't have any inputs (besides tools - that's handled differently)
        takeItem: item=>false,
        fetchItem: itemId=>{
            // Returns an item, if this block has it, or null if it was not found. This is primarily used in the game
            // object to manage food and updating other item stats
            // Since this only has outputs, we can locate the item in our onhand list
            let item = b.onhand.find(e=>e.id===itemId);
            if(typeof(item)!=='undefined') return item;
            
            // We didn't find the item in our onhand list. We might still find it in the tools list
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
            // Before any work can be done here, a tool must be loaded
            if(!b.checkTools()) return; // No tool selected
            if(b.currentCraft==='') return; // No item selected to craft
            if(b.onhand.length>=5) return; // We can only hold 5 finished items
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
                tools: b.toolGroups.map(t=>{
                    return {
                        group: t.group,
                        selected: t.selected,
                        loaded: typeof(t.loaded)==='null'?'none':t.loaded
                    }
                })
            };
        },
        load: content=>{
            b.priority     = content.priority;
            b.progressBar  = content.progress;
            b.onhand       = content.items;
            b.currentCraft = content.currentCraft;
            b.nextCraft    = content.nextCraft;
            b.toolGroups   = b.toolGroups.map(group => {
                let source = content.tools.find(e=>group.group===e.group);
                group.selected = source.selected;
                group.loaded = (source.loaded==='none')?null:source.loaded;
                return group;
            });
            // Don't forget to set the progress bar's max value, too, since it's based on the currently crafted item
            if(b.currentCraft!=='') {
                b.progressBarMax = b.craftOptions.find(e=>e.name===b.currentCraft).craftTime;
            }
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