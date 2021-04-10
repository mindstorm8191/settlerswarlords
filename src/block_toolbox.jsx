/*  block_toolbox.jsx
    Stores tools that can be shared with neighboring blocks
    For the game Settlers & Warlords
*/

/*
I feel like I'm doing this wrong (not the React way), but I don't know what other way to do it. My game uses `setInterval()` to update all
the buildings of the game, where workers produce items or any other work. I had originally placed this inside `useEffect()` of my app's
component, but from there, I was unable to access the (local) React states. To fix this, I moved all the game-centric objects outside
the React structure, and after things are updated, I pass a new copy of these objects into React. I feel like this isn't the correct way
to do things in React, but I'm not sure how to make it work properly
*/

import React from "react";
import {imageURL} from "./App.js";
import {game} from "./game.jsx";
import {blockHasWorkerPriority} from "./blockHasWorkerPriority.jsx";
import {blockMovesWorkers} from "./blockMovesWorkers.jsx";

export function Toolbox(mapTile) {
    let b = {
        id: game.getNextBlockId(),
        name: "Toolbox",
        descr: `Lots of tasks require tools, and you'll need to produce tools of all shapes & sizes`,
        usage: `Holds one type of tool, with a max amount you can decide. Move your tools here to make them accessible to all nearby blocks`,
        image: imageURL +'toolbox.png',
        progressBar: 0,
        progressBarColor: 'orange',
        progressBarMax: 5,
        tileX: parseInt(mapTile.x),
        tileY: parseInt(mapTile.y),
        carrying: null,     // This is the tool being carried to the other location. It won't remain in this inventory
        mode: 'idle',   
        onhand: [],
        hasItem: nameList =>{
            // returns true if this block can output any item in the name list
            return nameList.some(name => {
                return b.onhand.some(item=>item.name===name);
            });
        },
        getItem: name=>{
            // Returns an item, removing it from this inventory
            let slot = b.onhand.find(item => item.name===name);
            if(slot===-1) return null;
            return b.onhand.splice(slot, 1)[0]; // splice returns an array of all deleted items; we only need the one item
        },
        getItemFrom: namesList =>{
            let slot = b.onhand.find(item => namesList.includes(item.name));
            if(slot===-1) return null;
            return b.onhand.splice(slot, 1)[0];
        },
        requestTool: (block, toolName)=>{
            // Allows any block to request a tool. Once requested, this block will work to send the tool to that location
            // When the tool arrives, the block's receiveTool function will be called with the tool
            // Pass the tool name the block wishes to receive
            // Returns true if the tool will begin travelling to the target block, or false if there was something preventing this

            if(toolName==='') { console.log('Tool request: No tool name was given'); return false; }
            if(block===null)  { console.log('Tool request: No block provided');      return false; }
            if(b.onhand.length===0) { console.log('Tool request: We have no tools on hand'); return false; }
            if(b.onhand[0].name!==toolName) {
                console.log('Tool request: Block requested '+ toolName +', we only have '+ b.onhand[0].name +
                            ' here (did you pass the block handle too?)');
                return false;
            }
            if(b.mode!=='idle') return false;

            // Setup the transfer!
            b.carrying = b.onhand.splice(0,1)[0];
            b.mode = 'send';
            b.startMove(block, imageURL+'movingTool.png');
        },
        update: ()=>{
            if(game.workPoints<=0) return;  // Need workers before we can do anything at all
            
            // This block will function in one of several modes
            switch(b.mode) {
                case 'idle':
                    // Search nearby blocks for any tools nearby to collect from them
                    if(b.onhand.length===0) {
                        // We haven't collected any tools yet. We can collect anything. Try to pick up something from a neighboring block
                        let neighbors = game.getNeighbors(b.tileX,b.tileY);
                        neighbors.some(edge => {
                            if(edge.name==="Toolbox") return false; // We don't trade with other tool boxes; it's a pact
                            if(typeof(edge.onhand)==='undefined') return false; // This block doesn't have an outputs array
                            let slot = edge.onhand.findIndex(e=>e.group==='tool');
                            if(slot===-1) return false; // This block is holding no tools
                            
                            b.onhand.push(edge.onhand.splice(slot,1)[0]);
                            game.workPoints--;
                            return true;
                        });
                    }else{
                        if(b.onhand.length>=5) return; // We dont' need to store too many tools...
                        // We already have one item, we can only collect that type again.
                        let neighbors = game.getNeighbors(b.tileX,b.tileY);
                        neighbors.some(edge => {
                            if(edge.hasItem([b.onhand[0].name])) {
                                b.onhand.push(edge.getItem([b.onhand[0].name]));
                                game.workPoints--;
                                return true;
                            }
                            return false;
                        });
                    }
                break;
                case 'send':
                    game.workPoints--;
                    if(b.takeStep()) {
                        // blockMovesWorkers has the target block's ID, we'll have to use it here
                        let target = game.blocks.find(ele=>ele.id===b.targetId);
                        if(target.receiveTool(b.carrying)) {
                            b.carrying = null;
                            b.changeMoverDirection();
                            b.changeMoverImage(imageURL+'movingEmpty.png');
                            b.mode = 'gohome';
                        }
                    }
                break;
                case 'gohome':
                    game.workPoints--;
                    if(b.takeStep()) {
                        b.endMove();
                        b.mode = 'idle';
                    }
                break;
            }
        },
        SidePanel: () => {
            const Priority = b.ShowPriority;
            return (
                <>
                    <Priority />
                    Currently holding: {(b.onhand.length===0)?'nothing':b.onhand[0].name +' x'+ b.onhand.length}
                </>
            );
        },
        save: ()=>{
            // Saves this block's content to the server
            // This one could be harder to reload, because of all the extras, plus the moving images
            let dir = 0;
            if(b.mode==='send') dir=1;
            if(b.mode==='gohome') dir=-1;
            console.log('Toolbox: typeOf travelDistance='+ typeof(b.travelDistance));
            if(isNaN(b.travelDistance)) b.travelDistance = 0;
            if(typeof(b.travelDistance)==='null') b.travelDistance = 0;
            return {
                priority: b.priority,
                carrying: (typeof(b.carrying)==='null')?'none':b.carrying,
                mode: b.mode,
                targetId: b.targetId,
                travelCounter: b.travelCounter,
                travelDistance: b.travelDistance,
                travelDirection: dir,
                curImage: b.curImage,
                items: b.onhand
            };
        },
        load: content=>{
            b.priority = content.priority;
            b.carrying = (content.carrying==='none')?null:content.carrying;
            b.mode           = content.mode;
            b.targetId       = parseInt(content.targetId);
            b.travelCounter  = parseInt(content.travelCounter);
            b.travelDistance  = parseInt(content.travelDistance);
            b.travelDirection = parseInt(content.travelDirection);
            if(typeof(b.travelDirection)==='undefined' || isNaN(b.travelDirection)) {
                switch(b.mode) {
                    case 'send': b.travelDirection = 1; break;
                    case 'gohome': b.travelDirection = -1; break;
                    case 'idle':   b.travelDirection =  0; break;
                    default: {
                        console.log('Error in Toolbox->load(): no mode selected (have '+ b.mode +')');
                        b.travelDirection = 1;
                    }
                }
            }
            b.curImage       = content.curImage;
            b.onhand         = content.items;

            // We would work on setting up the Traveller object. Unfortunately, our target block might not be loaded yet
        },
        finishLoad: ()=>{
            // Here, we only need to call the blockMovesWorker's version of finishLoad
            b.workers_finishLoad();
        }
    }
    return Object.assign(b, blockHasWorkerPriority(b), blockMovesWorkers(b));
}



