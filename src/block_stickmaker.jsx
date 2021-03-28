/*  block_stickmaker.jsx
    Produces sticks from existing trees in the area
    For the game Settlers & Warlords
*/

import React from "react";
import { imageURL } from "./App.js";
import {ClickableLabel} from "./comp_localMap.jsx";
import {game} from "./game.jsx";
import {blockHasWorkerPriority} from "./blockHasWorkerPriority.jsx";
import {blockHasSelectableCrafting} from "./blockHasSelectableCrafting.jsx";

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
        craftOptions: [
            {name:'Short Stick', craftTime:20, qty:1, img:imageURL+"item_ShortStick.png"},
            {name:'Long Stick', craftTime:20, qty:1, img:imageURL+"item_LongStick.png"}
        ],
        //currentCraft: '',
        toolGroups: [
            {group:'axe', options: ['Flint Stabber', 'Flint Pickaxe'], loaded:null}
        ],
        tool: null,
        hasItem: nameList => {
            // Returns true if this block can output an item in the names list
            return nameList.some(name => b.onhand.some(item=>item.name===name));
        },
        getItem: name => {
            // Returns an item, removing it from this inventory. If the item is not found, this returns null
            let slot = b.onhand.findIndex(item => item.name===name);
            if(slot===-1) return null;
            return b.onhand.splice(slot, 1)[0];
        },
        receiveTool: tool => {
            b.tool = tool;
            return true;
        },
        update: ()=>{
            // Before any work can be done here, a tool must be loaded
            if(b.tool===null) return; // No tool selected
            if(b.currentCraft==='') return; // No item selected to craft
            if(b.onhand.length>=5) return; // We can only hold 5 finished items
            if(game.workPoints<=0) return; // Nobody available to work here
            game.workPoints--;
            //b.progressBar++;
            b.tool.endurance--;
            if(b.tool.endurance<=0) {
                let toolName = b.tool.name;
                b.tool = null; // Oh dear, our tool has broken. We need a new one
                // For now, we'll just request another of the same tool, if there are any available
                let source = game.toolLocation(toolName);
                if(source!=-1) game.blocks[source].requestTool(b, toolName);
            }
            b.progressCraft(1);
        },
        SidePanel: ()=>{
            let toolModes = [
                {name:'selected', bgColor:'green'}, // equipped, with more on the way
                {name:'lastone', bgColor:'orange'}, // equipped, but no more available
                {name:'none', bgColor:'red'},       // not equipped, none available
                {name:'notused', bgColor:'white'},  // not equipped, but at least one available
                {name:'disabled', bgColor:'grey'}   // not available for this job
            ];
            let toolName = 'none';
            if(b.tool!==null) {
                toolName = b.tool.name;
            }
            const [curTool, setCurTool] = React.useState(toolName);
            const [curCraft, setCurCraft] = React.useState(b.currentCraft);
            const Priority = b.ShowPriority;
            const CraftOptions = b.ShowCraftOptions;

            function setNewCraft(newCraft) {
                if(b.currentCraft===newCraft) return;
                b.currentCraft = newCraft;
                b.progressBar = 0;
                setCurCraft(newCraft);
            }

            let outputList = [];
            b.onhand.forEach(e=>{
                let tag = outputList.findIndex(f=>f.name===e.name);
                if(tag===-1) {
                    outputList.push({name:e.name, amount:1});
                }else{
                    outputList[tag].amount++;
                }
            });

            return (
                <>
                    <Priority />
                    <div style={{marginTop:15}}>
                        On Hand: {(b.onhand.length===0)?'nothing':(
                            outputList.map((e,key)=>(<p key={key} className="singleline">{e.name} x{e.amount}</p>))
                        )}
                    </div>
                    <CraftOptions />
                    {/*
                    <div style={{marginTop:15}}>
                        <p>Choose what to craft</p>
                        <ClickableLabel
                            options={craftOptions}
                            mode={curCraft==='Short Stick'?'selected':'other'}
                            onClick={()=>setNewCraft('Short Stick')}
                        >
                            <img src={imageURL+"item_ShortStick.png"} alt="Short Stick" />Short Stick
                        </ClickableLabel>
                        <ClickableLabel
                            options={craftOptions}
                            mode={curCraft==='Long Stick'?'selected':'other'}
                            onClick={()=>setNewCraft('Long Stick')}
                        >
                            <img src={imageURL+"item_LongStick.png"} alt="Long Stick" />Long Stick
                        </ClickableLabel>
                    </div>
                    */}
                    <div style={{marginTop:10}}>Select a tool</div>
                    <ClickableLabel
                        options={toolModes}
                        mode={toolName==='none'?'selected':'other'}
                        onClick={()=>{
                            b.tool = null; // We should probably return the tool to the toolbox, but...
                            b.progressBar = 0;
                            setCurTool(null);
                        }}
                    >
                        None
                    </ClickableLabel>
                    <ClickableLabel
                        options={toolModes}
                        mode={toolName==='Flint Stabber'?'selected':'other'}
                        onClick={cur=>{
                            // Find a tool in a nearby toolbox.
                            let slot = game.toolLocation('Flint Stabber');
                            if(slot===-1) return;  // We didn't find the tool here
                            game.blocks[slot].requestTool(b, 'Flint Stabber');
                            // The tool has been requested... now we just have to wait for it to arrive
                        }}
                    >
                        <img src={imageURL+"item_FlintStabber.png"} alt="Flint Stabber" />Flint Stabber
                    </ClickableLabel>
                </>
            );
        }
    };
    return Object.assign(b, blockHasWorkerPriority(b), blockHasSelectableCrafting(b));
}