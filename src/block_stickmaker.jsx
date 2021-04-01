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
        //currentCraft: '',
        toolGroups: [
            {group:'axe', options: ['Flint Stabber', 'Flint Pickaxe'], required:true, selected:'', loaded:null}
        ],
        tool: null,
        hasItem: nameList => {
            // Returns true if this block can output an item in the names list
            return nameList.some(name => b.onhand.some(item=>item.name===name));
        },
        getItem: name => {
            // Returns an item, removing it from this inventory. If the item is not found, this returns null
            let slot = b.onhand.findIndex(item => item.name===name);
            if(slot===-1) return null;
            return b.onhand.splice(slot, 1)[0];
        },
        getItemFrom: namesList => {
            // Returns any item in the names list, if it is here
            let slot = b.onhand.find(item => namesList.includes(item.name));
            if(slot===-1) return null;
            return b.onhand.splice(slot, 1)[0];
        },
        receiveTool: tool => {
            b.tool = tool;
            return true;
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
        }
    };
    return Object.assign(
        b,
        blockHasWorkerPriority(b),
        blockHasSelectableCrafting(b),
        blockHasMultipleOutputs(b),
        blockRequiresTools(b)
    );
}