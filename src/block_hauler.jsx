/*  block_hauler.jsx
    Hauls items around the map, allowing items to be moved around the map
    For the game Settlers & Warlords
*/

import React from "react";
import {imageURL} from "./App.js";
import {game} from "./game.jsx";
import {blockHasWorkerPriority} from "./blockHasWorkerPriority.jsx";
import {blockMovesWorkers} from "./blockMovesWorkers.jsx";

export function Hauler(mapTile) {
    let b = {
        id: game.getNextBlockId(),
        name: "Hauler",
        descr: `No matter how well you organize your factory, you'll still need to transport items around. Workers can carry most
                items, long as they're not too heavy`,
        usage: `Place Haulers near blocks providing items to move. Select an output, then click the block to send items to.`,
        image: imageURL +'hauler.png',
        progressBar: 0,
        progressBarColor: 'black',
        progressBarMax: 1,
        tileX: parseInt(mapTile.x),
        tileY: parseInt(mapTile.y),
        carrying: null,
        linkItem: '',   // Currently selected item, being used to set up a matching block to send it to. This isn't saved to the database,
                        // since it's an interface setting
        receivedId: -1, // Tracks which block we took an item from. If the item doesn't get delivered, we put it back here (whether it normally fits or not)
        targetList: [], // Keeps track of which items can be taken to which blocks. Structure:
            // destId - Which block we take the item to
            // itemName - name of the item that can be transferred
        mode: 'idle',
        possibleOutputs: ()=>[],      // This doesn't output any items
        hasItems: namesList => false, // This doesn't return any items
        getItem: name => null,        // This doesn't return any items
        getItemFrom: list => null,    // This doesn't return any items
        willAccept: item=>false,
        takeItem: item=>false,
        update: ()=>{
            if(game.workPoints<=0) return; // Can't do anything here without work points
            switch(b.mode) {
                case 'idle':
                    // Hauler is stationed at the start block. Check the list of targets for one to send an item to
                    b.targetList.some(targ=>{
                        // Instead of trying to determine the source block for an item, search all nearby blocks to see if
                        // any can output the desired item
                        let found = game.getNeighbors(b.tileX, b.tileY).find(n=>{
                            return n.willOutput(targ.itemName);
                        });
                        if(typeof(found)==='undefined') return false;   // Note: array.find() returns undefined when it gets no match - not null
                        
                        // Next, see if the destination block will accept this item
                        let destSlot = game.blocks.findIndex(block=>block.id===targ.destId);
                        if(destSlot===-1) {
                            console.log('Error in hauler: target block (id='+ targ.destId +') not found');
                            return false;
                        }
                        // Now, see if this block can accept the item we intend to send
                        if(!game.blocks[destSlot].willAccept({name:targ.itemName, group:'item'})) return false;
                        
                        // This transfer is acceptable. Let's begin!
                        game.workPoints--;
                        b.carrying = found.getItem(targ.itemName);
                        b.receivedId = found.id;
                        b.mode = 'send';
                        b.startMove(game.blocks[destSlot], imageURL+'movingItem.png');

                        return true;
                    });
                break;
                case 'send':
                    game.workPoints--;
                    if(b.takeStep()) {
                        // We need the targetId, which is stored in blockMovesWorkers. Get the actual block slot
                        let blockSlot = game.blocks.findIndex(c=>c.id===b.targetId);
                        if(blockSlot===-1) {
                            console.log('Error in block_hauler: target block doesnt exist (was it deleted?)');
                        }else{
                            if(game.blocks[blockSlot].takeItem(b.carrying)) {
                                b.carrying = null;
                                b.changeMoverImage(imageURL+'movingEmpty.png');
                            }else{
                                console.log('Notice in block_hauler: target block refused item (is inventory full?)');
                            }
                        }
                        b.changeMoverDirection();
                        b.mode = 'gohome';
                    }
                break;
                case 'gohome':
                    game.workPoints--;
                    if(b.takeStep()) {
                        // We've made it back home!
                        // If we're still holding an item, give it back to the block we got it from
                        if(b.carrying!==null) {
                            let sourSlot = game.blocks.find(e=>e.id===b.receivedId);
                            if(sourSlot===-1) { // Well... nobody is here now. Give up the item
                                console.log('Error in block_hauler: rejected item has no home block. Item will be lost');
                            }else{
                                game.blocks[sourSlot].onhand.push(b.carrying);
                            }
                            b.carrying = null;
                        }
                        b.endMove();
                        b.mode = 'idle';
                    }
                break;
            }
        },
        SidePanel: ()=>{
            const Priority = b.ShowPriority;

            const [selectMsg, setSelectMsg] = React.useState(false);

            // Start with a list of all the items we can send from here
            let items = b.availableItems();

            return <>
                <Priority />
                {/*Display each item. While doing so, gather all existing targets for this item and display it*/}
                {(items.length===0)?(
                    'Place next to blocks with an output'
                ):(
                    items.map((ele,key) =>{
                        let existings = b.targetList.filter(e=>e.itemName===ele);
                        return (
                            <div key={key}>
                                <p className="singleline">
                                    {ele}
                                    <button onClick={()=>{
                                        game.pickMode = true;
                                        b.linkItem = ele;
                                        setSelectMsg(true);
                                    }}>
                                        Add Target
                                    </button>
                                </p>
                                {existings.length===0?'':existings.map((red,k2)=>{
                                    let block = game.blocks.find(y=>y.id===red.destId);
                                    if(typeof(block)==='undefined') {
                                        return <p className="singleline">Invalid Entry</p>;
                                    }
                                    return (
                                        <p key={k2} className="singleline" style={{marginLeft:20}}>
                                            {block.name} ({b.distanceTo(block)}) <button>X</button>
                                        </p>
                                    );
                                })}
                            </div>
                        );
                    })
                )}
                {selectMsg?(
                    <p>Click a map block to enable item transfers</p>
                ):''}
            </>;
        },
        availableItems: ()=>{
            // Generates a list of all available items from the neighboring blocks of this one
            let lists = game.getNeighbors(b.tileX, b.tileY).map(n=>{
                if(typeof(n.possibleOutputs)!=='undefined') {
                    return n.possibleOutputs();
                }
                return [];
            });
            if(lists.length===0) return []; // This block doesn't have any neighbors!

            // Lists gives us a 2D array, with possible duplicate items. Go through and only add items we don't already have
            let out = [];
            for(let y=0; y<lists.length; y++) {
                for(let x=0; x<lists[y].length; x++) {
                    if(!out.includes(lists[y][x])) out.push(lists[y][x]);
                }
            }
            return out;
        },
        receiveTarget: blockId =>{
            // Called from the LocalMap component. Accepts a building
            console.log('Receiving target id='+ blockId +' for item '+ b.linkItem);
            let blockSlot = game.blocks.findIndex(e=>e.id===blockId);
            if(blockSlot===-1) return console.log('Error in Hauler->receiveTarget: block id ('+ blockId +') gave no results');
            // Ensure this block will accept the selected item
            if(game.blocks[blockSlot].willAccept({name:b.linkItem, group:'item'})) {
                b.targetList.push({
                    destId: blockId,
                    itemName: b.linkItem
                });
                b.linkItem = '';
            }else{
                console.log('Error: block refused item');
            }
        },
        save:()=>{
            return {
                priority: b.priority,
                mode: b.mode,
                carrying: (b.carrying===null)?'none':b.carrying,
                receivedId: b.receivedId,
                targetList: b.targetList
            };
        },
        load:content=>{
            b.priority   = content.priority;
            b.mode       = content.mode;
            b.carrying   = (content.carrying==='none')?null:content.carrying;
            b.receivedId = content.receivedId;
            b.targetList = content.targetList;
        }
    };
    return Object.assign(b, blockHasWorkerPriority(b), blockMovesWorkers(b));
}