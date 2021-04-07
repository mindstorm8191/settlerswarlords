/*  block_flinttoolmaker.jsx
    Provides a block that handles making any number of flint tools that need multiple parts
    For the game Settlers & Warlords
*/

import React from "react";
import {imageURL } from "./App.js";
import {game} from "./game.jsx";
import {blockHasWorkerPriority} from "./blockHasWorkerPriority.jsx";
import {blockHasSelectableCrafting} from "./blockHasSelectableCrafting.jsx";
import {blockHasMultipleOutputs} from "./blockHasMultipleOutputs.jsx";
//import {blockNeedsMultipleItems} from "./blockNeedsMultipleItems.jsx";

export function FlintToolMaker(mapTile) {
    //...we're gonna need another block module!
    let b = {
        id: game.getNextBlockId(),
        name: "Flint Tool Maker",
        descr: `Tools made of flint might get you started, but before long you're going to need better tools. Crafting wooden handles onto
                your flint blades gives you more types of tools to use`,
        usage: `Select a tool to craft, then pass in the required materials to begin crafting it`,
        image: imageURL +"flintToolMaker.png",
        progressBar: 0,
        progressBarColor: 'blue',
        progressBarMax: 20,
        tileX: mapTile.x,
        tileY: mapTile.y,
        onhand: [],
        craftOptions: [
            {
                name:'Flint Spear',
                craftTime:40,
                qty:1,
                itemType:'tool',
                itemExtras: {efficiency:1,endurance:30},
                img:imageURL+'item_FlintSpear.png',
                inputItems: [{name:'Flint Spear Head', qty:1},{name:'Long Stick', qty:1},{name:'Twine', qty:1}]
            }
        ],
        hasItem: nameList => {
            // Returns true if this block has any of the items in the names list
            return nameList.some(name => {
                return b.onhand.some(item=>item.name===name);
            });
        },
        getItem: name=>{
            // Returns an item, removing it from this inventory, or null if none by that name is found
            let slot = b.onhand.find(item => item.name===name);
            if(slot===-1) return null;
            return b.onhand.splice(slot, 1)[0]; // splice returns an array, we just need the item
        },
        getItemFrom: namesList => {
            // Returns any item in the names list, if it is here
            let slot = b.onhand.findIndex(item => namesList.includes(item.name));
            if(slot===-1) return null;
            return b.onhand.splice(slot, 1)[0];
        },
        update: ()=>{
            if(b.currentCraft==='')      return; // Nothing selected to craft
            if(b.onhand.length>=3)       return; // Outputs need to go somewhere
            if(game.workPoints<=0)       return; // No workers to do anything here
            if(!b.hasIngredients(true)) return; // Missing craft pieces
            game.workPoints--;                   // We're ready to work. Subtract points
            b.progressCraft(1);                  // Make progress on the item
        },
        SidePanel: ()=>{
            const Priority = b.ShowPriority;
            const Inputs = b.ShowInputs;
            const Outputs = b.ShowOutputs;
            const Options = b.ShowCraftOptions;
            return (
                <>
                    <Priority />
                    <Inputs />
                    <Outputs />
                    <Options />
                </>
            );
        },
        save: ()=>{
            return {
                priority: b.priority,
                progress: b.progressBar,
                items: b.onhand,
                currentCraft: bcurrentCraft,
                nextCraft: b.nextCraft,
                inputs: b.inItems,
            }
        }
    };
    return Object.assign(b, blockHasWorkerPriority(b), blockHasSelectableCrafting(b), blockHasMultipleOutputs(b));
}