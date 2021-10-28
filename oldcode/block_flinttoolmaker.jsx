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
import {blockSharesOutputs} from "./blockSharesOutputs.jsx";

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
            },{
                name: 'Flint Hatchet',
                craftTime:40,
                qty:1,
                itemType:'tool',
                itemExtras: {efficiency:1,endurance:40},
                img:imageURL+"item_FlintHatchet.png",
                inputItems: [{name:'Flint Hatchet Head', qty:1}, {name:'Short Stick', qty:1},{name:'Twine', qty:1}]
            },{
                name:'Flint Scythe',
                craftTime:50,
                qty:1,
                itemType:'tool',
                itemExtras: {efficiency:1,endurance:50},
                img:imageURL+"item_FlintScythe.png",
                inputItems: [{name:'Flint Scythe Head', qty:1},{name:'Long Stick', qty:1},{name:'Short Stick', qty:1},{name:'Twine', qty:2}]
            },{
                name:'Flint Hoe',
                craftTime:40,
                qty:1,
                itemType: 'tool',
                itemExtras: {efficiency:1, endurance:50},
                img:imageURL+'item_flintHoe.png',
                inputItems: [{name:'Flint Hoe Head', qty:1},{name:'Long Stick', qty:1},{name:'Twine', qty:1}]
            },{
                name:'Twine Rake',
                craftTime:50,
                qty:1,
                itemType:'tool',
                itemExtras: {efficiency:1,endurance:1000},
                img:imageURL+'item_TwineRake.png',
                inputItems: [{name:'Long Stick', qty:1},{name:'Short Stick', qty:3},{name:'Twine', qty:2}]
            }
        ],
        possibleOutputs: ()=>{
            // Returns an array of possible outputs of this block.
            // We need to exclude any items that haven't been unlocked yet
            return b.craftOptions.filter(ele=> {
                if(typeof(ele.prereq)==='undefined') return true;
                return ele.prereq.every(name=>game.unlockedItems.includes(name));
            }).map(e=>e.name);
        },
        willAccept: item => {
            // Returns true if this block can accept the specified item
            return b.needsList().includes(item.name);
        },
        takeItem: item => {
            // Accepts an item. Returns true if successful, or false if not.
            b.inItems.push(item);   // Well, we could just accept it...
            return true;
        },
        fetchItem: itemId => {
            // Returns an item that is stored in this block, anywhere
            // Start with checking the outputs
            let item = b.onhand.find(e=>e.id===itemId);
            if(typeof(item)!=='undefined') return item;
            // Next, check the input array
            item = b.inItems.find(e=>e.id===itemId);
            if(typeof(item)==='undefined') return null;
            return item;
        },
        deleteItem: itemId => {
            let slot = b.onhand.findIndex(e=>e.id===itemId);
            if(slot!==-1) {
                b.onhand.splice(slot, 1);
                return true;
            }
            slot = b.inItems.findIndex(e=>e.id===itemId);
            if(slot===-1) return false;
            b.inItems.splice(slot,1);
            return true;
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
                currentCraft: b.currentCraft,
                nextCraft: b.nextCraft,
                inputs: b.inItems,
            }
        },
        load: content=>{
            b.priority     = content.priority;
            b.progressBar  = content.progress;
            b.onhand       = content.items;
            b.currentCraft = content.currentCraft;
            b.nextCraft    = content.nextCraft;
            b.inItems      = content.inputs;
        }
    };
    return Object.assign(b, blockHasWorkerPriority(b), blockHasSelectableCrafting(b), blockHasMultipleOutputs(b), blockSharesOutputs(b));
}