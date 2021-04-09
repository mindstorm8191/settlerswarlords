/* rockknapper.jsx
    Provides the Rock Knapper, the first means to produce tools from rocks
    For the game Settlers & Warlords
*/

import React from "react";
import { imageURL } from "./App.js";
import {game} from "./game.jsx";
import {blockHasWorkerPriority} from "./blockHasWorkerPriority.jsx";
import {blockHasSelectableCrafting} from "./blockHasSelectableCrafting.jsx";
import {blockHasMultipleOutputs} from "./blockHasMultipleOutputs.jsx";

export function RockKnapper(mapTile) {
    // These can only be built on rock areas
    if(mapTile.landtype!==2) return 'wronglandtype';

    let b = {
        id: game.getNextBlockId(),
        name: "Rock Knapper",
        descr: `Tools are critical to survival, and rocks are your first tool. Knapping is the art of smashing rocks into the shapes you need.`,
        usage: `Knapp rocks to craft either knives or stabbers - you must select one before crafting can begin. Once crafted, place
                into a toolbox to use in nearby blocks.`,
        image: imageURL +'rockKnapper.png',
        progressBar: 0,
        progressBarColor: 'orange',
        progressBarMax: 20,
        tileX: mapTile.x,
        tileY: mapTile.y,
        onhand: [],
        craftOptions: [
            {name:'Flint Knife', craftTime:20, qty:1, itemType:'tool', itemExtras:{efficiency:1,endurance:30}, img:imageURL+'item_flintKnife.png'},
            {name:'Flint Stabber', craftTime:20, qty:1, itemType:'tool', itemExtras:{efficiency:1,endurance:30}, img:imageURL+"item_flintStabber.png"},
            {name:'Flint Spear Head', craftTime:30, qty:1, itemType:'item', img:imageURL+"item_flintSpearHead.png", prereq:['Twine']}
        ],
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
        getItemFrom: namesList => {
            // Returns any item that is in the names list
            let slot = b.onhand.find(item => namesList.includes(item.name));
            if(slot===-1) return null;
            return b.onhand.splice(slot, 1)[0];
        },
        update: ()=>{
            if(b.currentCraft==='') return; // User needs to select something to craft!
            if(b.onhand.length>=3) return;  // we can only hold 3 finished tools here
            if(game.workPoints<=0) return; // we have nobody to work this block
            game.workPoints--;
            b.progressCraft(1);
        },
        SidePanel: ()=>{
            const Priority = b.ShowPriority;
            const ItemOutputs = b.ShowOutputs;
            const CraftOptions = b.ShowCraftOptions;
            return (
                <>
                    <Priority />
                    <ItemOutputs />
                    <CraftOptions />
                </>
            );
        },
        save: ()=>{
            return {
                priority: b.priority,
                progress: b.progressBar,
                items: b.onhand,
                currentCraft: b.currentCraft,
                nextCraft: b.nextCraft
            }
        },
        load: content=>{
            b.priority = content.priority;
            b.progressBar = content.progress;
            b.onhand       = content.items;
            b.currentCraft = content.currentCraft;
            b.nextCraft = content.nextCraft;
            // Don't forget to set the progress bar's max value, too, since it's based on the currently crafted item
            if(b.currentCraft!=='') {
                b.progressBarMax = b.craftOptions.find(e=>e.name===b.currentCraft).craftTime;
            }
        }
    }
    return Object.assign(b, blockHasWorkerPriority(b), blockHasSelectableCrafting(b), blockHasMultipleOutputs(b));
}

