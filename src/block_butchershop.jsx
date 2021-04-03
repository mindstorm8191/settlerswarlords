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
        tilex: mapTile.x,
        tiley: mapTile.y,
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
                    {name: 'Raw Boar meat', qty: 6},
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
        hasItem: namesList => {
            return namesList.some(n => {
                return b.onhand.some(i=>i.name===n);
            });
        },
        getItem: name=>{
            let slot = b.onhand.findIndex(i=>i.name===name);
            if(slot===-1) return null;
            return b.onhand.splice(slot, 1)[0];
        },
        getItemFrom: namesList =>{
            let slot = b.onhand.findIndex(i => namesList.includes(i.name));
            if(slot===-1) return null;
            return b.onhand.splice(slot, 1)[0];
        },
        update: ()=>{
            if(!b.checkTools()) return; // No tool loaded to work here
            if(game.workPoints<=0) return; // nobody available to work here
            if(b.inItems.length===0) {
                if(b.searchForItems()) {
                    game.workPoints--;
                    return;
                }
                // Couldn't find any items anyway
                return;
            }
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
                <p className="singleline">Progress: {parseInt((b.progressBar*100)/30)}%</p>
                <ItemOutputs />
                <Tools />
            </>;
        }
    };

    return Object.assign(b, blockHasWorkerPriority(b), blockHasMultipleOutputs(b), blockRequiresTools(b), blockHasOutputsPerInput(b));
}