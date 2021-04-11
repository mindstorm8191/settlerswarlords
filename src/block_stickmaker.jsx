/*  block_stickmaker.jsx
    Produces sticks from existing trees in the area
    For the game Settlers & Warlords
*/

import React from "react";
import { imageURL } from "./App.js";
import {ClickableLabel} from "./comp_localMap.jsx";
import {game} from "./game.jsx";
import {blockHasWorkerPriority} from "./blockHasWorkerPriority.jsx";
import {blockHasSelectableCrafting} from "./blockHasSelectableCrafting.jsx";
import {blockHasMultipleOutputs} from "./blockHasMultipleOutputs.jsx";
import {blockRequiresTools} from "./blockRequiresTools.jsx";
import {blockSharesOutputs} from "./blockSharesOutputs.jsx";

export function StickMaker(mapTile) {
    if(mapTile.landtype!==1) return 'wronglandtype';

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
            {group:'axe', options: ['Flint Stabber', 'Flint Pickaxe'], required:true, selected:'', loaded:null}
        ],
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