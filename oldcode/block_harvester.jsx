/*  block_harvester.jsx
    Handles gathering plains grasses, collecting edible grains and straw, with a chance to find seeds of additional plants
    For the game Settlers & Warlords
*/

import React from "react";
import { imageURL } from "./App.js";
import {game} from "./game.jsx";
import {DanCommon} from "./DanCommon.js";
import {blockHasWorkerPriority} from "./blockHasWorkerPriority.jsx";
import {blockHasMultipleOutputs} from "./blockHasMultipleOutputs.jsx";
import {blockRequiresTools} from "./blockRequiresTools.jsx";
import {blockSharesOutputs} from "./blockSharesOutputs.jsx";

export function Harvester(mapTile) {
    let b = {
        id: game.getNextBlockId(),
        name: "Harvester",
        descr: `Wild grasses grow in many places, most of which produce edible grains, plus straw that has many uses. Clearing grasses
                can reveal many other seed types, too`,
        usage: `Uses a scythe to clear grasses, then a knife to produce grains & straw. Has a 20% chance to find seeds to other plants.
                Working range is 10 blocks. Only for wild grass fields (not farm plots)`,
        image: imageURL +'harvester.png',
        progressBar: 0,
        progressBarColor: 'blue',
        progressBarMax: 40,
        tileX: mapTile.x,
        tileY: mapTile.y,
        onhand: [],
        hasTarget: false,
        targetX: 0,
        targetY: 0,
        toolGroups: [ // Hmm, this is the first block to require more than one tool. Might need to debug some things!
            {group:'scythe', options: ['Flint Scythe'], required:true, selected:'', loaded:null},
            {group:'knife',  options: ['Flint Knife'], required:true, selected:'', loaded:null}
        ],
        possibleOutputs: ()=>{
            return ['Wet Straw', 'Wheat Grain', 'Oat Grain', 'Rye Grain', 'Barley Grain', 'Millet Grain', 'Strawberry Seed',
                    'Rice Seed', 'Potato Seed', 'Carrot Seed', 'Bean Seed', 'Corn Seed', 'Garlic Seed', 'Squash Seed',
                    'Onion Seed', 'Grape Seed', 'Blueberry Seed'];
        },
        // willOutput is handled by blockSharesOutputs
        // hasItem is handled by blockSharesOutupts
        // getItem is handled by blockSharesOutputs
        // getItemFrom is handled by blockSharesOutputs
        // findItems is handled by blockSharesOutputs
        willAccept: item=>false, // This doesn't accept any input items
        takeItem: item=>false,
        fetchItem: itemId => {
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
        destroyItem: itemId => {
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
            if(!b.checkTools()) return; // No tool selected
            if(b.onhand.length>20) return; // Out of inventory space
            if(game.workPoints<=0) return; // Nobody available to work here

            // We could have a divided process to produce the cut grasses, then cut them into straw & grain, but there's no
            // need for the complexity. Just count everything as one operation, producing all the outputs when finished.

            if(!b.hasTarget) {
                // Locate a block to work on clearing. I was wanting to do an expanding search, centering on this block and circling
                // outward. But that would be a lot to get working. Instead, we'll just do a scan, and find any blocks within 10
                // of this one, and is also set to have grasses (we check the newTileType, as the default won't ever change)
                // Because searching will be in order, we'll always end up with the same block
                let newTarget = game.tiles.find(ele=>{
                    if(ele.x<b.tileX-10) return false; // too far left
                    if(ele.x>b.tileX+10) return false; // too far right
                    if(ele.y<b.tileY-10) return false; // too far up
                    if(ele.y>b.tileY+10) return false; // too far down
                    if(ele.newlandtype<=4) {
                        console.log('Using landtype='+ ele.newlandtype +' (coords '+ ele.x +','+ ele.x +')');
                        return true; // This is plains material
                    }
                    return false;
                });
                if(typeof(newTarget)==='undefined') {
                    console.log('Harvester found nothing to work on when starting');
                    return; // Found no valid tiles. There's nothing to do here
                }
                b.hasTarget = true;
                b.targetX = newTarget.x;
                b.targetY = newTarget.y;
            }

            // If we could attach the progress amount to the target tile, we could possibly have multiple harvesters working in the
            // same area. But for now, we will just have to make do

            // Make progress on this block
            game.workPoints--;
            b.useTools();
            b.progressBar++;
            if(b.progressBar>=b.progressBarMax) {
                b.progressBar-=b.progressBarMax;
                // Produce the correct grain, based on the land we cleared. To determine that, we need to locate the correct block again
                let oldTarget = game.tiles.find(ele => ele.x===b.targetX && ele.y===b.targetY);
                if(typeof(oldTarget)==='undefined') {
                    console.log('Harvester didnt find same block when finishing. It should be here');
                    b.hasTarget = false;
                    return;
                }
                switch(oldTarget.newlandtype) {
                    case 0: b.onhand.push(game.createItem(b.id, "Wheat Grain", 'item')); break;
                    case 1: b.onhand.push(game.createItem(b.id, "Oat Grain", 'item')); break;
                    case 2: b.onhand.push(game.createItem(b.id, "Rye Grain", 'item')); break;
                    case 3: b.onhand.push(game.createItem(b.id, "Barley Grain", 'item')); break;
                    case 4: b.onhand.push(game.createItem(b.id, "Millet Grain", 'item')); break;
                    default: console.log('Harvester target not right land type (got '+ oldTarget.newlandtype +'). No grain created. (coords '+ oldTarget.tileX +','+ oldTarget.tileY +')');
                }
                // All grasses produce wet straw as well
                b.onhand.push(game.createItem(b.id, "Wet Straw", 'item'));
                // Now for the lottery!
                if(Math.random()<0.2) {
                    b.onhand.push(game.createItem(b.id, 
                        DanCommon.getRandomFrom(['Strawberry Seed', 'Rice Seed', 'Potato Seed', 'Carrot Seed', 'Bean Seed', 'Corn Seed',
                                                'Garlic Seed', 'Squash Seed', 'Onion Seed', 'Grape Seed', 'Blueberry Seed']), 'item'
                    ));  // What do each of these do?!? Umm... I don't know yet. We'll figure that out later
                }
                // With items handled, also update the land type of the land we pulled items from
                oldTarget.newlandtype = 12; // this is low-cut grass
                b.hasTarget = false;
            }
        },
        SidePanel: ()=>{
            const Priority = b.ShowPriority;
            const Tools = b.ShowTools;
            const Outputs = b.ShowOutputs;
            return <>
                <Priority />
                <Outputs />
                <Tools />
            </>;
        },
        save: ()=>{
            return {
                priority: b.priority,
                progress: b.progressBar,
                items: b.onhand,
                hasTarget: b.hasTarget?'yes':'no',
                targetX: b.targetX,
                targetY: b.targetY,
                tools: b.toolGroups.map(t=>{
                    return {
                        group: t.group,
                        selected: t.selected,
                        loaded: t.loaded
                    }
                })
            }
        },
        load: (content) => {

            b.priority    = content.priority;
            b.progressBar = content.progress;
            b.onhand      = content.items;
            b.hasTarget   = true;
            if(content.hasTarget==='no') b.hasTarget = false;
            b.targetX     = content.targetX;
            b.targetY     = content.targetY;
            b.toolGroups  = b.toolGroups.map(group => {
                let source = content.tools.find(e=>group.group===e.group);
                group.selected = source.selected;
                group.loaded = (source.loaded==='none')?null:source.loaded;
                return group;
            });
        }
    };

    return Object.assign(b, blockHasWorkerPriority(b), blockHasMultipleOutputs(b), blockRequiresTools(b), blockSharesOutputs(b));
}