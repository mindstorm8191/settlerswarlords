/*  block_stickmaker.jsx
    Produces sticks from existing trees in the area
    For the game Settlers & Warlords
*/

import React from "react";
import { imageURL } from "./App.js";
import {ClickableLabel} from "./comp_localMap.jsx";
import {game} from "./game.jsx";
import {blockHasWorkerPriority} from "./blockHasWorkerPriority.jsx";

export function StickMaker(mapTile) {
    let b = {
        id: game.getNextBlockId(),
        name: "Stick Maker",
        descr: `The effective use of wood is crucial for continued expansion of your colony. Durable yet easily workable, the woods here
                provides plenty to be made use of`,
        usage: `Cuts down small trees and branches of larger ones to produce sticks of various sizes. Requires tools`,
        image: imageURL +'stickmaker.png',
        progressBar: 0,
        progressBarColor: 'blue',
        progressBarMax: 30,
        tileX: mapTile.x,
        tileY: mapTile.y,
        onhand: [],
        currentCraft: '',
        tool: null,
        hasItem: nameList => {
            // Returns true if this block can output an item in the names list
            return nameList.some(name => b.onhand.some(item=>item.name===name));
        },
        getItem: name => {
            // Returns an item, removing it from this inventory. If the item is not found, this returns null
            let slot = b.onhand.find(item => item.name===name);
            if(slot===-1) return null;
            return b.onhand.splice(slot, 1)[0];
        },
        update: ()=>{
            // Before any work can be done here, a tool must be loaded
            if(b.tool===null) return; // No tool selected
            if(b.currentCraft==='') return; // No item selected to craft
            if(b.onhand.length>=5) return; // We can only hold 5 finished items
            if(game.workpoints<=0) return; // Nobody available to work here
            game.workPoints--;
            b.progressBar++;
            if(b.progressBar>=20) {
                b.onhand.push(game.createItem(b, b.currentCraft, 'item', {}));
                b.progressBar=0;
            }
        },
        SidePanel: hooks =>{
            let labelOptions = [
                {name:'selected', bgColor:'green'},
                {name:'other', bgColor:'red'},
                {name:'disabled', bgColor:'white'}
            ];
            let toolName = 'none';
            if(hooks.find(e=>e.name==='tool').data!==null) {
                toolName = b.tool.name;
            }

            return (
                <>
                    {b.ShowPriority(hooks)}
                    <div style={{marginTop:15}}>
                        On Hand: {(b.onhand.length===0)?'nothing':b.onhand[0].name +' x'+ b.onhand.length}
                    </div>
                    <div style={{marginTop:15}}>
                        <p>Choose what to craft</p>
                        <ClickableLabel
                            options={labelOptions}
                            mode={hooks.find(e=>e.name==='craft').data==='Short Stick'?'selected':'other'}
                            onClick={cur=>{
                                if(b.currentCraft===cur) return;
                                b.currentCraft = 'Short Stick';
                                b.progressBar = 0;
                                hooks.find(e=>e.name==='craft').call('Short Stick');
                            }}
                        >
                            <img src={imageURL+"item_ShortStick.png"} alt="Short Stick" />Short Stick
                        </ClickableLabel>
                        <ClickableLabel
                            options={labelOptions}
                            mode={hooks.find(e=>e.name==='craft').data==='Long Stick'?'selected':'other'}
                            onClick={cur=>{
                                if(b.currentCraft===cur) return;
                                b.currentCraft = 'Long Stick';
                                b.progressBar = 0;
                                hooks.find(e=>e.name==='craft').call('Long Stick');
                            }}
                        >
                            <img src={imageURL+"item_LongStick.png"} alt="Long Stick" />Long Stick
                        </ClickableLabel>
                    </div>
                    <div style={{marginTop:10}}>Select a tool</div>
                    <ClickableLabel
                        options={labelOptions}
                        mode={toolName==='none'?'selected':'other'}
                        onClick={()=>{
                            b.tool = null; // We should probably return the tool to the toolbox, but...
                            b.progressBar = 0;
                            hooks.find(e=>e.name==='tool').call(null);
                        }}
                    >
                        None
                    </ClickableLabel>
                    <ClickableLabel
                        options={labelOptions}
                        mode={toolName==='Flint Stabber'?'selected':'other'}
                        onClick={cur=>{
                            // Find a tool in a nearby toolbox.
                            let slot = game.blocks.findIndex(ele=>{
                                if(ele.name==='Toolbox') {
                                    if(ele.hasItem(['Flint Stabber'])) {
                                        return true;
                                    }
                                }
                                return false;
                            });
                            if(slot===-1) return;  // We didn't find the tool here
                            b.tool = game.blocks[slot].getItem('Flint Stabber');
                            hooks.find(e=>e.name==='tool').call(b.tool);
                        }}
                    >
                        <img src={imageURL+"item_FlintStabber.png"} alt="Flint Stabber" />Flint Stabber
                    </ClickableLabel>
                </>
            );
        }
    };
    return Object.assign(b, blockHasWorkerPriority(b));
}