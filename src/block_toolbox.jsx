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

function ManhattanDistance(x1,y1,x2,y2) {
    // Computes a manhattan distance between two points
    return Math.abs(x1-x2) + Math.abs(y1-y2);
}

export function Toolbox(mapTile) {
    let b = {
        id: game.getNextBlockId(),
        name: "Toolbox",
        descr: `Lots of tasks require tools, and you'll need to produce tools of all shapes & sizes`,
        usage: `Holds one type of tool, with a max amount you can decide. Move your tools here to make them accessible to all nearby blocks`,
        image: imageURL +'toolbox.png',
        priority: (game.blocks.length===0)?1:game.blocks[game.blocks.length-1].priority+1,
        progressBar: 0,
        progressBarColor: 'orange',
        progressBarMax: 5,
        tileX: mapTile.x,
        tileY: mapTile.y,
        targetId: 0,        // This is the block we're currently working to send a tool to. We'd store the block itself, but it'd be only a
                            // copy here. We need to access the actual target later on
        carrying: null,     // This is the tool being carried to the other location. It won't remain in this inventory
        mode: 'idle',   
        travelCounter: 0,
        travelDistance: 0,
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
        requestTool: (block, toolName)=>{
            // Allows any block to request a tool. Once requested, this block will work to send the tool to that location
            // When the tool arrives, the block's receiveTool function will be called with the tool
            // Pass the tool name the block wishes to receive
            // Returns true if the tool will begin travelling to the target block, or false if there was something preventing this

            if(toolName==='') {
                console.log('Tool request: No tool name was given');
                return false;               // Nothing was requested... what??
            }
            if(block===null) {
                console.log('Tool request: No block provided');
                return false;                // No block type provided... huh?
            }
            if(b.onhand.length===0) {
                console.log('Tool request: We have no tools on hand');
                return false;         // we have nothing here right now
            }
            if(b.onhand[0].name!==toolName) {
                console.log('Tool request: That isnt the tool we have here');
                return false; // They're requesting the wrong tool (toolboxes can only hold one tool type)
            }
            if(b.targetId!==0) {
                console.log('Tool request: We already have a request for this tool');
                return false;             // We're already sending a tool somewhere. They'll have to wait
            }

            // Setup the transfer!
            b.targetId = block.id;
            b.carrying = b.onhand.splice(0,1)[0];
            b.mode = 'send';
            b.travelCounter = 0;
            b.travelDistance = ManhattanDistance(b.tileX, b.tileY, block.tileX, block.tileY);
            // Set up the traveller image
            game.travellers.push({
                blockId: b.id,
                image: imageURL+'movingTool.png',
                x:b.tileX,
                y:b.tileY
            });
            return true;
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
                            if(edge.hasItem(['Flint Knife', 'Flint Stabber'])) {
                                b.onhand.push(edge.getItem(['Flint Knife', 'Flint Stabber']));
                                game.workPoints--;
                                return true;
                            }
                            return false;
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
                    // Instead of trying to determine where the worker should move next, use a travel counter, then do the math on that
                    // to determine location
                    game.workPoints--;
                    b.travelCounter++;
                    //console.log('Toolbox: step '+ )
                    let target = game.blocks.find(e=>e.id===b.targetId);
                    if(b.travelCounter>=b.travelDistance) {
                        // We've reached our destination! Give the tool to the given block
                        if(target.receiveTool(b.carrying)) {
                            b.carrying = null;
                            b.mode = 'gohome';
                            // Update the plotted walker image
                            let w = game.travellers.findIndex(e=>e.blockId===b.id);
                            game.travellers[w].image = imageURL+'movingEmpty.png';
                            b.travelCounter--;
                            return;
                        }
                        // Something went wrong. Take the tool back
                        b.mode = 'bringback';
                        return;
                    }
                    // Update the plotted walker image
                    let walker = game.travellers.findIndex(e=>e.blockId===b.id);
                    if(b.travelCounter <= Math.abs(b.tileX - target.tileX)) {
                        // Work on moving left (or right) first
                        if(b.tileX > target.tileX) { // target is left of source
                            game.travellers[walker].x = b.tileX - b.travelCounter;
                            game.travellers[walker].y = b.tileY;
                        }else{
                            game.travellers[walker].x = b.tileX + b.travelCounter;
                            game.travellers[walker].y = b.tileY;
                        }
                    }else{
                        // Work on moving up (or down)
                        if(b.tileY > target.tileY) {    // target is north of source
                            game.travellers[walker].x = target.tileX;
                            game.travellers[walker].y = target.tileY + (b.travelDistance - b.travelCounter);
                        }else{
                            game.travellers[walker].x = target.tileX;
                            game.travellers[walker].y = target.tileY - (b.travelDistance - b.travelCounter);
                        }
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
        }
    }
    return Object.assign(b, blockHasWorkerPriority(b));
}



