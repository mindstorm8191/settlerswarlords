/*  block_strawdryer.jsx
    Lays straw into piles so it can dry. Requires a twine rake
    For the game Settlers & Warlords
*/

import React from "react";
import {imageURL} from "./App.js";
import {game} from "./game.jsx";
import {blockHasWorkerPriority} from "./blockHasWorkerPriority.jsx";
import {blockHasMultipleOutputs} from "./blockHasMultipleOutputs.jsx";
import {blockRequiresTools} from "./blockRequiresTools.jsx";
import {blockSharesOutputs} from "./blockSharesOutputs.jsx";

export function StrawDryer(mapTile) {
    let b = {
        id: game.getNextBlockId(),
        name: 'Straw Dryer',
        descr: `Freshly cut straw is wet, and can attract mold if used (or stored) while wet. Straw can be dried in a pile in the open,
                but requires regular turning. Rain doesn't bother this drying process much`,
        usage: `Uses a Twine Rake to periodically turn hay, allowing it to dry`,
        image: imageURL +'strawdryer.png',
        progressBar: 0,
        progressBarColor: 'orange',
        progressBarMax: 120,
        tileX: mapTile.x,
        tileY: mapTile.y,
        inItems: [], // we'll only work on one at a time, but we will accept more
        onhand: [],
        toolGroups: [
            {group:'rake', options:['Twine Rake'], required:true, selected:'', loaded:null}
        ],
        possibleOutputs: ()=>['Straw'],
        // willOutput is handled by blockSharesOutputs
        // hasItem '' ''
        // getItem '' ''
        // getItemFrom '' ''
        // findItems '' ''
        willAccept: item => {
            // returns true if this will accept the given item
            return (item.name==='Wet Straw' && b.inItems.length<3);
        },
        takeItem: item => {
            // Stores the given item in this block's inventory. Returns true if successful, or false if not
            if(item.name!=='Wet Straw') return false;
            b.inItems.push(item);   // We don't need to specifically worry about having space here
            return true;
        },
        fetchItem: itemId => {
            let item = b.onhand.find(e=>e.id===itemId);
            if(typeof(item)!=='undefined') return item;
            item = b.inItems.find(e=>e.id===itemId);
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
            slot = b.inItems.findIndex(e=>e.id===itemId);
            if(slot!==-1) {
                b.inItems.splice(slot,1);
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
            if(b.inItems.length===0) return; // Nothing available to work on

            game.workPoints--;
            b.useTools();
            b.progressBar++;
            if(b.progressBar>b.progressBarMax) {
                b.progressBar -= b.progressBarMax;
                // Since there's only one item input for this block, we know what to produce already
                // We still need to register deleting it, though
                game.deleteItem(b.inItems[0].id);
                b.inItems.splice(0,1);
                b.onhand.push(game.createItem(b.id, 'Straw', 'item'));
            }
        },
        SidePanel: ()=>{
            const Priority = b.ShowPriority;
            const Tools = b.ShowTools;
            const Outputs = b.ShowOutputs;
            return <>
                <Priority />
                <p className="singleline">Progress: {Math.floor((b.progressBar/b.progressBarMax)*100)}%</p>
                <Outputs />
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
            };
        },
        load: content => {
            b.priority = content.priority;
            b.progressBar = content.progress;
            b.onhand = content.items;
            b.inItems = content.inputs;
            b.toolGroups = b.toolGroups.map(group => {
                let source = content.tools.find(e=>group.group===e.group);
                group.selected = source.selected;
                group.loaded = (source.loaded==='none')?null:source.loaded;
                return group;
            });
        }
    };

    return Object.assign(b, blockHasWorkerPriority(b), blockHasMultipleOutputs(b), blockRequiresTools(b), blockSharesOutputs(b));
}