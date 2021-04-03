/*  block_huntingpost.jsx
    Hunts for animals in the local area. Can generate raw meats, plus a host of other resources when used with the butchery
    For the game Settlers & Warlords
*/

import React from "react";
import {imageURL} from "./App.js";
import {DanCommon} from "./DanCommon.js";
import {game} from "./game.jsx";
import {blockHasWorkerPriority} from "./blockHasWorkerPriority.jsx";
import {blockHasMultipleOutputs} from "./blockHasMultipleOutputs.jsx";
import {blockRequiresTools} from "./blockRequiresTools.jsx";

export function HuntingPost(mapTile) {
    // Check that there are no other hunting posts in this area
    if(game.blocks.some(e=>e.name==='Hunting Post')) {
        console.log('There is already a hunting post in this area');
        return 'cannotbuildmore';
    }
    let b = {
        id: game.getNextBlockId(),
        name: 'Hunting Post',
        descr: `Humans are not herbivores.  They require meats equally as much as plants. Without good sources of both, the body will
                struggle to survive`,
        usage: `Hunts for animals in the local area, returning dead animals. Can be cooked directly, or sent to a butchery to extract
                more resources`,
        image: imageURL +'huntingpost.png',
        progressBar: 0,
        progressBarColor: 'blue',
        progressBarMax: 30,
        tileX: mapTile.x,
        tileY: mapTile.y,
        onhand: [],
        toolGroups: [
            {group:'weapon', options: ['Flint Spear'], required:true, selected:'', loaded:null}
        ],
        hasItem: nameList => {
            // Returns true if this block has any of the items in the names list
            return nameList.some(name => {
                return b.onhand.some(item=>item.name===name);
            });
        },
        getItem: name=>{
            // Returns an item, removing it from this inventory, or null if no items by that name is found
            let slot = b.onhand.findIndex(item => item.name===name);
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
            if(b.onhand.length>=5) return; // Outputs need to go somewhere; can't eat raw food here
            if(!b.checkTools()) return; // No tools loaded here
            if(game.workPoints<=0) return; // Nobody here to do the work
            game.workPoints--;
            b.progressBar++;
            b.useTools();
            if(b.progressBar>=30) {
                b.progressBar-=30;
                b.onhand.push(game.createItem(
                    b.id, DanCommon.getRandomFrom(['Dead Deer', 'Dead Wolf', 'Dead Boar', 'Dead Chicken']), 'item', {lifetime:300}
                ));
            }
        },
        SidePanel: props =>{
            const Priority = b.ShowPriority;
            const Tools = b.ShowTools;
            const ItemOutputs = b.ShowOutputs;
            return (<>
                <Priority />
                <p className="singleline">Progress: {parseInt((b.progressBar*100)/30)}%</p>
                <ItemOutputs />
                <Tools />
            </>);
        }
    }
    return Object.assign(b, blockHasWorkerPriority(b), blockHasMultipleOutputs(b), blockRequiresTools(b));
}