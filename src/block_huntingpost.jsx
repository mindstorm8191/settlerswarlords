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
import {blockSharesOutputs} from "./blockSharesOutputs.jsx";

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
        possibleOutputs: ()=>['Dead Deer', 'Dead Wolf', 'Dead Boar', 'Dead Chicken'],
        willAccept: item=>false,    // This block doesn't accept any input items
        takeItem: item=>false,
        fetchItem: itemId=>{
            // Returns an item, if this block has it, or null if it was not found. This is primarily used in the game
            // object to manage food and updating other item stats
            // Since this only has outputs, we can locate the item in our onhand list
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
        destroyItem: itemId=>{
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
        },
        save: ()=>{
            return {
                priority: b.priority,
                progress: b.progressBar,
                items: b.onhand,
                tools: b.toolGroups.map(t=>{
                    return {
                        group: t.group,
                        selected: t.selected,
                        loaded: t.loaded
                    }
                })
            };
        },
        load: content=>{
            // The only thing really special about this is the use of tools
            b.priority    = content.priority;
            b.progressBar = content.progress;
            b.onhand   = content.items;
            b.toolGroups = b.toolGroups.map(group => {
                let source = content.tools.find(e=>group.group===e.group);
                group.selected = source.selected;
                group.loaded = (source.loaded==='none')?null:source.loaded;
                return group;
            });
        }
    }
    return Object.assign(b, blockHasWorkerPriority(b), blockHasMultipleOutputs(b), blockRequiresTools(b), blockSharesOutputs(b));
}