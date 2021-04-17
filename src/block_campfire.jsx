/*  block_campfire.jsx
    Cooks items over an open flame
    For the game Settlers & Warlords
*/

import React from "react";
import {imageURL} from "./App.js";
import {game} from "./game.jsx";
import {blockHasWorkerPriority} from "./blockHasWorkerPriority.jsx";
import {blockHasMultipleOutputs} from "./blockHasMultipleOutputs.jsx";
import {blockHasOutputsPerInput} from "./blockHasOutputsPerInput.jsx";
import {blockSharesOutputs} from "./blockSharesOutputs.jsx";
import {blockRunsFire} from "./blockRunsFire.jsx";

export function Campfire(mapTile) {
    if(mapTile.landtype===1) return 'wronglandtype';  // Don't put a fire in the trees!
    // Or, maybe we could, and then have a forest fire that the player can't manage
    // But... that'll have to be added later

    let b = {
        id: game.getNextBlockId(),
        name: "Campfire",
        descr: `Fire is man's ultimate tool, even in primitive times. Not only does it provide warmth, it cooks food, unlocking
                nutrients that would otherwise be inaccessible to the body. Easy access to nutrients allows humans to do more.`,
        usage: `Provides a place to cook foods & other things. Needs steady supply of firewood to maintain heat. Provide raw foods
                (like meats) to be cooked; butchering before-hand is optional but recommended.`,
        image: imageURL + 'campfire.png',
        progressBar: 0,
        progressBarColor: 'orange',
        progressBarMax:   100,
        tileX: parseInt(mapTile.x),
        tileY: parseInt(mapTile.y),
        inItems: [],
        fuelChoices: [
            {name: 'Small Firewood', fuelBoost:6, fuelTime:10},
            {name: 'Medium Firewood', fuelBoost:6, fuelTime:15},
            {name: 'Large Firewood', fuelBoost:6, fuelTime:23}
        ],
        cookChoices: [
            {name: 'Dead Deer',     cookTime: 120, burnTime: 50, minTemp: 50, maxTemp: 80,  outItem: 'Deer Meat', outGroup:'food', outExtras:{'lifetime':300}, outQty: 5, burnItem:'Burnt Meat'},
            {name: 'Raw Deer Meat', cookTime: 15,  burnTime: 10, minTemp: 50, maxTemp: 100, outItem: 'Deer Meat', outGroup:'food', outExtras:{'lifetime':300}, outQty: 1, burnItem:'Burnt Meat'},
            {name: 'Dead Wolf',     cookTime: 70,  burnTime: 40, minTemp: 50, maxTemp: 90,  outItem: 'Wolf Meat', outGroup:'food', outExtras:{'lifetime':300}, outQty: 3, burnItem:'Burnt Meat'},
            {name: 'Raw Wolf Meat', cookTime: 15,  burnTime: 10, minTemp: 50, maxTemp: 100, outItem: 'Wolf Meat', outGroup:'food', outExtras:{'lifetime':300}, outQty: 1, burnItem:'Burnt Meat'},
            {name: 'Dead Boar',     cookTime: 90,  burnTime: 30, minTemp: 50, maxTemp: 80,  outItem: 'Boar Meat', outGroup:'food', outExtras:{'lifetime':300}, outQty: 4, burnItem:'Burnt Meat'},
            {name: 'Raw Boar Meat', cookTime: 15,  burnTime: 10, minTemp: 50, maxTemp: 100, outItem: 'Boar Meat',    outGroup:'food', outExtras:{'lifetime':300}, outQty: 1, burnItem:'Burnt Meat'},
            {name: 'Dead Chicken',     cookTime: 33, burnTime: 10, minTemp: 50, maxTemp: 90,  outItem: 'Chicken Meat', outGroup:'food', outExtras:{'lifetime':300}, outQty: 2, burnItem:'Burnt Meat'},
            {name: 'Raw Chicken Meat', cookTime: 15, burnTime: 10, minTemp: 50, maxTemp: 90,  outItem: 'Chicken Meat', outGroup:'food', outExtras:{'lifetime':300}, outQty: 1, burnItem: 'Burnt Meat'}
        ],
        onhand: [],
        fuelMax: 8, // Max number of fuel items to hold at a time
        fireDecay: 3,   // How much heath the fire looses per tick (with fuel or not)
        outputMax: 20, // This is higher because additional food can allow greater population to arrive
        possibleOutputs: ()=>{
            let out = [];
            b.cookChoices.forEach(e=>{
                if(!out.includes(e.outItem)) out.push(e.outItem);
            });
            return out;
        },
        willAccept: item=>{
            // Returns true if this block will accept the given item
            // This one is a bit more complex, because it can be accepted either as fuel or product
            return (b.inFuel.length<b.fuelMax && b.fuelChoices.some(e=>e.name===item.name)) ||
                   (b.inItems.length<5 && b.cookChoices.some(e=>e.name===item.name));
        },
        takeItem: item=>{
            // Accepts a new item as input for this block
            // First, figure out which input group this should go into
            if(b.fuelChoices.some(e=>e.name===item.name)) {
                b.inFuel.push(item);
                return true;
            }
            if(b.cookChoices.some(e=>e.name===item.name)) {
                b.inItems.push(item);
                return true;
            }
            // This didn't fit into either. Reject the item
            return false;
        },
        update: ()=>{
            b.manageFire(); // This happens whether the colonists interact with this or not
            if(game.workPoints<=0) return; // Nobody left to manage this block
            if(b.manageFuel()) { // Adds fuel to the fire, and collects more fuel when low
                // Work was done here
                game.workPoints--;
                return;
            }
            if(b.manageCraft()) { // This is putting items on the fire, removing them, and gathering more items
                // Work was done here
                game.workPoints--;
                return;
            }
        },
        SidePanel: ()=>{
            const Priority = b.ShowPriority;
            const ItemOutputs = b.ShowOutputs;
            return <>
                <Priority />
                <p className="singleline">Fuel on hand: {b.inFuel.length}</p>
                <p className="singleline">Fire temp: {b.fireTemp}</p>
                <p className="singleline">Progress: {b.showCookProgress()}%</p>
                <p className="singleline">Currently cooking {(b.overFire===null)?'nothing':b.overFire.name}</p>
                <ItemOutputs />
            </>;
        },
        save: ()=>{
            return {
                priority: b.priority,
                progress: b.progressBar,
                inFuel: b.inFuel,
                inItems: b.inItems,
                items: b.onhand,
                overFire: (b.overFire===null)?'none':b.overFire,
                cookProgress: b.cookProgress,
                fireTemp: b.fireTemp,
                fuelTime: b.fuelTime
            };
        },
        load: content=>{
            b.priority    = content.priority;
            b.progressBar = content.progress;
            b.inFuel      = content.inFuel;
            b.inItems      = content.inItems;
            b.onhand       = content.items;
            b.overFire     = (content.overFire==='none')?null:content.overFire;
            b.cookProgress = content.cookProgress;
            b.fireTemp     = content.fireTemp;
            b.fuelTime     = content.fuelTime;
        }
    };
    
    return Object.assign(
        b,
        blockHasWorkerPriority(b),
        blockHasMultipleOutputs(b),
        blockHasOutputsPerInput(b),
        blockSharesOutputs(b),
        blockRunsFire(b)
    );
}

