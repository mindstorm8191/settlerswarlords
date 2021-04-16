/*  block_butchershop.jsx
    Cuts up dead creatures, producing meats, along with many other byproducts
    For the game Settlers & Warlords
*/

import React from "react";
import {imageURL} from "./App.js";
import {game} from "./game.jsx";
import {blockHasWorkerPriority} from "./blockHasWorkerPriority.jsx";
import {blockHasMultipleOutputs} from "./blockHasMultipleOutputs.jsx";
import {blockHasOutputsPerInput} from "./blockHasOutputsPerInput.jsx";
import {blockRequiresTools} from "./blockRequiresTools.jsx";
import {blockSharesOutputs} from "./blockSharesOutputs.jsx";

export function ButcherShop(mapTile) {
    let b = {
        id: game.getNextBlockId(),
        name: 'Butcher Shop',
        descr: `While cooking meats whole gets the job done, it is a lengthy process. Cutting meats into smaller pieces allows for
                faster cooking. Plus, other resources can be extracted from your catches.`,
        usage: `Converts dead animals into raw meats and other resources. Requires a knife`,
        image: imageURL +'butcherShop.png',
        progressBar: 0,
        progressBarColor: 'blue',
        progressBarMax: 35,
        tileX: mapTile.x,
        tileY: mapTile.y,
        onhand: [],
        toolGroups: [
            {group:'knife', options: ['Flint Knife'], required:true, selected:'', loaded:null}
        ],
        outputItems: [
            {
                name: "Dead Deer", // This is what is input
                craftTime: 50,
                output: [
                    { name: "Raw Deer Meat", qty: 7 },
                    { name: "Bone", qty: 4 },
                    { name: "Fur", qty: 3 }
                ]
            },
            {
                name: "Dead Wolf",
                craftTime: 30,
                output: [
                    {name: 'Raw Wolf Meat', qty: 4},
                    {name: 'Bone', qyt: 2},
                    {name: 'Fur', qty: 2},
                ]
            },
            {
                name: "Dead Boar",
                craftTime: 40,
                output: [
                    {name: 'Raw Boar Meat', qty: 6},
                    {name: 'Bone', qty: 3},
                    {name: 'Fur', qty: 3}
                ]
            },
            {
                name: "Dead Chicken",
                craftTime: 20,
                output: [
                    {name: 'Raw Chicken Meat', qty: 2},
                    {name: 'Bone', qty: 1},
                    {name: 'Feather', qty: 5}
                ]
            }
        ],
        possibleOutputs: ()=>{
            let outs = [];
            b.outputItems.forEach(group=>group.output.forEach(ele=>{
                if(!outs.includes(ele.name)) outs.push(ele.name);
            }));
            return outs;
        },
        willAccept: item =>{
            // Returns true if this block will accept this item
            // Check that the item is one of the input items, and also that the inItems slot isn't full
            return b.outputItems.some(e=>e.name===item.name) && b.inItems.length<5;
        },
        takeItem: item =>{
            if(b.inItems.length>=5) return false;
            if(!b.outputItems.some(e=>e.name===item.name)) return false;
            b.inItems.push(item);
            return true;
        },
        update: ()=>{
            if(!b.checkTools()) return; // No tool loaded to work here
            if(game.workPoints<=0) return; // nobody available to work here
            if(b.inItems.length===0||b.inItems.length>5) {
                if(b.searchForItems()) {
                    game.workPoints--;
                    return;
                }
                // Couldn't find any items anyway
                return;
            }
            if(b.onhand.length>20) return; // We already have a lot of outputs here
            // Wellll, that should be all we need before doing work
            b.useTools();
            b.processCraft(1);
        },
        SidePanel: ()=>{
            const Priority = b.ShowPriority;
            const Tools = b.ShowTools;
            const ItemOutputs = b.ShowOutputs;
            return <>
                <Priority />
                <p className="singleLine">Currenty Working: {b.inItems.length===0?'none':b.inItems[0].name}</p>
                <p className="singleline">Progress: {b.getCraftPercent()}%</p>
                <ItemOutputs />
                <Tools />
            </>;
        },
        save: ()=>{
            return {
                priority: b.priority,
                progress: b.progressBar,
                items: b.onhand,
                inputs: b.inItems,
                tools: b.toolGroups.map(t=>{
                    return {
                        group: t.group,
                        selected: t.selected,
                        loaded: t.loaded
                    }
                })
            }
        },
        load: content=>{
            b.priority    = content.priority;
            b.progressBar = content.progress;
            b.onhand   = content.items;
            b.inItems  = content.inputs;
            b.toolGroups = b.toolGroups.map(group => {
                let source = content.tools.find(e=>group.group===e.group);
                group.selected = source.selected;
                group.loaded = (source.loaded==='none')?null:source.loaded;
                return group;
            });
            // Since crafting times can vary based on current operation items, we need to adjust the progress bar range
            if(b.inItems.length>0) {
                b.progressBarMax = b.outputItems.find(e=>e.name===b.inItems[0].name).craftTime;
            }
        }
    };

    return Object.assign(
        b,
        blockHasWorkerPriority(b),
        blockHasMultipleOutputs(b),
        blockRequiresTools(b),
        blockHasOutputsPerInput(b),
        blockSharesOutputs(b)
    );
}